package main

import (
	"encoding/json"
	"net/http"
	"os"
	"scrape-go/database"
	"scrape-go/scraper"
	"scrape-go/utils"
)

type ScraperInput struct {
	JobID        int               `json:"job_id"`
	WebsiteURL   string            `json:"website_url"`
	Depth        int               `json:"depth"`
	MaxPages     int               `json:"max_pages"`
	AuthCreds    map[string]string `json:"auth_credentials"`
	DBConnection string            `json:"db_connection"`
}

type ScraperOutput struct {
	Status          string   `json:"status"`
	JobID           int      `json:"job_id"`
	PagesScraped    int      `json:"pages_scraped"`
	PagesFound      int      `json:"pages_found"`
	DurationSeconds float64  `json:"duration_seconds"`
	Errors          []string `json:"errors"`
}

var logger *utils.Logger

func handleScrapeRequest(w http.ResponseWriter, r *http.Request) {
	// Only accept POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var input ScraperInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		logger.Error("Failed to parse request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	logger.Info("Received scraping request for job %d", input.JobID)
	logger.Info("URL: %s, Depth: %d", input.WebsiteURL, input.Depth)

	// Process scraping in a goroutine (non-blocking)
	go func() {
		// Connect to database
		db, err := database.Connect(input.DBConnection)
		if err != nil {
			logger.Error("Database connection failed: %v", err)
			return
		}
		defer db.Close()

		logger.Info("Database connected for job %d", input.JobID)

		// Run scraper
		_, err = scraper.Scrape(db, input.JobID, input.WebsiteURL, input.Depth, input.AuthCreds, logger)
		if err != nil {
			logger.Error("Scraping failed for job %d: %v", input.JobID, err)
			return
		}

		logger.Info("Scraping completed successfully for job %d", input.JobID)
	}()

	// Return immediate response
	output := ScraperOutput{
		Status: "accepted",
		JobID:  input.JobID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(output)
}

func handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "go-scraper",
	})
}

func main() {
	logger = utils.NewLogger()

	// Get port from environment or use default
	port := os.Getenv("GO_SCRAPER_PORT")
	if port == "" {
		port = "8001"
	}

	// Setup HTTP routes
	http.HandleFunc("/scrape", handleScrapeRequest)
	http.HandleFunc("/health", handleHealthCheck)

	logger.Info("Go scraper service starting on port %s", port)
	logger.Info("Endpoints:")
	logger.Info("  POST /scrape  - Start scraping job")
	logger.Info("  GET  /health  - Health check")

	// Start HTTP server
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		logger.Fatal("Failed to start server: %v", err)
	}
}
