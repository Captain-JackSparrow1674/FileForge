const sharp = require('sharp');

/**
 * Compress an image buffer using Sharp with quality control
 * @param {Buffer} buffer 
 * @param {Object} options 
 * @returns {Promise<{ buffer: Buffer, format: string, originalSize: number, newSize: number }>}
 */
async function compressImage(buffer, options = {}) {
  const {
    quality = 75, // 10-100 or 'low' (40), 'medium' (70), 'high' (85)
    targetFormat = null
  } = options;

  let numericQuality = 75;
  if (typeof quality === 'string') {
    if (quality === 'low') numericQuality = 45;
    else if (quality === 'medium') numericQuality = 70;
    else if (quality === 'high') numericQuality = 85;
    else numericQuality = parseInt(quality, 10) || 75;
  } else if (typeof quality === 'number') {
    numericQuality = Math.max(10, Math.min(100, quality));
  }

  const image = sharp(buffer);
  const metadata = await image.metadata();
  const format = (targetFormat || metadata.format || 'jpeg').toLowerCase();

  let pipeline = sharp(buffer);

  if (format === 'jpeg' || format === 'jpg') {
    pipeline = pipeline.jpeg({
      quality: numericQuality,
      mozjpeg: true,
      progressive: true
    });
  } else if (format === 'png') {
    // Sharp PNG compression: compressionLevel 1-9, plus palette reduction if quality < 80
    const compressionLevel = Math.round(9 - (numericQuality / 100) * 8) || 6;
    pipeline = pipeline.png({
      compressionLevel: Math.max(1, Math.min(9, compressionLevel)),
      palette: numericQuality < 80,
      quality: numericQuality,
      effort: 7
    });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({
      quality: numericQuality,
      effort: 5
    });
  } else if (format === 'avif') {
    pipeline = pipeline.avif({
      quality: numericQuality,
      effort: 4
    });
  } else {
    // default fallback
    pipeline = pipeline.jpeg({ quality: numericQuality });
  }

  const outputBuffer = await pipeline.toBuffer();
  return {
    buffer: outputBuffer,
    format,
    originalSize: buffer.length,
    newSize: outputBuffer.length
  };
}

/**
 * Convert an image between formats
 * @param {Buffer} buffer 
 * @param {string} targetFormat - 'jpeg' | 'png' | 'webp' | 'avif'
 * @param {Object} options 
 * @returns {Promise<Buffer>}
 */
async function convertImage(buffer, targetFormat, options = {}) {
  const format = (targetFormat || 'png').toLowerCase().replace('jpg', 'jpeg');
  const quality = options.quality ? parseInt(options.quality, 10) : 90;

  let pipeline = sharp(buffer);

  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 8 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality });
      break;
    default:
      pipeline = pipeline.toFormat(format);
      break;
  }

  return await pipeline.toBuffer();
}

module.exports = {
  compressImage,
  convertImage
};
