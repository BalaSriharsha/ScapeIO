package utils

import (
	"net/url"
	"strings"
)

// ExtractDomain extracts the domain from a URL
func ExtractDomain(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	return u.Host
}

// NormalizeURL normalizes a URL by removing fragments and trailing slashes
func NormalizeURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}

	// Remove fragment
	u.Fragment = ""

	// Remove trailing slash
	u.Path = strings.TrimSuffix(u.Path, "/")

	return u.String()
}

// IsValidURL checks if a URL is valid
func IsValidURL(rawURL string) bool {
	_, err := url.Parse(rawURL)
	return err == nil
}

// IsSameDomain checks if two URLs are from the same domain
func IsSameDomain(url1, url2 string) bool {
	return ExtractDomain(url1) == ExtractDomain(url2)
}

// CleanText removes extra whitespace from text
func CleanText(text string) string {
	// Replace multiple spaces with single space
	text = strings.Join(strings.Fields(text), " ")
	return strings.TrimSpace(text)
}
