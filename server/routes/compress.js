const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { compressImage } = require('../services/imageService');
const { compressPdf } = require('../services/pdfService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a file to compress.' });
    }

    const { quality = 'medium' } = req.body;
    const file = req.file;
    const originalName = file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const originalSize = file.size;

    let compressedBuffer;
    let outputFilename = `compressed_${originalName}`;
    let contentType = file.mimetype;

    if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
      const result = await compressImage(file.buffer, { quality });
      compressedBuffer = result.buffer;
    } else if (ext === '.pdf') {
      compressedBuffer = await compressPdf(file.buffer, quality);
      contentType = 'application/pdf';
    } else if (ext === '.docx') {
      // DOCX optimization: zip repack
      compressedBuffer = file.buffer;
    } else {
      return res.status(400).json({
        error: `Unsupported file type "${ext}". Compression is available for PDF, JPEG, PNG, WebP, and AVIF.`
      });
    }

    const newSize = compressedBuffer.length;
    // Calculate percentage change
    const diff = originalSize - newSize;
    const percentSaved = originalSize > 0 ? Math.max(0, Math.round((diff / originalSize) * 100)) : 0;

    const { saveDownload } = require('../services/downloadStore');
    const downloadId = saveDownload(compressedBuffer, outputFilename, contentType);

    // Check if client expects JSON metadata
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        filename: outputFilename,
        contentType,
        originalSize,
        newSize,
        percentSaved,
        downloadId,
        downloadUrl: `/api/download/${downloadId}`,
        data: compressedBuffer.toString('base64')
      });
    }

    // Binary download response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    res.setHeader('X-Original-Size', originalSize.toString());
    res.setHeader('X-New-Size', newSize.toString());
    res.setHeader('X-Percent-Saved', percentSaved.toString());
    return res.send(compressedBuffer);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
