const express = require('express');
const cors = require('cors');
const path = require('path');

const compressRouter = require('./routes/compress');
const convertRouter = require('./routes/convert');
const pdfRouter = require('./routes/pdf');
const docxRouter = require('./routes/docx');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Disposition', 'X-Original-Size', 'X-New-Size', 'X-Percent-Saved']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FileForge Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/compress', compressRouter);
app.use('/api/convert', convertRouter);
app.use('/api/pdf', pdfRouter);
app.use('/api/docx', docxRouter);

// Direct binary file download route
const downloadStore = require('./services/downloadStore');
app.get('/api/download/:id', (req, res) => {
  const item = downloadStore.getDownload(req.params.id);
  if (!item) {
    return res.status(404).send('Download link expired or not found. Please re-run the forge operation.');
  }

  res.setHeader('Content-Type', item.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(item.filename)}"; filename*=UTF-8''${encodeURIComponent(item.filename)}`);
  res.setHeader('Content-Length', item.buffer.length);
  return res.end(item.buffer);
});

// 404 handler for unknown API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint "${req.originalUrl}" not found.` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[FileForge Error]', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File size exceeds the 50MB upload limit. Please try with a smaller file.'
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected processing error occurred while forging the file.';

  return res.status(statusCode).json({
    error: message,
    code: err.code || 'PROCESSING_ERROR'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[FileForge Server] Online & listening at http://localhost:${PORT}`);
  });
}

module.exports = app;
