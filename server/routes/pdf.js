const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  mergePdfs,
  extractPages,
  reorderAndTransformPdf,
  watermarkPdf,
  addPageNumbers
} = require('../services/pdfService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const { saveDownload } = require('../services/downloadStore');

// Helper for sending JSON or binary
function sendPdfResponse(req, res, pdfBuffer, defaultFilename) {
  const downloadId = saveDownload(pdfBuffer, defaultFilename, 'application/pdf');

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({
      success: true,
      filename: defaultFilename,
      contentType: 'application/pdf',
      size: pdfBuffer.length,
      newSize: pdfBuffer.length,
      downloadId,
      downloadUrl: `/api/download/${downloadId}`,
      data: pdfBuffer.toString('base64')
    });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(defaultFilename)}"`);
  return res.send(pdfBuffer);
}

// Merge multiple PDFs
router.post('/merge', upload.array('files', 20), async (req, res, next) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 PDF files to merge.' });
    }

    const buffers = req.files.map(f => f.buffer);
    const merged = await mergePdfs(buffers);
    return sendPdfResponse(req, res, merged, 'merged_document.pdf');
  } catch (err) {
    next(err);
  }
});

// Split / extract pages from PDF
router.post('/split', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file to split.' });
    }

    const { pages } = req.body; // e.g. "1,2,5" or "1-3,5" or JSON array "[0, 1, 4]"
    let indices = [];

    if (Array.isArray(pages)) {
      indices = pages.map(Number);
    } else if (typeof pages === 'string') {
      // Parse string: "1-3, 5, 7" -> 0-indexed [0, 1, 2, 4, 6]
      const parts = pages.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(n => parseInt(n, 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              indices.push(i - 1);
            }
          }
        } else {
          const num = parseInt(trimmed, 10);
          if (!isNaN(num)) indices.push(num - 1);
        }
      }
    }

    if (indices.length === 0) {
      return res.status(400).json({ error: 'Please specify valid page numbers or page ranges to extract.' });
    }

    const extracted = await extractPages(req.file.buffer, indices);
    return sendPdfResponse(req, res, extracted, `split_${req.file.originalname}`);
  } catch (err) {
    next(err);
  }
});

// Reorder, rotate, or delete pages
router.post('/reorder', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file to edit.' });
    }

    let pageConfigs = [];
    if (req.body.pageConfigs) {
      try {
        pageConfigs = typeof req.body.pageConfigs === 'string'
          ? JSON.parse(req.body.pageConfigs)
          : req.body.pageConfigs;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid pageConfigs payload.' });
      }
    }

    if (!Array.isArray(pageConfigs) || pageConfigs.length === 0) {
      return res.status(400).json({ error: 'No pages specified for the reordered document.' });
    }

    const reordered = await reorderAndTransformPdf(req.file.buffer, pageConfigs);
    return sendPdfResponse(req, res, reordered, `edited_${req.file.originalname}`);
  } catch (err) {
    next(err);
  }
});

// Add watermark
router.post('/watermark', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file to watermark.' });
    }

    const { text, opacity, size, angle, color } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Please provide watermark text.' });
    }

    const watermarked = await watermarkPdf(req.file.buffer, {
      text: text.trim(),
      opacity: opacity ? parseFloat(opacity) : 0.25,
      size: size ? parseInt(size, 10) : 48,
      angle: angle ? parseInt(angle, 10) : 45,
      color: color || '#D94A26'
    });

    return sendPdfResponse(req, res, watermarked, `watermarked_${req.file.originalname}`);
  } catch (err) {
    next(err);
  }
});

// Add page numbers
router.post('/page-numbers', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file.' });
    }

    const { position, format, startFrom, fontSize } = req.body;
    const paginated = await addPageNumbers(req.file.buffer, {
      position,
      format,
      startFrom: startFrom ? parseInt(startFrom, 10) : 1,
      fontSize: fontSize ? parseInt(fontSize, 10) : 10
    });

    return sendPdfResponse(req, res, paginated, `numbered_${req.file.originalname}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
