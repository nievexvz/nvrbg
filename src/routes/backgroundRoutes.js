const express = require('express');
const router = express.Router();
const backgroundController = require('../controllers/backgroundController');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/background/remove
 * @desc    Remove background from uploaded image
 * @access  Public
 * @upload  Single file with field name 'image'
 */
router.post('/remove', upload.single('image'), backgroundController.removeBackground);

/**
 * @route   POST /api/background/remove-from-url
 * @desc    Remove background from image URL
 * @access  Public
 */
router.post('/remove-from-url', backgroundController.removeBackgroundFromUrl);

/**
 * @route   GET /api/background/status
 * @desc    Get API status
 * @access  Public
 */
router.get('/status', backgroundController.getStatus);

module.exports = router;