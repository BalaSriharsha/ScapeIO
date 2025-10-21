#!/bin/bash

# Start Go scraper as a standalone service

cd scrape-go

echo "Starting Go Scraper Service..."
echo "Port: ${GO_SCRAPER_PORT:-8001}"
echo ""

# Run the scraper
./bin/scraper

