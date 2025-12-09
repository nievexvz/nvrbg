/**
 * Caching middleware untuk response gambar
 */
const NodeCache = require('node-cache');

// Buat cache instance (TTL: 24 jam, check period: 1 jam)
const imageCache = new NodeCache({ 
  stdTTL: 86400, // 24 jam dalam detik
  checkperiod: 3600 // 1 jam
});

/**
 * Middleware untuk caching response gambar
 */
function cacheMiddleware(req, res, next) {
  // Hanya cache untuk route proxy
  if (!req.path.startsWith('/api/proxy')) {
    return next();
  }
  
  const cacheKey = req.originalUrl;
  const cachedResponse = imageCache.get(cacheKey);
  
  if (cachedResponse) {
    console.log(`Cache hit for: ${cacheKey}`);
    
    // Set headers dari cache
    if (cachedResponse.headers) {
      Object.keys(cachedResponse.headers).forEach(key => {
        res.setHeader(key, cachedResponse.headers[key]);
      });
    }
    
    // Kirim data dari cache
    return res.send(cachedResponse.data);
  }
  
  // Override res.send untuk cache response
  const originalSend = res.send;
  res.send = function(data) {
    // Only cache successful image responses
    if (res.statusCode === 200 && data instanceof Buffer) {
      const headers = {
        'Content-Type': res.get('Content-Type'),
        'Content-Length': res.get('Content-Length'),
        'Cache-Control': res.get('Cache-Control') || 'public, max-age=86400'
      };
      
      imageCache.set(cacheKey, {
        data: data,
        headers: headers
      });
      
      console.log(`Cached response for: ${cacheKey}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
}

module.exports = {
  cacheMiddleware,
  imageCache
};