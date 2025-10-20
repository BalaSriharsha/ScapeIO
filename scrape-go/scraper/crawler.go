package scraper

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"sync"
	"time"

	"scrape-go/database"
	"scrape-go/utils"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/chromedp"
)

// URLDepth represents a URL with its depth level
type URLDepth struct {
	URL   string
	Depth int
}

// Crawl performs BFS discovery and concurrent scraping with chromedp
func Crawl(db *database.DB, jobID int, baseURL string, maxDepth int, logger *utils.Logger) error {
	baseParsed, err := url.Parse(baseURL)
	if err != nil {
		return fmt.Errorf("invalid base URL: %w", err)
	}

	// Remove fragment from base URL to ensure clean starting point
	baseParsed.Fragment = ""
	baseURL = baseParsed.String()
	baseDomain := baseParsed.Host

	// Phase 1: Discovery with chromedp (Hybrid parallel by depth level)
	logger.Info("Phase 1: Discovering pages with browser pool...")

	// Create browser pool for discovery (5 contexts)
	browserPool, err := NewBrowserPool(5)
	if err != nil {
		return fmt.Errorf("failed to create browser pool: %w", err)
	}
	defer browserPool.Close()

	discovered := make(map[string]int)
	discoveredMutex := sync.Mutex{}

	// Start with base URL (already normalized without fragment)
	currentLevel := []URLDepth{{URL: baseURL, Depth: 0}}
	discovered[baseURL] = 0

	for currentDepth := 0; currentDepth <= maxDepth; currentDepth++ {
		if len(currentLevel) == 0 {
			break
		}

		logger.Info("Processing depth %d: %d URLs", currentDepth, len(currentLevel))

		// Process current level in parallel
		nextLevel := processLevelInParallel(
			browserPool,
			currentLevel,
			baseDomain,
			jobID,
			db,
			&discovered,
			&discoveredMutex,
			logger,
		)

		// Filter next level: only URLs at depth+1 that haven't been discovered
		var filteredNext []URLDepth
		discoveredMutex.Lock()
		for _, urlDepth := range nextLevel {
			if _, exists := discovered[urlDepth.URL]; !exists {
				discovered[urlDepth.URL] = urlDepth.Depth
				filteredNext = append(filteredNext, urlDepth)
			}
		}
		discoveredMutex.Unlock()

		currentLevel = filteredNext
	}

	logger.Info("Discovery complete: %d pages found", len(discovered))

	// Update job status to scraping
	db.UpdateJobStatus(jobID, "scraping")

	// Phase 2: Concurrent scraping with chromedp
	logger.Info("Phase 2: Scraping %d pages with 10 workers...", len(discovered))

	// Convert discovered map to slice
	urlsToScrape := make([]URLDepth, 0, len(discovered))
	for u, d := range discovered {
		urlsToScrape = append(urlsToScrape, URLDepth{URL: u, Depth: d})
	}

	// Concurrent scraping with worker pool (REDUCED TO 10 WORKERS)
	numWorkers := 10
	urlChan := make(chan URLDepth, len(urlsToScrape))
	var wg sync.WaitGroup
	var processedCount int
	var processedMutex sync.Mutex

	// Start workers
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()

			for urlDepth := range urlChan {
				// Update status to in_progress
				db.UpdateScrapedPageStatus(jobID, urlDepth.URL, "in_progress", 0, nil)

				// Scrape the page with chromedp (independent context per page)
				content, err := scrapePageWithChrome(urlDepth.URL, logger)
				if err != nil {
					logger.Error("Worker %d: Failed to scrape %s: %v", workerID, urlDepth.URL, err)
					errMsg := err.Error()
					db.UpdateScrapedPageStatus(jobID, urlDepth.URL, "failed", 0, &errMsg)

					// Update processed count for failed pages
					processedMutex.Lock()
					processedCount++
					db.UpdateJobProgress(jobID, len(discovered), processedCount, "")
					processedMutex.Unlock()
					continue
				}

				if len(content) < 100 {
					logger.Info("Worker %d: Skipped %s (insufficient content: %d chars)", workerID, urlDepth.URL, len(content))
					errMsg := "Insufficient content"
					db.UpdateScrapedPageStatus(jobID, urlDepth.URL, "skipped", len(content), &errMsg)

					// Update processed count for skipped pages too
					processedMutex.Lock()
					processedCount++
					db.UpdateJobProgress(jobID, len(discovered), processedCount, "")
					processedMutex.Unlock()
					continue
				}

				// Store the scraped content in chunks
				err = storeContentInChunks(db, jobID, urlDepth.URL, content)
				if err != nil {
					logger.Error("Worker %d: Failed to store content for %s: %v", workerID, urlDepth.URL, err)
					errMsg := err.Error()
					db.UpdateScrapedPageStatus(jobID, urlDepth.URL, "failed", len(content), &errMsg)

					// Update processed count for failed pages
					processedMutex.Lock()
					processedCount++
					db.UpdateJobProgress(jobID, len(discovered), processedCount, "")
					processedMutex.Unlock()
					continue
				}

				// Update page status to completed
				db.UpdateScrapedPageStatus(jobID, urlDepth.URL, "completed", len(content), nil)

				// Update processed count for successfully scraped pages
				processedMutex.Lock()
				processedCount++
				db.UpdateJobProgress(jobID, len(discovered), processedCount, urlDepth.URL)
				processedMutex.Unlock()

				logger.Info("Worker %d: Scraped %s (%d chars)", workerID, urlDepth.URL, len(content))
			}
		}(i)
	}

	// Send URLs to workers
	for _, urlDepth := range urlsToScrape {
		urlChan <- urlDepth
	}
	close(urlChan)

	// Wait for all workers to finish
	wg.Wait()

	logger.Info("Scraping complete: %d pages processed", processedCount)

	// Mark job as completed
	db.CompleteJob(jobID)
	db.UpdateJobProgress(jobID, len(discovered), processedCount, "")

	return nil
}

