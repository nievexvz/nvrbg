const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class RemoveBgService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://removebg.one';
    this.apiEndpoint = `${this.baseURL}/api/predict/v2`;
  }

  /**
   * Remove background from image
   * @param {string} filePath - Path to image file
   * @param {string} originalName - Original filename
   * @returns {Promise<Object>} Result from removebg.one API
   */
  async removeBackground(filePath, originalName) {
    try {
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      
      // Prepare form data
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: originalName || 'image.jpg',
        contentType: this.getContentType(originalName)
      });

      // Prepare headers
      const headers = {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Sec-CH-UA': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'Platform': 'PC',
        'Sec-CH-UA-Platform': '"Android"',
        'Origin': 'https://removebg.one',
        'Referer': 'https://removebg.one/upload'
      };

      // Make request
      const response = await axios.post(this.apiEndpoint, form, {
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 30000 // 30 seconds timeout
      });

      return response.data;

    } catch (error) {
      console.error('Error in removeBackground service:', error.message);
      
      // Handle specific errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`RemoveBG API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('RemoveBG API Error: No response received from server');
      } else {
        // Something happened in setting up the request
        throw new Error(`RemoveBG API Error: ${error.message}`);
      }
    }
  }

  /**
   * Get content type based on file extension
   * @param {string} filename - Filename
   * @returns {string} Content type
   */
  getContentType(filename) {
    if (!filename) return 'image/jpeg';
    
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Download processed image
   * @param {string} url - URL of processed image
   * @returns {Promise<Buffer>} Image buffer
   */
  async downloadImage(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }
}

module.exports = new RemoveBgService();