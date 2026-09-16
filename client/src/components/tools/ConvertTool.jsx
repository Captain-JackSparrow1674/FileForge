import React, { useState } from 'react';
import DropZone from '../DropZone';
import ProgressBar from '../ProgressBar';
import ResultView from '../ResultView';
import { formatBytes } from '../../utils/formatters';
import { ConvertIcon, AlertIcon, TrashIcon } from '../common/Icons';

export default function ConvertTool() {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const getValidTargetFormats = (fileList = files) => {
    if (!fileList || fileList.length === 0) return [];
    
    // If multiple files are uploaded, target must be PDF (image to pdf)
    if (fileList.length > 1) {
      return [{ id: 'pdf', label: 'PDF Document (.pdf) — Combine all images' }];
    }

    const first = fileList[0];
    const name = first.name.toLowerCase();

    if (name.endsWith('.pdf')) {
      return [
        { id: 'docx', label: 'Word Document (.docx)' }
      ];
    }

    if (name.endsWith('.docx')) {
      return [
        { id: 'pdf', label: 'PDF Document (.pdf)' }
      ];
    }

    if (/\.(jpg|jpeg|png|webp|avif)$/.test(name)) {
      return [
        { id: 'pdf', label: 'PDF Document (.pdf)' },
        { id: 'jpeg', label: 'JPEG Image (.jpg)' },
        { id: 'png', label: 'PNG Image (.png)' },
        { id: 'webp', label: 'WebP Image (.webp)' },
        { id: 'avif', label: 'AVIF Image (.avif)' }
      ].filter(f => !name.endsWith(`.${f.id}`));
    }

    return [{ id: 'pdf', label: 'PDF Document (.pdf)' }];
  };

  const handleFilesSelected = (selected) => {
    setFiles(selected);
    setError(null);
    setResult(null);

    // Compute valid formats using the selected files array directly
    const valid = getValidTargetFormats(selected);
    if (valid.length > 0) {
      setTargetFormat(valid[0].id);
    }
  };

  const handleConvert = async () => {
    if (!files || files.length === 0) {
      setError('Please select at least one file to convert.');
      return;
    }

    const valid = getValidTargetFormats(files);
    const chosenFormat = targetFormat || (valid.length > 0 ? valid[0].id : 'pdf');

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
      files.forEach((f) => formData.append('files', f));
      formData.append('targetFormat', chosenFormat);

      const response = await fetch('/api/convert', {
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
        throw new Error(data.error || 'Failed to convert document.');
      }

      setResult(data);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Error occurred during conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <ResultView
        resultData={result}
        onReset={() => {
          setFiles([]);
          setResult(null);
        }}
      />
    );
  }

  const validFormats = getValidTargetFormats();

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-[#D94A26] uppercase tracking-wider font-semibold">
            [Apparatus 02]
          </span>
          <span className="text-[#494F5D]">•</span>
          <span className="font-mono text-xs text-[#808694]">Format Transmutation</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F4F1EA]">
          Convert Document Formats
        </h2>
        <p className="text-sm text-[#8B919E] mt-1">
          Transmute between PDF ↔ DOCX, Images → PDF, or inter-image codecs with structural preservation.
        </p>
      </div>

      {files.length === 0 ? (
        <DropZone
          multiple={true}
          accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.avif"
          onFilesSelected={handleFilesSelected}
          title="Drop file(s) to convert"
          subtitle="Supports PDF, DOCX, JPEG, PNG, WEBP. Drop multiple images to compile a PDF."
        />
      ) : (
        <div className="bg-[#131518] border border-[#262A32] p-6 space-y-6 text-left">
          {/* Selected Files List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#858B98]">
                Input Payload ({files.length} {files.length === 1 ? 'file' : 'files'})
              </span>
              <button
                onClick={() => setFiles([])}
                className="font-mono text-xs text-[#A1A7B4] hover:text-[#EAE6DE] transition-colors underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-[#181A20] border border-[#262A33]"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-1.5 bg-[#21242C] text-[#D94A26]">
                      <ConvertIcon className="w-4 h-4" />
                    </div>
                    <span className="font-display font-medium text-sm text-[#F4F1EA] truncate">
                      {f.name}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#7B828F] shrink-0 ml-4">
                    {formatBytes(f.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Format Dropdown / Selection */}
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A909E] block mb-2">
              Target Output Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {validFormats.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setTargetFormat(fmt.id)}
                  className={`p-3.5 text-left border transition-all cursor-pointer ${
                    targetFormat === fmt.id
                      ? 'bg-[#1C1F26] border-[#D94A26] text-[#F4F1EA]'
                      : 'bg-[#15171C] border-[#262A33] text-[#868C98] hover:border-[#373C48]'
                  }`}
                >
                  <div className="font-mono text-xs font-semibold text-[#F4F1EA]">
                    {fmt.label}
                  </div>
                  <div className="text-[11px] text-[#7A808D] mt-1 font-mono">
                    Format: .{fmt.id}
                  </div>
                </button>
              ))}
            </div>
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
              statusMessage="Converting bitstream format..."
              subMessage={`Synthesizing output payload as .${targetFormat}`}
            />
          ) : (
            <button
              onClick={handleConvert}
              className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
            >
              Convert to .{targetFormat.toUpperCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
