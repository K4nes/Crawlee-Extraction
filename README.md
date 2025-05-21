# Crawlee Web Scraper

A flexible web scraping tool built with [Crawlee](https://crawlee.dev/) to extract structured data from websites.

## Features

- Interactive command-line interface for specifying target URLs
- Configurable crawl depth and request limits
- Extracts comprehensive page data including:
  - Page titles and meta descriptions
  - Paragraph content
  - Links with text and URLs
  - Image details (src, alt text, dimensions)
- Automatic same-hostname link discovery and crawling
- Results stored in structured JSON format
- Data export functionality to single file

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn package manager

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/K4nes/Crawlee-Extraction.git
   cd Crawlee-Extraction
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. This will automatically install required Playwright browsers due to the postinstall script.

## Usage

Start the crawler with:

```bash
npm start
```

### Crawler Configuration

When you run the scraper, you'll be prompted to enter:

1. The target URL to crawl (e.g., https://example.com)
2. Maximum number of pages to crawl (default: 50)

The crawler will then process the pages and extract the data.

## Output

Crawled data is stored in two locations:

1. **Individual records**: `./storage/datasets/{hostname}/` - Contains separate JSON files for each crawled page.
2. **Consolidated export**: `./storage/exports/{hostname}.json` - All crawled data in a single JSON file.

The hostname is derived from the target URL (e.g., "docs_saharalabs_ai" for "https://docs.saharalabs.ai").
