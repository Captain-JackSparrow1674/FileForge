const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Output directory in the project workspace
const OUTPUT_DIR = path.resolve(__dirname, '../../output');
if (!fs.existsSync(OUTPUT_DIR)) {
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create output dir:', err);
  }
}

// In-memory store for generated downloads
const downloadCache = new Map();

/**
 * Store a forged file buffer, save to local output directory, and return a unique download ID
 * @param {Buffer} buffer 
 * @param {string} filename 
 * @param {string} contentType 
 * @returns {string} downloadId
 */
function saveDownload(buffer, filename, contentType = 'application/octet-stream') {
  const id = crypto.randomUUID();

  // 1. Save to in-memory cache
  downloadCache.set(id, {
    buffer,
    filename,
    contentType,
    createdAt: Date.now()
  });

  // 2. Save directly to local output directory in workspace
  try {
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`[FileForge] Saved to local workspace file: ${filePath} (${buffer.length} bytes)`);
  } catch (err) {
    console.warn(`[FileForge] Could not write to output directory:`, err.message);
  }

  // 3. Auto clean cache after 60 minutes
  setTimeout(() => {
    downloadCache.delete(id);
  }, 60 * 60 * 1000);

  return id;
}

/**
 * Retrieve stored file by ID
 * @param {string} id 
 * @returns {{ buffer: Buffer, filename: string, contentType: string } | null}
 */
function getDownload(id) {
  return downloadCache.get(id) || null;
}

module.exports = {
  saveDownload,
  getDownload,
  OUTPUT_DIR
};
