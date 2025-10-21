BINARY_NAME=scraper
BUILD_DIR=bin

.PHONY: all build clean test install-deps

all: install-deps build

build:
	@echo "Building Go scraper..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) main.go
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete"

test:
	@echo "Running tests..."
	@go test ./...

install-deps:
	@echo "Installing dependencies..."
	@go mod download
	@echo "Dependencies installed"

run: build
	@echo "Running scraper..."
	@./$(BUILD_DIR)/$(BINARY_NAME)

