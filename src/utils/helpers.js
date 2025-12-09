/**
 * Helper functions
 */

/**
 * Validate image file
 * @param {string} filePath - Path to file
 * @returns {boolean} True if valid image
 */
function isValidImage(filePath) {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const ext = filePath.split('.').pop().toLowerCase();
  return validExtensions.includes(ext);
}

/**
 * Generate random filename
 * @param {string} originalName - Original filename
 * @returns {string} Generated filename
 */
function generateFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = originalName.split('.').pop();
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Clean up files
 * @param {Array<string>} filePaths - Array of file paths to delete
 */
function cleanupFiles(filePaths) {
  const fs = require('fs');
  
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error.message);
      }
    }
  });
}

module.exports = {
  isValidImage,
  generateFilename,
  cleanupFiles
};