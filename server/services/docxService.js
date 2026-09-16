const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, HeadingLevel } = require('docx');
const pdfParseModule = require('pdf-parse');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/**
 * Extract raw text and HTML from a DOCX buffer
 * @param {Buffer} buffer 
 * @returns {Promise<{ text: string, html: string, messages: Array<string> }>}
 */
async function extractDocxContent(buffer) {
  const textResult = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });

  return {
    text: textResult.value,
    html: htmlResult.value,
    messages: textResult.messages.map(m => m.message)
  };
}

/**
 * Create a new DOCX file from edited text, with optional headers/footers and search-and-replace
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
async function generateOrEditDocx(options = {}) {
  let {
    content = '',
    headerText = '',
    footerText = '',
    replacements = [] // [{ find: '', replace: '' }]
  } = options;

  let processedText = content;
  if (Array.isArray(replacements)) {
    for (const item of replacements) {
      if (item.find) {
        // Global case-insensitive or exact replacement
        const regex = new RegExp(item.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        processedText = processedText.replace(regex, item.replace || '');
      }
    }
  }

  // Split into paragraphs by newline
  const rawParagraphs = processedText.split(/\r?\n/);
  const docxParagraphs = rawParagraphs.map(line => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: 'Calibri',
          size: 22 // 11pt
        })
      ],
      spacing: {
        after: 120 // 6pt
      }
    });
  });

  const headers = headerText
    ? {
        default: new Header({
          children: [
            new Paragraph({
              children: [new TextRun({ text: headerText, font: 'Calibri', size: 18, italics: true, color: '666666' })],
              alignment: AlignmentType.RIGHT
            })
          ]
        })
      }
    : undefined;

  const footers = footerText
    ? {
        default: new Footer({
          children: [
            new Paragraph({
              children: [new TextRun({ text: footerText, font: 'Calibri', size: 18, color: '888888' })],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      }
    : undefined;

  const doc = new Document({
    sections: [
      {
        headers,
        footers,
        properties: {},
        children: docxParagraphs.length > 0 ? docxParagraphs : [new Paragraph({ text: '' })]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Convert DOCX to PDF cleanly
 * Extracts content via mammoth and renders pages with line wrapping via pdf-lib
 * @param {Buffer} docxBuffer 
 * @returns {Promise<Buffer>}
 */
async function docxToPdf(docxBuffer) {
  const { text } = await extractDocxContent(docxBuffer);
  
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const fontSize = 10;
  const lineHeight = 15;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      currentY -= lineHeight;
      if (currentY < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      continue;
    }

    // Word wrap line to fit within maxWidth
    const words = rawLine.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > maxWidth && n > 0) {
        if (currentY - lineHeight < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }
        currentPage.drawText(currentLine.trim(), {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1)
        });
        currentLine = words[n] + ' ';
        currentY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.trim()) {
      if (currentY - lineHeight < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      currentPage.drawText(currentLine.trim(), {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1)
      });
      currentY -= lineHeight * 1.3;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Convert PDF to DOCX
 * Parses text streams and generates a structured Word document
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<Buffer>}
 */
async function pdfToDocx(pdfBuffer) {
  let text = '';
  try {
    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(pdfBuffer);
      text = data.text || '';
    } else if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: pdfBuffer });
      const data = await parser.getText();
      text = data.text || '';
    }
  } catch (err) {
    console.error('PDF text extraction error:', err);
    text = 'Extracted Document Text';
  }

  const paragraphs = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Basic heading heuristic (short all-caps or title case line)
      const isHeading = line.length < 50 && line === line.toUpperCase() && line.length > 3;
      return new Paragraph({
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        children: [
          new TextRun({
            text: line,
            font: 'Calibri',
            size: isHeading ? 26 : 22,
            bold: isHeading
          })
        ],
        spacing: {
          after: 100
        }
      });
    });

  const doc = new Document({
    sections: [
      {
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: 'Converted Document' })]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = {
  extractDocxContent,
  generateOrEditDocx,
  docxToPdf,
  pdfToDocx
};
