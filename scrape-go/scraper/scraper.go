package scraper

import (
	"fmt"
	"scrape-go/database"
	"scrape-go/utils"
	"time"
)

type Result struct {
	PagesScraped int
	PagesFound   int
	Duration     float64
	Errors       []string
}

// Scrape performs the main scraping operation
func Scrape(db *database.DB, jobID int, websiteURL string, depth int, authCreds map[string]string, logger *utils.Logger) (*Result, error) {
	startTime := time.Now()

	// Update job status to discovering
	if err := db.UpdateJobStatus(jobID, "discovering"); err != nil {
		return nil, fmt.Errorf("failed to update job status: %w", err)
	}

	logger.Info("Starting discovery and scraping with chromedp...")

	// Perform crawling and scraping with chromedp
	crawlErr := Crawl(db, jobID, websiteURL, depth, logger)
	if crawlErr != nil {
		db.SetJobError(jobID, crawlErr.Error())
		return nil, fmt.Errorf("scraping failed: %w", crawlErr)
	}

	logger.Info("Scraping complete")

	// Complete the job
	if err := db.CompleteJob(jobID); err != nil {
		return nil, fmt.Errorf("failed to complete job: %w", err)
	}

	duration := time.Since(startTime).Seconds()

	return &Result{
		PagesScraped: 0, // Will be updated by Crawl function
		PagesFound:   0, // Will be updated by Crawl function
		Duration:     duration,
		Errors:       []string{},
	}, nil
}
