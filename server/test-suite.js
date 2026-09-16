const http = require('http');
const { PDFDocument, rgb } = require('pdf-lib');
const sharp = require('sharp');
const app = require('./server');

const TEST_PORT = 5099;

async function runTests() {
  console.log('--- Starting FileForge Automated Test Suite ---');
  const server = app.listen(TEST_PORT);

  try {
    // 1. Generate test PDF in-memory
    const testDoc = await PDFDocument.create();
    const page1 = testDoc.addPage([400, 600]);
    page1.drawText('FileForge Test Page 1', { x: 50, y: 550, size: 20 });
    const page2 = testDoc.addPage([400, 600]);
    page2.drawText('FileForge Test Page 2', { x: 50, y: 550, size: 20 });
    const pdfBytes = Buffer.from(await testDoc.save());

    // 2. Generate test PNG in-memory
    const pngBytes = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 217, g: 74, b: 38, alpha: 1 }
      }
    }).png().toBuffer();

    // Helper to send multipart POST request
    const sendMultipart = (endpoint, fieldName, filename, fileBuffer, extraFields = {}) => {
      return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        let body = [];

        // Add file
        body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
        body.push(fileBuffer);
        body.push(Buffer.from('\r\n'));

        // Add extra fields
        for (const [key, val] of Object.entries(extraFields)) {
          body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
        }

        body.push(Buffer.from(`--${boundary}--\r\n`));
        const fullBody = Buffer.concat(body);

        const req = http.request({
          hostname: 'localhost',
          port: TEST_PORT,
          path: endpoint,
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': fullBody.length,
            'Accept': 'application/json'
          }
        }, (res) => {
          let chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString();
            try {
              resolve({ status: res.statusCode, data: JSON.parse(raw) });
            } catch (e) {
              resolve({ status: res.statusCode, raw });
            }
          });
        });

        req.on('error', reject);
        req.write(fullBody);
        req.end();
      });
    };

    // Test 1: Health
    console.log('✓ Testing /api/health...');
    const health = await new Promise((resolve) => {
      http.get(`http://localhost:${TEST_PORT}/api/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
    });
    if (health.status !== 'ok') throw new Error('Health check failed');
    console.log('  Health check: PASS');

    // Test 2: Compression
    console.log('✓ Testing /api/compress on PNG...');
    const compressRes = await sendMultipart('/api/compress', 'file', 'test.png', pngBytes, { quality: 'medium' });
    if (compressRes.status !== 200 || !compressRes.data.success) {
      throw new Error(`Compression failed: ${JSON.stringify(compressRes)}`);
    }
    console.log(`  PNG compression: PASS (original: ${compressRes.data.originalSize}b -> compressed: ${compressRes.data.newSize}b)`);

    // Test 3: Image to PDF conversion
    console.log('✓ Testing /api/convert (PNG -> PDF)...');
    const convertRes = await sendMultipart('/api/convert', 'files', 'sample.png', pngBytes, { targetFormat: 'pdf' });
    if (convertRes.status !== 200 || !convertRes.data.success) {
      throw new Error(`Convert failed: ${JSON.stringify(convertRes)}`);
    }
    console.log(`  Convert PNG -> PDF: PASS (${convertRes.data.filename})`);

    // Test 4: PDF Watermarking
    console.log('✓ Testing /api/pdf/watermark...');
    const watermarkRes = await sendMultipart('/api/pdf/watermark', 'file', 'doc.pdf', pdfBytes, { text: 'FILEFORGE TEST' });
    if (watermarkRes.status !== 200 || !watermarkRes.data.success) {
      throw new Error(`Watermark failed: ${JSON.stringify(watermarkRes)}`);
    }
    console.log(`  Watermark test: PASS (${watermarkRes.data.size} bytes)`);

    // Test 5: PDF Page Numbers
    console.log('✓ Testing /api/pdf/page-numbers...');
    const numberRes = await sendMultipart('/api/pdf/page-numbers', 'file', 'doc.pdf', pdfBytes, { position: 'bottom-right' });
    if (numberRes.status !== 200 || !numberRes.data.success) {
      throw new Error(`Page numbers test failed: ${JSON.stringify(numberRes)}`);
    }
    console.log(`  Page numbering test: PASS (${numberRes.data.size} bytes)`);

    // Test 6: PDF Reorder
    console.log('✓ Testing /api/pdf/reorder...');
    const reorderRes = await sendMultipart('/api/pdf/reorder', 'file', 'doc.pdf', pdfBytes, {
      pageConfigs: JSON.stringify([{ originalIndex: 1, rotation: 90 }, { originalIndex: 0, rotation: 0 }])
    });
    if (reorderRes.status !== 200 || !reorderRes.data.success) {
      throw new Error(`PDF Reorder test failed: ${JSON.stringify(reorderRes)}`);
    }
    console.log(`  PDF Reorder test: PASS (${reorderRes.data.size} bytes)`);

    // Test 7: DOCX Edit / Synthesize
    console.log('✓ Testing /api/docx/edit...');
    const docxRes = await sendMultipart('/api/docx/edit', 'file', 'empty.docx', Buffer.from(''), {
      content: 'This is a FileForge verified manuscript text.',
      headerText: 'Verification Header',
      footerText: 'Page 1',
      exportFormat: 'docx'
    });
    if (docxRes.status !== 200 || !docxRes.data.success) {
      throw new Error(`DOCX edit test failed: ${JSON.stringify(docxRes)}`);
    }
    console.log(`  DOCX generation test: PASS (${docxRes.data.size} bytes)`);

    console.log('\n=========================================');
    console.log('  ALL 7 VERIFICATION TESTS PASSED (100%)  ');
    console.log('=========================================');

  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
