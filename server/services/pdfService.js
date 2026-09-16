const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');

/**
 * Merge multiple PDF buffers into a single PDF
 * @param {Array<Buffer>} buffers 
 * @returns {Promise<Buffer>}
 */
async function mergePdfs(buffers) {
  if (!buffers || buffers.length === 0) {
    throw new Error('At least one PDF file is required for merging.');
  }

  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < buffers.length; i++) {
    try {
      const srcDoc = await PDFDocument.load(buffers[i], { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach(page => mergedDoc.addPage(page));
    } catch (err) {
      throw new Error(`Failed to process PDF #${i + 1}: ${err.message}`);
    }
  }

  const mergedPdfBytes = await mergedDoc.save();
  return Buffer.from(mergedPdfBytes);
}

/**
 * Split or extract pages from a PDF
 * @param {Buffer} buffer 
 * @param {Array<number>} pageIndices - 0-based page indices to keep
 * @returns {Promise<Buffer>}
 */
async function extractPages(buffer, pageIndices) {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  const validIndices = pageIndices.filter(idx => idx >= 0 && idx < totalPages);
  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
  copiedPages.forEach(page => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Reorder, rotate, and delete pages
 * @param {Buffer} buffer 
 * @param {Array<{ originalIndex: number, rotation: number }>} pageConfigs - ordered list of pages with rotations (in degrees)
 * @returns {Promise<Buffer>}
 */
async function reorderAndTransformPdf(buffer, pageConfigs) {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (!pageConfigs || pageConfigs.length === 0) {
    throw new Error('At least one page must remain in the document.');
  }

  const newDoc = await PDFDocument.create();

  for (const config of pageConfigs) {
    const origIdx = config.originalIndex;
    if (origIdx < 0 || origIdx >= totalPages) continue;

    const [copiedPage] = await newDoc.copyPages(srcDoc, [origIdx]);
    
    // Apply extra rotation
    const currentRot = copiedPage.getRotation().angle;
    const additionalRot = (config.rotation || 0) % 360;
    copiedPage.setRotation(degrees((currentRot + additionalRot) % 360));

    newDoc.addPage(copiedPage);
  }

  if (newDoc.getPageCount() === 0) {
    throw new Error('All pages were removed. At least one page is required.');
  }

  const pdfBytes = await newDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Add watermark text to every page
 * @param {Buffer} buffer 
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
async function watermarkPdf(buffer, options = {}) {
  const {
    text = 'CONFIDENTIAL',
    opacity = 0.25,
    size = 48,
    angle = 45,
    color = '#D94A26' // Burnt Terracotta default
  } = options;

  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const helveticaFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  // Convert hex color to rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.85;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.29;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.15;

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = helveticaFont.widthOfTextAtSize(text, size);
    const textHeight = helveticaFont.heightAtSize(size);

    // Center coordinates
    const centerX = width / 2;
    const centerY = height / 2;

    page.drawText(text, {
      x: centerX - textWidth / 2,
      y: centerY - textHeight / 2,
      size,
      font: helveticaFont,
      color: rgb(r, g, b),
      opacity: Math.max(0.05, Math.min(1.0, opacity)),
      rotate: degrees(angle)
    });
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Add page numbers to every page
 * @param {Buffer} buffer 
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
async function addPageNumbers(buffer, options = {}) {
  const {
    position = 'bottom-center', // bottom-center, bottom-right, top-right, top-center
    format = 'Page {n} of {total}', // 'Page {n} of {total}' or '{n}'
    startFrom = 1,
    fontSize = 10,
    color = '#181816'
  } = options;

  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const currentNum = startFrom + i;
    
    let text = format.replace('{n}', currentNum).replace('{total}', total);
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = 25;

    if (position === 'bottom-right') {
      x = width - textWidth - 36;
      y = 25;
    } else if (position === 'top-center') {
      x = width / 2 - textWidth / 2;
      y = height - 30;
    } else if (position === 'top-right') {
      x = width - textWidth - 36;
      y = height - 30;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1)
    });
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Convert multiple image buffers into a single combined PDF
 * @param {Array<Buffer>} imageBuffers 
 * @returns {Promise<Buffer>}
 */
async function imagesToPdf(imageBuffers) {
  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error('At least one image is required.');
  }

  const pdfDoc = await PDFDocument.create();

  for (const imgBuffer of imageBuffers) {
    const meta = await sharp(imgBuffer).metadata();
    
    // Normalize image to PNG or JPEG for pdf-lib embedding
    let embeddedImage;
    if (meta.format === 'jpeg' || meta.format === 'jpg') {
      embeddedImage = await pdfDoc.embedJpg(imgBuffer);
    } else {
      const pngBuffer = await sharp(imgBuffer).png().toBuffer();
      embeddedImage = await pdfDoc.embedPng(pngBuffer);
    }

    const { width, height } = embeddedImage;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Compress PDF: optimize streams and structure
 * @param {Buffer} buffer 
 * @param {string} quality - 'low', 'medium', 'high'
 * @returns {Promise<Buffer>}
 */
async function compressPdf(buffer, quality = 'medium') {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  
  // pdf-lib's useObjectStreams packs objects together
  // and remove unused objects
  const pdfBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50
  });

  return Buffer.from(pdfBytes);
}

module.exports = {
  mergePdfs,
  extractPages,
  reorderAndTransformPdf,
  watermarkPdf,
  addPageNumbers,
  imagesToPdf,
  compressPdf
};
