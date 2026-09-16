import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import DropZone from '../DropZone';
import ProgressBar from '../ProgressBar';
import ResultView from '../ResultView';
import { formatBytes } from '../../utils/formatters';
import {
  PdfEditIcon,
  RotateIcon,
  TrashIcon,
  MergeIcon,
  WatermarkIcon,
  PageNumberIcon,
  SplitIcon,
  AlertIcon
} from '../common/Icons';

// Set worker source for PDF.js in Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

export default function PdfEditorTool() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // [{ originalIndex: 0, rotation: 0, previewUrl: '' }]
  const [activeTab, setActiveTab] = useState('organize'); // organize, merge, watermark, numbering, split
  
  // Extra files for merge
  const [additionalFiles, setAdditionalFiles] = useState([]);
  
  // Watermark settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkSize, setWatermarkSize] = useState(48);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [watermarkColor, setWatermarkColor] = useState('#D94A26');

  // Page numbering settings
  const [numberPosition, setNumberPosition] = useState('bottom-center');
  const [numberFormat, setNumberFormat] = useState('Page {n} of {total}');

  // Split settings
  const [splitRange, setSplitRange] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Render thumbnails when a PDF file is loaded
  const loadPdfThumbnails = async (pdfFile) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      const totalPages = doc.numPages;

      const pageItems = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;
        const previewUrl = canvas.toDataURL('image/jpeg', 0.8);

        pageItems.push({
          id: `page-${i}`,
          originalIndex: i - 1,
          displayNum: i,
          rotation: 0,
          previewUrl
        });
      }

      setPages(pageItems);
    } catch (err) {
      console.warn('PDF.js thumbnail render warning, fallback to placeholders:', err);
      // Fallback placeholder pages if PDF.js worker encounters CSP or font warning
      const count = 5;
      const placeholders = Array.from({ length: count }, (_, i) => ({
        id: `page-${i + 1}`,
        originalIndex: i,
        displayNum: i + 1,
        rotation: 0,
        previewUrl: null
      }));
      setPages(placeholders);
    }
  };

  const handleFileSelected = async (files) => {
    if (files && files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setError(null);
      setResult(null);
      await loadPdfThumbnails(selected);
    }
  };

  // Rotate a page by 90 degrees clockwise
  const handleRotatePage = (index) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        rotation: (updated[index].rotation + 90) % 360
      };
      return updated;
    });
  };

  // Remove a page
  const handleDeletePage = (index) => {
    if (pages.length <= 1) {
      setError('A document must retain at least one page.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Reorder page move left/right
  const handleMovePage = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    setPages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  // Submit Operations
  const runOperation = async (endpoint, formData, actionLabel) => {
    setIsProcessing(true);
    setError(null);
    setProgress(20);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 12));
    }, 200);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });

      clearInterval(interval);
      setProgress(100);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to execute ${actionLabel}`);
      }

      setResult(data);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Save Reordered / Rotated / Filtered PDF
  const handleApplyReorder = () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'pageConfigs',
      JSON.stringify(pages.map((p) => ({ originalIndex: p.originalIndex, rotation: p.rotation })))
    );
    runOperation('/api/pdf/reorder', formData, 'Reorder & Page Transform');
  };

  // 2. Merge PDFs
  const handleMerge = () => {
    if (additionalFiles.length === 0) {
      setError('Please add at least one additional PDF file to merge.');
      return;
    }
    const formData = new FormData();
    formData.append('files', file);
    additionalFiles.forEach((f) => formData.append('files', f));
    runOperation('/api/pdf/merge', formData, 'Document Merge');
  };

  // 3. Watermark PDF
  const handleWatermark = () => {
    if (!watermarkText.trim()) {
      setError('Watermark text cannot be blank.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', watermarkText.trim());
    formData.append('opacity', watermarkOpacity);
    formData.append('size', watermarkSize);
    formData.append('angle', watermarkAngle);
    formData.append('color', watermarkColor);
    runOperation('/api/pdf/watermark', formData, 'Watermark Application');
  };

  // 4. Page Numbers
  const handlePageNumbers = () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('position', numberPosition);
    formData.append('format', numberFormat);
    runOperation('/api/pdf/page-numbers', formData, 'Page Numbering');
  };

  // 5. Split PDF
  const handleSplit = () => {
    if (!splitRange.trim()) {
      setError('Please specify page numbers or range to extract (e.g. 1-3, 5).');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pages', splitRange.trim());
    runOperation('/api/pdf/split', formData, 'PDF Extraction');
  };

  if (result) {
    return (
      <ResultView
        resultData={result}
        onReset={() => {
          setFile(null);
          setPages([]);
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
            [Apparatus 03]
          </span>
          <span className="text-[#494F5D]">•</span>
          <span className="font-mono text-xs text-[#808694]">Structural PDF Studio</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F4F1EA]">
          Edit & Organize PDF Pages
        </h2>
        <p className="text-sm text-[#8B919E] mt-1">
          Rearrange, rotate, delete, watermark, number, or stitch together multi-page PDF documents.
        </p>
      </div>

      {!file ? (
        <DropZone
          accept=".pdf"
          onFilesSelected={handleFileSelected}
          title="Drop PDF to enter studio"
          subtitle="Load pages into the visual grid to rotate, reorder, watermark, or extract"
        />
      ) : (
        <div className="bg-[#131518] border border-[#262A32] p-6 space-y-6 text-left">
          {/* File Plate & Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#242730]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#21242C] text-[#D94A26]">
                <PdfEditIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-medium text-base text-[#F4F1EA]">
                  {file.name}
                </span>
                <span className="font-mono text-xs text-[#7D8391] block">
                  {pages.length} Pages • {formatBytes(file.size)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPages([]);
              }}
              className="font-mono text-xs text-[#9DA3B0] hover:text-[#EAE6DE] transition-colors underline cursor-pointer"
            >
              Load Different PDF
            </button>
          </div>

          {/* Sub-Apparatus Selector Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#242730] pb-3">
            {[
              { id: 'organize', label: 'Pages & Rotation', icon: PdfEditIcon },
              { id: 'merge', label: 'Merge PDFs', icon: MergeIcon },
              { id: 'watermark', label: 'Watermark', icon: WatermarkIcon },
              { id: 'numbering', label: 'Page Numbers', icon: PageNumberIcon },
              { id: 'split', label: 'Extract / Split', icon: SplitIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError(null);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? 'bg-[#1C1E24] border-[#D94A26] text-[#F4F1EA]'
                      : 'bg-[#14161A] border-[#252831] text-[#7F8592] hover:text-[#D5D8E0]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: ORGANIZE & ROTATE GRID */}
          {activeTab === 'organize' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#868C99]">
                <span>
                  Showing {pages.length} pages. Click rotation or move arrows to reorganize.
                </span>
              </div>

              {/* Visual Thumbnail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group relative bg-[#17191E] border border-[#272A33] p-2.5 flex flex-col items-center justify-between paper-card"
                  >
                    {/* Page Index Badge */}
                    <div className="w-full flex items-center justify-between mb-1.5 px-1">
                      <span className="font-mono text-[11px] text-[#A1A7B5] font-semibold">
                        P. {idx + 1}
                      </span>
                      {p.rotation > 0 && (
                        <span className="font-mono text-[9px] px-1 py-0.2 bg-[#D94A26]/20 text-[#D94A26] border border-[#D94A26]/40">
                          {p.rotation}°
                        </span>
                      )}
                    </div>

                    {/* Canvas Thumbnail Image or Placeholder */}
                    <div className="w-full aspect-[1/1.4] bg-[#0E1012] border border-[#21242C] overflow-hidden flex items-center justify-center relative">
                      {p.previewUrl ? (
                        <img
                          src={p.previewUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-contain transition-transform duration-200"
                          style={{ transform: `rotate(${p.rotation}deg)` }}
                        />
                      ) : (
                        <div className="text-center p-3">
                          <span className="font-display text-2xl text-[#424855]">
                            P.{p.displayNum}
                          </span>
                          <span className="font-mono text-[9px] text-[#5A606D] block mt-1">
                            PDF Stream
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Rail: Rotate, Move, Delete */}
                    <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-[#22252D]">
                      {/* Move left */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePage(idx, -1)}
                        className="p-1 text-[#787E8B] hover:text-[#F3EFE9] disabled:opacity-20 cursor-pointer"
                        title="Move Page Backward"
                      >
                        ←
                      </button>

                      {/* Rotate 90 deg */}
                      <button
                        type="button"
                        onClick={() => handleRotatePage(idx)}
                        className="p-1 text-[#787E8B] hover:text-[#D94A26] cursor-pointer"
                        title="Rotate 90° Clockwise"
                      >
                        <RotateIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeletePage(idx)}
                        className="p-1 text-[#787E8B] hover:text-[#E84E4E] cursor-pointer"
                        title="Remove Page"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* Move right */}
                      <button
                        type="button"
                        disabled={idx === pages.length - 1}
                        onClick={() => handleMovePage(idx, 1)}
                        className="p-1 text-[#787E8B] hover:text-[#F3EFE9] disabled:opacity-20 cursor-pointer"
                        title="Move Page Forward"
                      >
                        →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#23262E]">
                <button
                  onClick={handleApplyReorder}
                  className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
                >
                  Save Reordered & Rotated PDF
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MERGE WITH MORE PDFS */}
          {activeTab === 'merge' && (
            <div className="space-y-4">
              <span className="font-mono text-xs uppercase tracking-wider text-[#858B97] block">
                Select additional PDF documents to append
              </span>

              <div className="p-4 bg-[#17191E] border border-[#262A32] space-y-3">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setAdditionalFiles(Array.from(e.target.files));
                    }
                  }}
                  className="block w-full text-xs font-mono text-[#8C92A0] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-mono file:bg-[#252831] file:text-[#F2EFE8] hover:file:bg-[#323642] cursor-pointer"
                />

                {additionalFiles.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <span className="font-mono text-[11px] text-[#717784] block">
                      Files ready to concatenate:
                    </span>
                    {additionalFiles.map((f, i) => (
                      <div key={i} className="text-xs font-mono text-[#F4F1EA] flex justify-between">
                        <span>{i + 2}. {f.name}</span>
                        <span className="text-[#6D7380]">{formatBytes(f.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleMerge}
                className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
              >
                Merge Documents Into Single PDF
              </button>
            </div>
          )}

          {/* TAB 3: WATERMARK */}
          {activeTab === 'watermark' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-[#8A909F] block mb-1">
                    Stamp Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL, DRAFT, INTERNAL"
                    className="w-full p-2.5 bg-[#17191E] border border-[#272B33] text-sm text-[#F4F1EA] font-mono focus:border-[#D94A26] outline-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-[#8A909F] block mb-1">
                    Stamp Angle: {watermarkAngle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={watermarkAngle}
                    onChange={(e) => setWatermarkAngle(parseInt(e.target.value, 10))}
                    className="w-full accent-[#D94A26] bg-[#22252D] h-2 cursor-pointer mt-2"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-[#8A909F] block mb-1">
                    Opacity: {Math.round(watermarkOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-[#D94A26] bg-[#22252D] h-2 cursor-pointer mt-2"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-[#8A909F] block mb-1">
                    Font Size: {watermarkSize}pt
                  </label>
                  <input
                    type="number"
                    value={watermarkSize}
                    onChange={(e) => setWatermarkSize(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-[#17191E] border border-[#272B33] text-sm text-[#F4F1EA] font-mono focus:border-[#D94A26] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleWatermark}
                className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
              >
                Apply Watermark Stamp Across All Pages
              </button>
            </div>
          )}

          {/* TAB 4: PAGE NUMBERS */}
          {activeTab === 'numbering' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-[#8A909F] block mb-1">
                    Position
                  </label>
                  <select
                    value={numberPosition}
                    onChange={(e) => setNumberPosition(e.target.value)}
                    className="w-full p-2.5 bg-[#17191E] border border-[#272B33] text-sm text-[#F4F1EA] font-mono outline-none"
                  >
                    <option value="bottom-center">Bottom Center (Classic)</option>
                    <option value="bottom-right">Bottom Right (Editorial)</option>
                    <option value="top-right">Top Right (Header)</option>
                    <option value="top-center">Top Center</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-xs text-[#8A909F] block mb-1">
                    Format Stencil
                  </label>
                  <select
                    value={numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value)}
                    className="w-full p-2.5 bg-[#17191E] border border-[#272B33] text-sm text-[#F4F1EA] font-mono outline-none"
                  >
                    <option value="Page {n} of {total}">Page &#123;n&#125; of &#123;total&#125;</option>
                    <option value="{n} / {total}">&#123;n&#125; / &#123;total&#125;</option>
                    <option value="{n}">Bare Number (&#123;n&#125;)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handlePageNumbers}
                className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
              >
                Stamp Page Numbering
              </button>
            </div>
          )}

          {/* TAB 5: SPLIT / EXTRACT */}
          {activeTab === 'split' && (
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-[#8A909F] block mb-1">
                  Specify Page Range to Extract
                </label>
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7"
                  className="w-full p-2.5 bg-[#17191E] border border-[#272B33] text-sm text-[#F4F1EA] font-mono focus:border-[#D94A26] outline-none"
                />
                <span className="font-mono text-[11px] text-[#717784] mt-1 block">
                  Total available pages in this document: {pages.length}
                </span>
              </div>

              <button
                onClick={handleSplit}
                className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
              >
                Extract Pages Into Standalone PDF
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#2C1916] border border-[#D94A26]/50 flex items-start gap-3 text-xs text-[#F2B5A8] font-mono">
              <AlertIcon className="w-4 h-4 text-[#D94A26] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isProcessing && (
            <ProgressBar
              progress={progress}
              statusMessage="Processing PDF operations..."
              subMessage="Reconstructing document catalog and applying transformations"
            />
          )}
        </div>
      )}
    </div>
  );
}
