package scraper

import (
	"context"

	"github.com/chromedp/chromedp"
)

// BrowserPool manages a pool of browser allocators (not contexts!)
// Each allocator represents a browser instance, and we create new contexts (tabs) for each page
type BrowserPool struct {
	allocators   []context.Context
	allocCancels []context.CancelFunc
	pool         chan context.Context
	size         int
}

func NewBrowserPool(size int) (*BrowserPool, error) {
	bp := &BrowserPool{
		allocators:   make([]context.Context, size),
		allocCancels: make([]context.CancelFunc, size),
		pool:         make(chan context.Context, size),
		size:         size,
	}

	// Create browser allocators (browser instances)
	for i := 0; i < size; i++ {
		allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(),
			chromedp.NoFirstRun,
			chromedp.NoDefaultBrowserCheck,
			chromedp.Headless,
			chromedp.DisableGPU,
		)

		bp.allocators[i] = allocCtx
		bp.allocCancels[i] = allocCancel
		bp.pool <- allocCtx
	}

	return bp, nil
}

// AcquireAllocator gets an allocator from the pool (to create contexts from)
func (bp *BrowserPool) AcquireAllocator() context.Context {
	return <-bp.pool
}

// ReleaseAllocator returns an allocator to the pool
func (bp *BrowserPool) ReleaseAllocator(allocCtx context.Context) {
	bp.pool <- allocCtx
}

func (bp *BrowserPool) Close() {
	for i := 0; i < bp.size; i++ {
		bp.allocCancels[i]()
	}
}
