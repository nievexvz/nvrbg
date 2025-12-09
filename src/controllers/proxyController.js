const axios = require('axios');
const crypto = require('crypto');

class ProxyController {
  /**
   * Proxy untuk gambar dari removebg.one
   */
  async proxyImage(req, res, next) {
    try {
      const { encodedUrl } = req.params;
      
      if (!encodedUrl) {
        return res.status(400).json({
          success: false,
          message: 'Image URL is required'
        });
      }
      
      // Decode URL
      const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
      
      console.log(`Proxying image from: ${decodedUrl}`);
      
      // Validasi URL (hanya dari removebg.one untuk keamanan)
      if (!decodedUrl.includes('removebg.one')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image source'
        });
      }
      
      // Download gambar dari removebg.one
      const response = await axios.get(decodedUrl, {
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
          'Accept': 'image/*',
          'Referer': 'https://removebg.one/'
        }
      });
      
      // Set headers untuk caching
      res.set({
        'Content-Type': response.headers['content-type'] || 'image/png',
        'Content-Length': response.headers['content-length'],
        'Cache-Control': 'public, max-age=86400', // Cache 24 jam
        'Access-Control-Allow-Origin': '*',
        'X-Proxy-Source': 'removebg.one'
      });
      
      // Stream gambar ke client
      response.data.pipe(res);
      
    } catch (error) {
      console.error('Proxy error:', error.message);
      
      // Jika gagal, kirim placeholder image
      if (error.response) {
        res.status(error.response.status).json({
          success: false,
          message: `Failed to fetch image: ${error.response.status}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to proxy image'
        });
      }
    }
  }
  
  /**
   * Utility untuk encode URL menjadi base64
   */
  encodeUrl(url) {
    return Buffer.from(url).toString('base64');
  }
  
  /**
   * Generate secure proxy URL
   */
  generateProxyUrl(originalUrl, req) {
    // Encode URL
    const encodedUrl = this.encodeUrl(originalUrl);
    
    // Generate hash untuk keamanan
    const hash = crypto
      .createHash('md5')
      .update(originalUrl)
      .digest('hex')
      .substring(0, 8);
    
    // Return proxy URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/api/proxy/image/${encodedUrl}/${hash}`;
  }
  
  /**
   * Bulk proxy untuk multiple images
   */
  async getProxyUrls(req, res) {
    try {
      const { urls } = req.body;
      
      if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({
          success: false,
          message: 'urls array is required'
        });
      }
      
      const proxyUrls = urls.map(url => ({
        original: url,
        proxy: this.generateProxyUrl(url, req)
      }));
      
      res.json({
        success: true,
        data: proxyUrls,
        count: proxyUrls.length
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ProxyController();