/**
 * Format bytes to human readable format (KB, MB, GB)
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Trigger file download directly from browser
 * @param {Blob|string} data 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function triggerDownload(data, filename = 'download', mimeType = 'application/octet-stream') {
  if (!data) return;

  try {
    let blob;
    if (data instanceof Blob) {
      blob = data;
    } else if (typeof data === 'string') {
      if (data.startsWith('blob:') || data.startsWith('http:') || data.startsWith('https:')) {
        const a = document.createElement('a');
        a.href = data;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 2000);
        return;
      }

      // Convert base64 in 512KB slices to avoid memory or callstack crashes on large files
      const byteCharacters = atob(data);
      const byteArrays = [];
      const sliceSize = 512 * 1024;
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Uint8Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(byteNumbers);
      }
      blob = new Blob(byteArrays, { type: mimeType });
    }

    if (!blob) return;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Keep blob URL alive for at least 60 seconds so browser download completes cleanly
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (e) {}
    }, 60000);
  } catch (err) {
    console.error('triggerDownload failed:', err);
  }
}
