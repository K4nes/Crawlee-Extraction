import { PlaywrightCrawler, Dataset } from "crawlee";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

/**
 * This is a web scraping script built with Crawlee
 * It will crawl a website and extract various information from its pages
 */

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to get user input
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Function to create the crawler with user-defined options
function createCrawler(
  startUrl: string,
  maxRequestsPerCrawl: number,
  headless: boolean = true
) {
  // Log the URL that will be crawled (using the startUrl parameter)
  console.log(`Setting up crawler for: ${startUrl}`);

  return new PlaywrightCrawler({
    // This function will be called for each URL
    async requestHandler({ request, page, enqueueLinks, log }) {
      log.info(`Processing ${request.url}...`);

      // Extract data from the page using Playwright's API
      const title = await page.title();

      const metaDescription = await page
        .$eval(
          'meta[name="description"]',
          (el) => el.getAttribute("content") || ""
        )
        .catch(() => "No meta description found");

      // Extract all paragraph texts
      const paragraphTexts = await page.$$eval("p", (elements) =>
        elements.map((el) => el.textContent?.trim() || "")
      );

      // Extract all links on the page
      const links = await page.$$eval("a", (elements) =>
        elements.map((el) => ({
          href: el.href,
          text: el.textContent?.trim() || "",
        }))
      );

      // Extract all images on the page
      const images = await page.$$eval("img", (elements) =>
        elements.map((el) => ({
          src: el.src,
          alt: el.alt || "",
          width: el.width,
          height: el.height,
        }))
      );

      // Log some information to the console
      log.info(`Title of ${request.loadedUrl} is '${title}'`);

      // Store the results to the dataset
      await Dataset.pushData({
        url: request.loadedUrl,
        title,
        metaDescription,
        paragraphs: paragraphTexts,
        links,
        images,
        // You can extract additional data here as needed
      });

      // Add newly found links to the queue for crawling
      // This will only enqueue links that are found on the same hostname
      await enqueueLinks({
        strategy: "same-hostname",
      });
    },

    // Limit the number of requests based on user input
    maxRequestsPerCrawl,

    // Set browser visibility based on user input
    headless,

    // Set a timeout for navigation
    navigationTimeoutSecs: 60,
  });
}

// Function to export dataset to a single JSON file
async function exportDatasetToSingleFile(datasetName: string): Promise<string> {
  try {
    // Create the storage directory if it doesn't exist
    const storageDir = path.join(process.cwd(), "storage", "exports");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Define the output file path
    const outputFilePath = path.join(storageDir, `${datasetName}.json`);

    // Get all items from the dataset
    const dataset = await Dataset.open(datasetName);
    const { items } = await dataset.getData();

    // Filter out the h1 field from all items
    const cleanedItems = items.map((item) => {
      // Create a new object without the h1 field
      const { h1, ...cleanItem } = item;
      return cleanItem;
    });

    // Write the data to a single JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(cleanedItems, null, 2));

    return outputFilePath;
  } catch (error) {
    console.error("Error exporting dataset:", error);
    throw error;
  }
}

// Main function to run the crawler
async function main() {
  try {
    // Get URL from user input
    const startUrl = await question(
      "Enter the URL to crawl (e.g., https://example.com): "
    );

    if (!startUrl) {
      console.error("Error: URL cannot be empty");
      rl.close();
      return;
    }

    // Get max requests from user input
    const maxRequestsInput = await question(
      "Enter maximum number of pages to crawl (default 50): "
    );
    const maxRequests = maxRequestsInput ? parseInt(maxRequestsInput, 10) : 50;

    // Set headless mode to true
    const headless = true;

    console.log(`\nStarting crawl with the following settings:`);
    console.log(`- Target URL: ${startUrl}`);
    console.log(`- Maximum pages: ${maxRequests}`);

    // Create output folder name based on target URL
    const urlObj = new URL(startUrl);
    const outputFolderName = urlObj.hostname.replace(/[^\w]/g, "_");

    // Set default dataset name to our custom name
    process.env.CRAWLEE_DEFAULT_DATASET_ID = outputFolderName;

    // Create and run the crawler
    const crawler = createCrawler(startUrl, maxRequests, headless);

    console.log("Starting the crawl...");
    await crawler.run([startUrl]);
    console.log("Crawl finished!");

    // Get path to the results
    console.log(`Results saved to ./storage/datasets/${outputFolderName}/`);

    // Export all data to a single JSON file
    const exportPath = await exportDatasetToSingleFile(outputFolderName);
    console.log(`All data exported to a single file: ${exportPath}`);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // Close the readline interface
    rl.close();
  }
}

// Execute the main function
main();
