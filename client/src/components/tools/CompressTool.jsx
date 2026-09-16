import React, { useState } from 'react';
import DropZone from '../DropZone';
import ProgressBar from '../ProgressBar';
import ResultView from '../ResultView';
import { formatBytes } from '../../utils/formatters';
import { CompressIcon, AlertIcon } from '../common/Icons';

export default function CompressTool() {
  const [file, setFile] = useState(null);
  const [qualityPreset, setQualityPreset] = useState('medium');
  const [customQuality, setCustomQuality] = useState(70);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFilesSelected = (files) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(15);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 15 + 5);
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', customQuality);

      const response = await fetch('/api/compress', {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      });

      clearInterval(interval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to compress document.');
      }

      setResult(data);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Error occurred while compressing file.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <ResultView
        resultData={result}
        onReset={() => {
          setFile(null);
          setResult(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-[#D94A26] uppercase tracking-wider font-semibold">
            [Apparatus 01]
          </span>
          <span className="text-[#494F5D]">•</span>
          <span className="font-mono text-xs text-[#808694]">Density Optimizer</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F4F1EA]">
          Compress File Footprint
        </h2>
        <p className="text-sm text-[#8B919E] mt-1">
          Drop a PDF, PNG, or JPEG to strip dead metadata and squeeze binary streams without perceptual artifacts.
        </p>
      </div>

      {!file ? (
        <DropZone
          accept=".pdf,.jpg,.jpeg,.png,.webp,.avif,.docx"
          onFilesSelected={handleFilesSelected}
          title="Drop file to compress"
          subtitle="Supports PDF, JPEG, PNG, WebP up to 50MB"
        />
      ) : (
        <div className="bg-[#131518] border border-[#262A32] p-6 space-y-6 text-left">
          {/* File Selected Card */}
          <div className="flex items-center justify-between p-4 bg-[#181A20] border border-[#292D37]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#21242C] border border-[#303542] text-[#D94A26]">
                <CompressIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-medium text-base text-[#F4F1EA] block">
                  {file.name}
                </span>
                <span className="font-mono text-xs text-[#7F8593]">
                  Source Payload: {formatBytes(file.size)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="font-mono text-xs text-[#A1A7B4] hover:text-[#EAE6DE] transition-colors underline cursor-pointer"
            >
              Replace
            </button>
          </div>

          {/* Compression Presets */}
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A909E] block mb-3">
              Compression Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'low', label: 'Maximum Reduction', val: 40, desc: 'Highest byte savings, slight noise' },
                { id: 'medium', label: 'Balanced (Recommended)', val: 70, desc: 'Optimal ratio with zero visible loss' },
                { id: 'high', label: 'High Fidelity', val: 85, desc: 'Light squeeze preserving fine detail' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setQualityPreset(p.id);
                    setCustomQuality(p.val);
                  }}
                  className={`p-3.5 text-left border transition-all cursor-pointer ${
                    qualityPreset === p.id
                      ? 'bg-[#1C1F26] border-[#D94A26] text-[#F4F1EA]'
                      : 'bg-[#15171C] border-[#262A33] text-[#868C98] hover:border-[#373C48]'
                  }`}
                >
                  <div className="font-mono text-xs font-semibold text-[#F4F1EA]">
                    {p.label}
                  </div>
                  <div className="text-[11px] text-[#7A808D] mt-1">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Quality Range Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-[#8B919F] mb-2">
              <span>Fidelity Level</span>
              <span className="text-[#D94A26] font-bold">{customQuality}% Quality</span>
            </div>
            <input
              type="range"
              min="15"
              max="95"
              value={customQuality}
              onChange={(e) => {
                setCustomQuality(parseInt(e.target.value, 10));
                setQualityPreset('custom');
              }}
              className="w-full accent-[#D94A26] bg-[#22252D] h-2 rounded-none cursor-pointer"
            />
          </div>

          {error && (
            <div className="p-4 bg-[#2C1916] border border-[#D94A26]/50 flex items-start gap-3 text-xs text-[#F2B5A8] font-mono">
              <AlertIcon className="w-4 h-4 text-[#D94A26] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isProcessing ? (
            <ProgressBar
              progress={progress}
              statusMessage="Compressing document stream..."
              subMessage={`Repacking bytes at ${customQuality}% fidelity threshold`}
            />
          ) : (
            <button
              onClick={handleCompress}
              className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
            >
              Forge Compressed Document
            </button>
          )}
        </div>
      )}
    </div>
  );
}
