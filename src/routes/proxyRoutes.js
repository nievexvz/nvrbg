const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');

/**
 * @route   GET /api/proxy/image/:encodedUrl/:hash?
 * @desc    Proxy untuk gambar dari removebg.one
 * @access  Public
 */
router.get('/image/:encodedUrl/:hash?', proxyController.proxyImage);

/**
 * @route   POST /api/proxy/bulk
 * @desc    Generate proxy URLs untuk multiple images
 * @access  Public
 */
router.post('/bulk', proxyController.getProxyUrls);

/**
 * @route   GET /api/proxy/encode
 * @desc    Encode URL menjadi base64
 * @access  Public
 */
router.get('/encode', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'url query parameter is required'
    });
  }
  
  const encoded = Buffer.from(url).toString('base64');
  const hash = crypto
    .createHash('md5')
    .update(url)
    .digest('hex')
    .substring(0, 8);
  
  res.json({
    success: true,
    data: {
      original: url,
      encoded: encoded,
      hash: hash,
      proxyUrl: `${req.protocol}://${req.get('host')}/api/proxy/image/${encoded}/${hash}`
    }
  });
});

module.exports = router;