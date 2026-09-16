const http = require('http');
const sharp = require('sharp');

async function testDownload() {
  const pngBuffer = await sharp({
    create: { width: 40, height: 40, channels: 4, background: { r: 217, g: 74, b: 38, alpha: 1 } }
  }).png().toBuffer();

  const boundary = '----TestBoundary' + Date.now();
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.png"\r\nContent-Type: image/png\r\n\r\n`),
    pngBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/compress',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
      'Accept': 'application/json'
    }
  }, (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
      console.log('Compress status:', res.statusCode);
      const json = JSON.parse(raw);
      console.log('Got downloadUrl:', json.downloadUrl);

      // Now fetch the download
      http.get('http://localhost:5001' + json.downloadUrl, (dl) => {
        console.log('Download status:', dl.statusCode);
        console.log('Disposition:', dl.headers['content-disposition']);
        console.log('Content-Type:', dl.headers['content-type']);
        console.log('Content-Length:', dl.headers['content-length']);

        let downloadedBytes = 0;
        dl.on('data', c => downloadedBytes += c.length);
        dl.on('end', () => {
          console.log(`Downloaded ${downloadedBytes} bytes successfully!`);
          process.exit(0);
        });
      });
    });
  });

  req.write(body);
  req.end();
}

testDownload().catch(err => {
  console.error(err);
  process.exit(1);
});
