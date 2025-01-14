const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

// Create an in-memory cache with a TTL of 24 hours (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400 });

const app = express();
const PORT = process.env.PORT || 3033;

app.get('/fetch-url', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Check if the URL is already cached
  const cachedResponse = cache.get(url);
  if (cachedResponse) {
    console.log(`[${new Date().toISOString()}] Cache HIT for URL: ${url}`);
    return res.setHeader('Content-Type', cachedResponse.contentType).send(cachedResponse.content);
  }

  try {
    console.log(`[${new Date().toISOString()}] Cache MISS - Fetching live data for URL: ${url}`);
    // Make request with axios
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const content = response.data;
    const contentType = response.headers['content-type'];

    // Cache the response
    cache.set(url, { content, contentType });
    console.log(`[${new Date().toISOString()}] Cached new data for URL: ${url}`);

    // Return the response with the appropriate content type
    res.setHeader('Content-Type', contentType);
    res.send(content);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching URL: ${url}`, error.message);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server is running on http://localhost:${PORT}`);
});
