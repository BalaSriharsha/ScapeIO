package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

type DB struct {
	conn *sql.DB
}

// Connect establishes a connection to PostgreSQL
func Connect(connStr string) (*DB, error) {
	// Add sslmode=disable if not present in connection string
	if !contains(connStr, "sslmode=") {
		if contains(connStr, "?") {
			connStr += "&sslmode=disable"
		} else {
			connStr += "?sslmode=disable"
		}
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{conn: db}, nil
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) &&
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
			len(s) > len(substr) && findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// UpdateJobStatus updates the status of a scraping job
func (db *DB) UpdateJobStatus(jobID int, status string) error {
	query := `UPDATE scraping_jobs SET status = $1 WHERE id = $2`
	_, err := db.conn.Exec(query, status, jobID)
	return err
}

// UpdateJobProgress updates the progress of a scraping job
func (db *DB) UpdateJobProgress(jobID int, pagesFound, pagesScraped int, currentURL string) error {
	query := `UPDATE scraping_jobs 
			  SET pages_found = $1, pages_scraped = $2, current_url = $3
			  WHERE id = $4`
	_, err := db.conn.Exec(query, pagesFound, pagesScraped, currentURL, jobID)
	return err
}

// SetJobError sets an error message for a job
func (db *DB) SetJobError(jobID int, errorMsg string) error {
	query := `UPDATE scraping_jobs 
			  SET status = 'failed', error_message = $1
			  WHERE id = $2`
	_, err := db.conn.Exec(query, errorMsg, jobID)
	return err
}

// CompleteJob marks a job as completed
func (db *DB) CompleteJob(jobID int) error {
	query := `UPDATE scraping_jobs 
			  SET status = 'completed', completed_at = NOW()
			  WHERE id = $1`
	_, err := db.conn.Exec(query, jobID)
	return err
}

// InsertScrapedPage inserts or updates a scraped page record
func (db *DB) InsertScrapedPage(jobID int, url string, depth int, status string) error {
	query := `INSERT INTO scraped_pages (job_id, url, depth, status, scraped_at)
			  VALUES ($1, $2, $3, $4, NOW())
			  ON CONFLICT (job_id, url) DO UPDATE 
			  SET status = $4, scraped_at = NOW()`
	_, err := db.conn.Exec(query, jobID, url, depth, status)
	return err
}

// UpdateScrapedPageStatus updates the status of a scraped page
func (db *DB) UpdateScrapedPageStatus(jobID int, url string, status string, contentLength int, errorMsg *string) error {
	if errorMsg != nil {
		query := `UPDATE scraped_pages 
				  SET status = $1, content_length = $2, error_message = $3, scraped_at = NOW() 
				  WHERE job_id = $4 AND url = $5`
		_, err := db.conn.Exec(query, status, contentLength, *errorMsg, jobID, url)
		return err
	} else {
		query := `UPDATE scraped_pages 
				  SET status = $1, content_length = $2, scraped_at = NOW() 
				  WHERE job_id = $3 AND url = $4`
		_, err := db.conn.Exec(query, status, contentLength, jobID, url)
		return err
	}
}

// InsertScrapedData inserts scraped content into the database
func (db *DB) InsertScrapedData(jobID int, url string, content string) error {
	query := `INSERT INTO scraped_data (job_id, url, content, created_at)
			  VALUES ($1, $2, $3, NOW())`
	_, err := db.conn.Exec(query, jobID, url, content)
	return err
}

// GetJobInfo retrieves basic job information
func (db *DB) GetJobInfo(jobID int) (string, string, int, error) {
	var websiteURL, status string
	var depth int
	query := `SELECT website_url, status, depth FROM scraping_jobs WHERE id = $1`
	err := db.conn.QueryRow(query, jobID).Scan(&websiteURL, &status, &depth)
	if err != nil {
		return "", "", 0, err
	}
	return websiteURL, status, depth, nil
}
