package database

import "time"

type ScrapingJob struct {
	ID           int
	UserID       int
	WebsiteURL   string
	JobName      string
	Status       string
	Depth        int
	PagesFound   int
	PagesScraped int
	CurrentURL   string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	ErrorMessage string
}

type ScrapedPage struct {
	ID            int
	JobID         int
	URL           string
	Status        string
	Depth         int
	ContentLength int
	ErrorMessage  string
	ScrapedAt     time.Time
}

type ScrapedData struct {
	ID        int
	JobID     int
	URL       string
	Content   string
	CreatedAt time.Time
}
