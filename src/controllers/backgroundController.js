const removeBgService = require('../services/removeBgService');
const proxyController = require('./proxyController');
const fs = require('fs');
const path = require('path');

class BackgroundController {
  /**
   * Remove background from uploaded image
   */
  async removeBackground(req, res, next) {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;

      console.log(`Processing file: ${originalName}`);

      // Call removebg.one API
      const result = await removeBgService.removeBackground(filePath, originalName);

      // Check if API call was successful
      if (result.code !== 0) {
        throw new Error(`RemoveBG API returned error code: ${result.code}`);
      }

      // Generate proxy URLs
      const proxyUrls = {
        original: proxyController.generateProxyUrl(result.data.url, req),
        cutout: proxyController.generateProxyUrl(result.data.cutoutUrl, req),
        mask: proxyController.generateProxyUrl(result.data.maskUrl, req)
      };

      // Download the processed image (cutout)
      const processedImageBuffer = await removeBgService.downloadImage(result.data.cutoutUrl);

      // Save processed image locally (optional)
      const processedFileName = `processed-${Date.now()}.png`;
      const processedFilePath = path.join(process.env.UPLOAD_DIR || './uploads', processedFileName);

      fs.writeFileSync(processedFilePath, processedImageBuffer);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Return result with proxy URLs
      res.json({
        success: true,
        message: 'Background removed successfully',
        data: {
          originalFile: originalName,
          processedFile: processedFileName,
          downloadUrl: `${req.protocol}://${req.get('host')}/uploads/${processedFileName}`,
          removeBgData: {
            ...result.data,
            // Replace original URLs with proxy URLs
            proxyUrls: proxyUrls
          },
          images: {
            // Original image dengan background
            original: proxyUrls.original,
            // Hasil cutout (background removed)
            cutout: proxyUrls.cutout,
            // Mask
            mask: proxyUrls.mask
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      // Clean up uploaded file if exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      next(error);
    }
  }

  // Di dalam class BackgroundController, tambahkan method ini:

  /**
   * Remove background from image URL
   */
  async removeBackgroundFromUrl(req, res, next) {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'imageUrl is required'
        });
      }

      // Validate URL
      try {
        new URL(imageUrl);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format'
        });
      }

      // Create a temporary file from URL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const tempFileName = `temp-${Date.now()}.jpg`;
      const tempFilePath = path.join(process.env.UPLOAD_DIR || './uploads', tempFileName);

      fs.writeFileSync(tempFilePath, Buffer.from(response.data, 'binary'));

      // Process the image
      const result = await this.callRemoveBgAPI(tempFilePath, tempFileName);

      if (result.code !== 0) {
        throw new Error(`RemoveBG API returned error code: ${result.code}`);
      }

      // Generate proxy URLs
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const proxyUrls = {
        original: `${baseUrl}/api/proxy/image?url=${encodeURIComponent(result.data.url)}`,
        cutout: `${baseUrl}/api/proxy/image?url=${encodeURIComponent(result.data.cutoutUrl)}`,
        mask: `${baseUrl}/api/proxy/image?url=${encodeURIComponent(result.data.maskUrl)}`
      };

      // Download the processed image
      const processedImageBuffer = await this.downloadImage(result.data.cutoutUrl);

      const processedFileName = `processed-${Date.now()}.png`;
      const processedFilePath = path.join(process.env.UPLOAD_DIR || './uploads', processedFileName);

      fs.writeFileSync(processedFilePath, processedImageBuffer);

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      // Return result
      res.json({
        success: true,
        message: 'Background removed successfully from URL',
        data: {
          sourceUrl: imageUrl,
          processedFile: processedFileName,
          downloadUrl: `${baseUrl}/uploads/${processedFileName}`,
          removeBgData: result.data,
          images: {
            original: proxyUrls.original,
            cutout: proxyUrls.cutout,
            mask: proxyUrls.mask
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in removeBackgroundFromUrl:', error.message);
      next(error);
    }
  }

  /**
   * Get API status
   */
  async getStatus(req, res) {
    res.json({
      success: true,
      status: 'operational',
      service: 'Background Remover API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        removeBackground: 'POST /api/background/remove',
        removeFromUrl: 'POST /api/background/remove-from-url',
        status: 'GET /api/background/status',
        proxyImage: 'GET /api/proxy/image/:encodedUrl',
        bulkProxy: 'POST /api/proxy/bulk'
      }
    });
  }
}

module.exports = new BackgroundController();