// processLevelInParallel processes URLs at a given depth level in parallel
func processLevelInParallel(
	browserPool *BrowserPool,
	urls []URLDepth,
	baseDomain string,
	jobID int,
	db *database.DB,
	discovered *map[string]int,
	mutex *sync.Mutex,
	logger *utils.Logger,
) []URLDepth {
	var wg sync.WaitGroup
	resultChan := make(chan []URLDepth, len(urls))
	semaphore := make(chan struct{}, 5) // 5 parallel workers

	for _, urlDepth := range urls {
		wg.Add(1)
		go func(ud URLDepth) {
			defer wg.Done()
			semaphore <- struct{}{}        // Acquire
			defer func() { <-semaphore }() // Release

			// Insert page record
			err := db.InsertScrapedPage(jobID, ud.URL, ud.Depth, "pending")
			if err != nil {
				logger.Error("Failed to insert page %s: %v", ud.URL, err)
				resultChan <- []URLDepth{}
				return
			}

			mutex.Lock()
			count := len(*discovered)
			mutex.Unlock()
			logger.Info("Discovered [%d]: %s (depth %d)", count, ud.URL, ud.Depth)
			db.UpdateJobProgress(jobID, count, 0, ud.URL)

			// Extract links using browser pool
			links, err := extractLinksWithPool(browserPool, ud.URL, baseDomain, logger)
			if err != nil {
				logger.Error("Failed to extract links from %s: %v", ud.URL, err)
				errMsg := err.Error()
				db.UpdateScrapedPageStatus(jobID, ud.URL, "failed", 0, &errMsg)
				resultChan <- []URLDepth{}
				return
			}

			// Convert links to URLDepth
			var nextURLs []URLDepth
			for _, link := range links {
				nextURLs = append(nextURLs, URLDepth{URL: link, Depth: ud.Depth + 1})
			}
			resultChan <- nextURLs
		}(urlDepth)
	}

	wg.Wait()
	close(resultChan)

	// Collect all results
	var allNext []URLDepth
	for links := range resultChan {
		allNext = append(allNext, links...)
	}

	return allNext
}

