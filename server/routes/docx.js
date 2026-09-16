const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractDocxContent, generateOrEditDocx, docxToPdf } = require('../services/docxService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Extract text and html preview from DOCX
router.post('/extract', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a .docx file to inspect.' });
    }

    const { text, html, messages } = await extractDocxContent(req.file.buffer);
    return res.json({
      success: true,
      filename: req.file.originalname,
      size: req.file.size,
      text,
      html,
      messages
    });
  } catch (err) {
    next(err);
  }
});

// Edit DOCX and export as DOCX or PDF
router.post('/edit', upload.single('file'), async (req, res, next) => {
  try {
    const {
      content,
      headerText,
      footerText,
      exportFormat = 'docx' // 'docx' or 'pdf'
    } = req.body;

    let replacements = [];
    if (req.body.replacements) {
      try {
        replacements = typeof req.body.replacements === 'string'
          ? JSON.parse(req.body.replacements)
          : req.body.replacements;
      } catch (e) {
        // ignore JSON parse error, use empty
      }
    }

    let rawText = content;
    // If no explicit content string was sent but file was sent, extract text first
    if ((!rawText || rawText.trim() === '') && req.file) {
      const extracted = await extractDocxContent(req.file.buffer);
      rawText = extracted.text;
    }

    if (!rawText && !req.file) {
      return res.status(400).json({ error: 'Please provide document text or upload a DOCX file.' });
    }

    // Generate new DOCX
    const docxBuffer = await generateOrEditDocx({
      content: rawText,
      headerText,
      footerText,
      replacements
    });

    const { saveDownload } = require('../services/downloadStore');

    if (exportFormat === 'pdf') {
      const pdfBuffer = await docxToPdf(docxBuffer);
      const downloadId = saveDownload(pdfBuffer, 'edited_document.pdf', 'application/pdf');

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          success: true,
          filename: 'edited_document.pdf',
          contentType: 'application/pdf',
          size: pdfBuffer.length,
          newSize: pdfBuffer.length,
          downloadId,
          downloadUrl: `/api/download/${downloadId}`,
          data: pdfBuffer.toString('base64')
        });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="edited_document.pdf"');
      return res.send(pdfBuffer);
    }

    const downloadId = saveDownload(docxBuffer, 'edited_document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        filename: 'edited_document.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: docxBuffer.length,
        newSize: docxBuffer.length,
        downloadId,
        downloadUrl: `/api/download/${downloadId}`,
        data: docxBuffer.toString('base64')
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="edited_document.docx"');
    return res.send(docxBuffer);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
