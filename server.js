require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const backgroundRoutes = require('./src/routes/backgroundRoutes');
const proxyRoutes = require('./src/routes/proxyRoutes');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { cacheMiddleware } = require('./src/middleware/cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache middleware untuk gambar
app.use(cacheMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// Routes
app.use('/api/background', backgroundRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Background Remover API',
    proxy: 'Enabled'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Upload directory: ${path.resolve(uploadDir)}`);
  console.log(`Proxy enabled: true`);
});

module.exports = app;