// extractLinksWithPool extracts links from a page using browser pool with adaptive waits
func extractLinksWithPool(browserPool *BrowserPool, pageURL, baseDomain string, logger *utils.Logger) ([]string, error) {
	var htmlContent string

	// Acquire allocator from pool (browser instance)
	allocCtx := browserPool.AcquireAllocator()
	defer browserPool.ReleaseAllocator(allocCtx)

	// Create a NEW context (tab) for this page - each page gets its own tab
	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Reduced timeout: 15 seconds for discovery (was 60s)
	pageCtx, pageCancel := context.WithTimeout(ctx, 15*time.Second)
	defer pageCancel()

	err := chromedp.Run(pageCtx,
		chromedp.Navigate(pageURL),
		chromedp.WaitReady("body", chromedp.ByQuery), // Wait for body to be ready

		// Quick cookie consent check (500ms max, was 2s)
		chromedp.ActionFunc(func(ctx context.Context) error {
			checkCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
			defer cancel()

			// Quick check for common selectors
			quickSelectors := []string{
				`button[class*="accept" i]`,
				`button[id*="accept" i]`,
				`a[class*="accept" i]`,
			}

			for _, selector := range quickSelectors {
				var nodes []*cdp.Node
				if chromedp.Nodes(selector, &nodes, chromedp.ByQuery).Do(checkCtx) == nil && len(nodes) > 0 {
					chromedp.Click(selector, chromedp.ByQuery).Do(ctx)
					return nil
				}
			}
			return nil
		}),

		// Get HTML immediately (no scrolling needed for discovery)
		chromedp.OuterHTML("html", &htmlContent),
	)

	if err != nil {
		return nil, fmt.Errorf("chromedp error: %w", err)
	}

	// Parse HTML and extract links (same as before)
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Extract links with prioritization
	links := make([]string, 0)
	seen := make(map[string]bool)

	// Priority 1: Header and navigation links
	doc.Find("header a[href], nav a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	// Priority 2: Footer links
	doc.Find("footer a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	// Priority 3: Main content links
	doc.Find("main a[href], article a[href], section a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	// Priority 4: All other links
	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	return links, nil
}

// extractLinksWithChrome extracts links from a page using chromedp (JavaScript support)
// DEPRECATED: Use extractLinksWithPool instead
func extractLinksWithChrome(pageURL, baseDomain string, logger *utils.Logger) ([]string, error) {
	var htmlContent string

	// Create independent chromedp context for this page only
	allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(),
		chromedp.NoFirstRun,
		chromedp.NoDefaultBrowserCheck,
		chromedp.Headless,
		chromedp.DisableGPU,
	)
	defer allocCancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Create a timeout for this specific page (increased to 60s for slow pages)
	pageCtx, pageCancel := context.WithTimeout(ctx, 60*time.Second)
	defer pageCancel()

	err := chromedp.Run(pageCtx,
		chromedp.Navigate(pageURL),
		chromedp.WaitReady("body", chromedp.ByQuery), // Wait for body to be ready
		chromedp.Sleep(3*time.Second),                // Wait for initial JavaScript to execute

		// Handle cookie consent dialogs (non-blocking)
		chromedp.ActionFunc(func(ctx context.Context) error {
			// Try to find and click common cookie consent buttons
			cookieSelectors := []string{
				`button[class*="accept" i]`,
				`button[class*="cookie" i]`,
				`button[id*="accept" i]`,
				`button[id*="cookie" i]`,
				`a[class*="accept" i]`,
				`a[class*="cookie" i]`,
				`button:contains("Accept")`,
				`button:contains("I agree")`,
				`button:contains("OK")`,
				`button:contains("Got it")`,
				`[role="button"][class*="accept" i]`,
				`[role="button"][class*="cookie" i]`,
			}

			for _, selector := range cookieSelectors {
				// Use a short timeout for each selector check
				checkCtx, checkCancel := context.WithTimeout(ctx, 2*time.Second)
				defer checkCancel()

				var nodes []*cdp.Node
				err := chromedp.Nodes(selector, &nodes, chromedp.ByQuery).Do(checkCtx)
				if err == nil && len(nodes) > 0 && len(nodes[0].Children) >= 0 {
					// Try to click, but don't fail if it doesn't work
					clickErr := chromedp.Click(selector, chromedp.ByQuery).Do(ctx)
					if clickErr == nil {
						logger.Info("Accepted cookies on %s using selector: %s", pageURL, selector)
						chromedp.Sleep(1 * time.Second).Do(ctx)
						return nil
					}
				}
			}
			// No cookie dialog found or couldn't click - that's okay, continue
			return nil
		}),

		chromedp.Sleep(2*time.Second), // Wait for page to settle

		// Scroll to load lazy content
		chromedp.Evaluate(`
			window.scrollTo(0, document.body.scrollHeight / 2);
		`, nil),
		chromedp.Sleep(500*time.Millisecond),
		chromedp.Evaluate(`window.scrollTo(0, document.body.scrollHeight)`, nil),
		chromedp.Sleep(1*time.Second),

		chromedp.OuterHTML("html", &htmlContent),
	)

	if err != nil {
		return nil, fmt.Errorf("chromedp error: %w", err)
	}

	// Parse HTML with goquery
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Extract links with prioritization
	links := make([]string, 0)
	seen := make(map[string]bool)

	// Priority 1: Header and navigation links
	doc.Find("header a[href], nav a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	// Priority 2: Footer links
	doc.Find("footer a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	// Priority 3: Main content links
	doc.Find("main a[href], article a[href], section a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	// Priority 4: All other links
	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		addLink(s, pageURL, baseDomain, &links, seen)
	})

	return links, nil
}

// addLink adds a link if valid
func addLink(s *goquery.Selection, pageURL, baseDomain string, links *[]string, seen map[string]bool) {
	href, exists := s.Attr("href")
	if !exists {
		return
	}

	// Resolve relative URLs
	absoluteURL, err := url.Parse(href)
	if err != nil {
		return
	}

	baseURLParsed, _ := url.Parse(pageURL)
	resolvedURL := baseURLParsed.ResolveReference(absoluteURL)

	// Remove fragment (hash) from URL to avoid duplicate pages
	resolvedURL.Fragment = ""
	fullURL := resolvedURL.String()

	// Check if same domain and scrapable
	if isSameDomain(fullURL, baseDomain) && isScrapableURL(fullURL) {
		if !seen[fullURL] {
			seen[fullURL] = true
			*links = append(*links, fullURL)
		}
	}
}

// scrapePageWithChrome scrapes a page using chromedp with cookie consent handling
func scrapePageWithChrome(pageURL string, logger *utils.Logger) (string, error) {
	var htmlContent string

	// Create independent chromedp context for this page only
	allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(),
		chromedp.NoFirstRun,
		chromedp.NoDefaultBrowserCheck,
		chromedp.Headless,
		chromedp.DisableGPU,
	)
	defer allocCancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Create a timeout for this specific page (increased to 60s for slow pages)
	pageCtx, pageCancel := context.WithTimeout(ctx, 60*time.Second)
	defer pageCancel()

	err := chromedp.Run(pageCtx,
		chromedp.Navigate(pageURL),
		chromedp.WaitReady("body", chromedp.ByQuery), // Wait for body to be ready
		chromedp.Sleep(3*time.Second),                // Wait for initial JavaScript

		// Handle cookie consent dialogs (non-blocking)
		chromedp.ActionFunc(func(ctx context.Context) error {
			cookieSelectors := []string{
				`button[class*="accept" i]`,
				`button[class*="cookie" i]`,
				`button[id*="accept" i]`,
				`button[id*="cookie" i]`,
				`a[class*="accept" i]`,
				`a[class*="cookie" i]`,
				`button:contains("Accept")`,
				`button:contains("I agree")`,
				`button:contains("OK")`,
				`button:contains("Got it")`,
				`[role="button"][class*="accept" i]`,
				`[role="button"][class*="cookie" i]`,
			}

			for _, selector := range cookieSelectors {
				// Use a short timeout for each selector check
				checkCtx, checkCancel := context.WithTimeout(ctx, 2*time.Second)
				defer checkCancel()

				var nodes []*cdp.Node
				err := chromedp.Nodes(selector, &nodes, chromedp.ByQuery).Do(checkCtx)
				if err == nil && len(nodes) > 0 && len(nodes[0].Children) >= 0 {
					// Try to click, but don't fail if it doesn't work
					clickErr := chromedp.Click(selector, chromedp.ByQuery).Do(ctx)
					if clickErr == nil {
						chromedp.Sleep(1 * time.Second).Do(ctx)
						return nil
					}
				}
			}
			// No cookie dialog found or couldn't click - that's okay, continue
			return nil
		}),

		chromedp.Sleep(2*time.Second),

		// Scroll to load all content (multiple times)
		chromedp.Evaluate(`
			(async () => {
				for (let i = 0; i < 5; i++) {
					window.scrollTo(0, document.body.scrollHeight);
					await new Promise(resolve => setTimeout(resolve, 500));
				}
				window.scrollTo(0, 0);
			})()
		`, nil),

		chromedp.Sleep(2*time.Second), // Increased wait after scrolling

		chromedp.OuterHTML("html", &htmlContent),
	)

	if err != nil {
		return "", fmt.Errorf("chromedp error: %w", err)
	}

	// Parse and extract text
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Remove script, style, noscript tags
	doc.Find("script, style, noscript").Remove()

	// Get text content
	text := doc.Find("body").Text()

	// Clean up whitespace
	text = strings.Join(strings.Fields(text), " ")

	return text, nil
}

// isSameDomain checks if URL is from the same domain
func isSameDomain(urlStr, baseDomain string) bool {
	parsed, err := url.Parse(urlStr)
	if err != nil {
		return false
	}
	return parsed.Host == baseDomain
}

// isScrapableURL checks if URL should be scraped
func isScrapableURL(urlStr string) bool {
	excludedExtensions := []string{
		".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico",
		".zip", ".rar", ".tar", ".gz", ".mp4", ".mp3", ".avi",
		".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
	}

	lowerURL := strings.ToLower(urlStr)
	for _, ext := range excludedExtensions {
		if strings.HasSuffix(lowerURL, ext) {
			return false
		}
	}

	return true
}

// storeContentInChunks splits content into chunks and stores in database
func storeContentInChunks(db *database.DB, jobID int, pageURL, content string) error {
	const maxChunkSize = 8000
	const overlap = 800

	if len(content) <= maxChunkSize {
		return db.InsertScrapedData(jobID, pageURL, content)
	}

	// Split into overlapping chunks
	for start := 0; start < len(content); start += (maxChunkSize - overlap) {
		end := start + maxChunkSize
		if end > len(content) {
			end = len(content)
		}

		chunk := content[start:end]

		if len(strings.TrimSpace(chunk)) > 100 {
			err := db.InsertScrapedData(jobID, pageURL, chunk)
			if err != nil {
				return err
			}
		}

		if end >= len(content) {
			break
		}
	}

	return nil
}
