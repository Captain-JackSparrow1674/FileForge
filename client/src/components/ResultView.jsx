import React, { useState, useEffect } from 'react';
import { formatBytes, triggerDownload } from '../utils/formatters';
import { DownloadIcon, CheckIcon } from './common/Icons';

export default function ResultView({
  resultData,
  onReset
}) {
  const {
    filename = 'result.bin',
    originalSize = 0,
    newSize = 0,
    size = 0,
    contentType = 'application/octet-stream',
    data, // base64 string or Blob
    downloadUrl = null,
    percentSaved = null
  } = resultData;

  const finalOutputSize = newSize || size || 0;

  // Calculate savings percentage if not provided
  let calculatedPercent = percentSaved;
  if (calculatedPercent === null && originalSize > 0 && finalOutputSize > 0) {
    const diff = originalSize - finalOutputSize;
    calculatedPercent = diff > 0 ? Math.round((diff / originalSize) * 100) : 0;
  }

  const isSmaller = originalSize > 0 && finalOutputSize < originalSize;
  const isBigger = originalSize > 0 && finalOutputSize > originalSize;

  // Generate fallback Blob URL if downloadUrl is missing
  const [blobUrl, setBlobUrl] = useState('');

  useEffect(() => {
    if (!data || downloadUrl) return;
    let url = '';

    try {
      if (data instanceof Blob) {
        url = URL.createObjectURL(data);
      } else if (typeof data === 'string') {
        if (data.startsWith('blob:') || data.startsWith('http')) {
          url = data;
        } else {
          // Chunked base64 decode
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
          const blob = new Blob(byteArrays, { type: contentType });
          url = URL.createObjectURL(blob);
        }
      }
      setBlobUrl(url);
    } catch (err) {
      console.error('Failed to construct fallback blob URL:', err);
    }

    return () => {
      if (url && url.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    };
  }, [data, contentType, downloadUrl]);

  // Primary URL for direct native browser download
  const primaryHref = downloadUrl || blobUrl || '#';

  const handleFallbackClick = (e) => {
    // Only intercept if there's no server downloadUrl
    if (!downloadUrl) {
      e.preventDefault();
      triggerDownload(blobUrl || data, filename, contentType);
    }
  };

  return (
    <div className="w-full bg-[#121418] border border-[#272B33] p-6 md:p-8 text-left">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#23272F]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#213824] border border-[#3E6543] flex items-center justify-center text-[#82D086]">
            <CheckIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl md:text-2xl text-[#F2EEE7]">
              Forge Operation Completed
            </h3>
            <span className="font-mono text-xs text-[#828896]">
              {filename}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#6BA86D] bg-[#162719] px-2 py-0.5 border border-[#2B4B2F]">
                ✓ Saved to local project: output/{filename}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Direct view in new tab for PDF / Images */}
          {(downloadUrl || blobUrl) && (
            <a
              href={downloadUrl || blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-3 bg-[#1A1D23] hover:bg-[#252932] text-[#D5D8DF] font-mono text-xs tracking-wide transition-colors border border-[#2C303B]"
            >
              Open in New Tab
            </a>
          )}

          {/* Standard native HTML5 download anchor (Unimpeded by preventDefault) */}
          <a
            href={primaryHref}
            download={filename}
            onClick={handleFallbackClick}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E85B33]"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Download Processed File</span>
          </a>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {/* Original */}
        <div className="bg-[#17191E] p-4 border border-[#252830]">
          <span className="font-mono text-[10px] text-[#717784] uppercase tracking-wider block">
            Original Payload
          </span>
          <span className="font-mono text-xl font-bold text-[#EAE6DE] mt-1 block">
            {originalSize > 0 ? formatBytes(originalSize) : '—'}
          </span>
        </div>

        {/* Processed */}
        <div className="bg-[#17191E] p-4 border border-[#252830]">
          <span className="font-mono text-[10px] text-[#717784] uppercase tracking-wider block">
            Forged Output
          </span>
          <span className="font-mono text-xl font-bold text-[#F4F1EA] mt-1 block">
            {finalOutputSize > 0 ? formatBytes(finalOutputSize) : '—'}
          </span>
        </div>

        {/* Delta / Savings */}
        <div className="bg-[#17191E] p-4 border border-[#252830] flex flex-col justify-between">
          <span className="font-mono text-[10px] text-[#717784] uppercase tracking-wider block">
            Footprint Delta
          </span>
          <div className="flex items-center gap-2 mt-1">
            {isSmaller ? (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#1F3622] text-[#7CE082] border border-[#2F5234] font-mono text-xs font-bold">
                -{calculatedPercent}% Smaller
              </span>
            ) : isBigger ? (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#2A2016] text-[#E0A05A] border border-[#483723] font-mono text-xs font-bold">
                Format Synthesized
              </span>
            ) : (
              <span className="font-mono text-xs text-[#8A909E]">
                Target Generated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Return to workspace */}
      <div className="pt-4 flex items-center justify-between border-t border-[#23272F]">
        <button
          onClick={onReset}
          className="font-mono text-xs text-[#959BA7] hover:text-[#E2DED6] transition-colors underline underline-offset-4 cursor-pointer"
        >
          ← Forge Another File
        </button>
        <span className="font-mono text-[11px] text-[#5A606C]">
          Saved payload will persist in this session
        </span>
      </div>
    </div>
  );
}
