const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { convertImage } = require('../services/imageService');
const { imagesToPdf } = require('../services/pdfService');
const { docxToPdf, pdfToDocx } = require('../services/docxService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Convert endpoint supporting single file or multiple files (e.g. image-to-pdf)
router.post('/', upload.array('files', 20), async (req, res, next) => {
  try {
    const files = req.files;
    const { targetFormat } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one file to convert.' });
    }

    if (!targetFormat) {
      return res.status(400).json({ error: 'Please select a target format.' });
    }

    const normTarget = targetFormat.toLowerCase();

    // Multi-image to PDF conversion
    if (normTarget === 'pdf' && files.every(f => f.mimetype.startsWith('image/'))) {
      const pdfBuffer = await imagesToPdf(files.map(f => f.buffer));
      const outputFilename = 'converted_images.pdf';

      const { saveDownload } = require('../services/downloadStore');
      const downloadId = saveDownload(pdfBuffer, outputFilename, 'application/pdf');

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          success: true,
          filename: outputFilename,
          contentType: 'application/pdf',
          originalSize: files.reduce((acc, f) => acc + f.size, 0),
          newSize: pdfBuffer.length,
          downloadId,
          downloadUrl: `/api/download/${downloadId}`,
          data: pdfBuffer.toString('base64')
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      return res.send(pdfBuffer);
    }

    // Single file conversions
    const file = files[0];
    const originalName = file.originalname;
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    const baseName = path.basename(originalName, path.extname(originalName));
    let convertedBuffer;
    let contentType = 'application/octet-stream';
    let outputFilename = `${baseName}.${normTarget}`;

    // Check if file is image
    const isImage = file.mimetype.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(ext);

    // DOCX to PDF
    if (ext === 'docx' && normTarget === 'pdf') {
      convertedBuffer = await docxToPdf(file.buffer);
      contentType = 'application/pdf';
    }
    // PDF to DOCX
    else if (ext === 'pdf' && (normTarget === 'docx' || normTarget === 'doc')) {
      convertedBuffer = await pdfToDocx(file.buffer);
      outputFilename = `${baseName}.docx`;
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    // Image to PDF (single image)
    else if (isImage && normTarget === 'pdf') {
      convertedBuffer = await imagesToPdf([file.buffer]);
      contentType = 'application/pdf';
    }
    // Image to Image (jpeg, png, webp, avif)
    else if (isImage && ['jpeg', 'jpg', 'png', 'webp', 'avif'].includes(normTarget)) {
      convertedBuffer = await convertImage(file.buffer, normTarget);
      contentType = `image/${normTarget === 'jpg' ? 'jpeg' : normTarget}`;
      outputFilename = `${baseName}.${normTarget === 'jpg' ? 'jpg' : normTarget}`;
    }
    else {
      return res.status(400).json({
        error: `Conversion from .${ext} to .${normTarget} is not supported. Supported conversions include DOCX ↔ PDF, PDF ↔ DOCX, Images → PDF, and JPEG ↔ PNG ↔ WebP.`
      });
    }

    const { saveDownload } = require('../services/downloadStore');
    const downloadId = saveDownload(convertedBuffer, outputFilename, contentType);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        filename: outputFilename,
        contentType,
        originalSize: file.size,
        newSize: convertedBuffer.length,
        downloadId,
        downloadUrl: `/api/download/${downloadId}`,
        data: convertedBuffer.toString('base64')
      });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    return res.send(convertedBuffer);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
