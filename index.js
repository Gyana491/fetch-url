const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const NodeCache = require('node-cache');

// Set up puppeteer with stealth plugin
puppeteer.use(StealthPlugin());

// Create an in-memory cache with a TTL (time to live) of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/fetch-url', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Check if the URL is already cached
  const cachedResponse = cache.get(url);
  if (cachedResponse) {
    console.log('Cache hit for URL:', url);
    return res.setHeader('Content-Type', cachedResponse.contentType).send(cachedResponse.content);
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    const page = await browser.newPage();

    // Set a random User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'
    );

    // Set extra HTTP headers
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
    });

    // Randomize viewport size
    await page.setViewport({
      width: Math.floor(Math.random() * (1920 - 1024 + 1)) + 1024,
      height: Math.floor(Math.random() * (1080 - 768 + 1)) + 768,
    });

    // Navigate to the URL and get the response
    const response = await page.goto(url, { waitUntil: 'networkidle2' });
    const contentType = response.headers()['content-type'];

    // Get the page content
    const content = await page.content();

    // Close the browser
    await browser.close();

    // Cache the response
    cache.set(url, { content, contentType });

    // Return the response with the appropriate content type
    res.setHeader('Content-Type', contentType);
    res.send(content);
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
