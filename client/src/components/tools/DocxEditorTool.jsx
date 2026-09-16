import React, { useState } from 'react';
import DropZone from '../DropZone';
import ProgressBar from '../ProgressBar';
import ResultView from '../ResultView';
import { formatBytes } from '../../utils/formatters';
import { DocxEditIcon, AlertIcon } from '../common/Icons';

export default function DocxEditorTool() {
  const [file, setFile] = useState(null);
  const [documentText, setDocumentText] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [exportFormat, setExportFormat] = useState('docx'); // 'docx' or 'pdf'
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileSelected = async (files) => {
    if (files && files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setError(null);
      setResult(null);
      setIsExtracting(true);

      try {
        const formData = new FormData();
        formData.append('file', selected);

        const res = await fetch('/api/docx/extract', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to extract text from DOCX file.');
        }

        setDocumentText(data.text || '');
      } catch (err) {
        setError(err.message || 'Error extracting document contents.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleApplyFindReplace = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const updated = documentText.replace(regex, replaceText);
    setDocumentText(updated);
    setFindText('');
    setReplaceText('');
  };

  const handleSaveDocument = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(20);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 15));
    }, 200);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('content', documentText);
      formData.append('headerText', headerText);
      formData.append('footerText', footerText);
      formData.append('exportFormat', exportFormat);

      const res = await fetch('/api/docx/edit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });

      clearInterval(interval);
      setProgress(100);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate document.');
      }

      setResult(data);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Error occurred while generating document.');
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
          setDocumentText('');
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
            [Apparatus 04]
          </span>
          <span className="text-[#494F5D]">•</span>
          <span className="font-mono text-xs text-[#808694]">Typography & Office Studio</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F4F1EA]">
          DOCX Editor & Exporter
        </h2>
        <p className="text-sm text-[#8B919E] mt-1">
          Extract text, execute batch search-and-replace, append headers/footers, and export cleanly to Word or PDF.
        </p>
      </div>

      {!file && !documentText ? (
        <div className="space-y-4">
          <DropZone
            accept=".docx"
            onFilesSelected={handleFileSelected}
            title="Drop Word document (.docx) to edit"
            subtitle="Or start with an empty canvas to forge a new document"
          />

          <div className="text-center">
            <button
              onClick={() => {
                setDocumentText('// Enter or paste your manuscript here...\n\n');
              }}
              className="font-mono text-xs text-[#D94A26] hover:text-[#EE5328] underline underline-offset-4 cursor-pointer"
            >
              Or compose a fresh document from scratch →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#131518] border border-[#262A32] p-6 space-y-6 text-left">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#242730]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#21242C] text-[#D94A26]">
                <DocxEditIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-medium text-base text-[#F4F1EA]">
                  {file ? file.name : 'Draft Document'}
                </span>
                <span className="font-mono text-xs text-[#7B818F] block">
                  {documentText.length} Characters • {documentText.split(/\s+/).filter(Boolean).length} Words
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setDocumentText('');
              }}
              className="font-mono text-xs text-[#9FA5B2] hover:text-[#EAE6DE] transition-colors underline cursor-pointer"
            >
              Reset Workbench
            </button>
          </div>

          {/* Find & Replace Bar */}
          <div className="p-3.5 bg-[#17191E] border border-[#262932] flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-[#8A909E] uppercase tracking-wider">
              Batch Replace:
            </span>
            <input
              type="text"
              placeholder="Find pattern..."
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="px-3 py-1.5 bg-[#101215] border border-[#282C36] text-xs font-mono text-[#F4F1EA] outline-none focus:border-[#D94A26] flex-1 min-w-[140px]"
            />
            <input
              type="text"
              placeholder="Substitute with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="px-3 py-1.5 bg-[#101215] border border-[#282C36] text-xs font-mono text-[#F4F1EA] outline-none focus:border-[#D94A26] flex-1 min-w-[140px]"
            />
            <button
              type="button"
              onClick={handleApplyFindReplace}
              className="px-4 py-1.5 bg-[#22262F] hover:bg-[#2F3440] text-xs font-mono text-[#F4F1EA] border border-[#353A48] cursor-pointer"
            >
              Execute Replace
            </button>
          </div>

          {/* Editable Manuscript Text Area */}
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A909E] block mb-2">
              Document Text Body
            </label>
            <textarea
              rows={12}
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Document text..."
              className="w-full p-4 bg-[#0E1012] border border-[#242730] text-sm text-[#EDE9E1] font-sans leading-relaxed focus:border-[#D94A26] outline-none resize-y"
            />
          </div>

          {/* Headers & Footers Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs text-[#8A909E] block mb-1">
                Header Text (Right-aligned top margin)
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="e.g. Confidential Report • Q3"
                className="w-full p-2.5 bg-[#17191E] border border-[#272B33] text-xs text-[#F4F1EA] font-mono outline-none focus:border-[#D94A26]"
              />
            </div>

            <div>
              <label className="font-mono text-xs text-[#8A909F] block mb-1">
                Footer Text (Centered bottom margin)
              </label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g. FileForge Engine Generated"
                className="w-full p-2.5 bg-[#17191E] border border-[#272B33] text-xs text-[#F4F1EA] font-mono outline-none focus:border-[#D94A26]"
              />
            </div>
          </div>

          {/* Export Format Selector */}
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-[#8A909E] block mb-2">
              Target Export Codec
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'docx', label: 'Export as Word Document (.docx)' },
                { id: 'pdf', label: 'Export as PDF Document (.pdf)' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setExportFormat(fmt.id)}
                  className={`p-3 text-left border transition-all cursor-pointer font-mono text-xs ${
                    exportFormat === fmt.id
                      ? 'bg-[#1C1F26] border-[#D94A26] text-[#F4F1EA]'
                      : 'bg-[#15171C] border-[#262A33] text-[#868C98] hover:border-[#373C48]'
                  }`}
                >
                  <div className="font-semibold text-[#F4F1EA]">{fmt.label}</div>
                  <div className="text-[11px] text-[#717784] mt-1">
                    Output: .{fmt.id}
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
              statusMessage="Forging document export..."
              subMessage={`Compiling formatting and rendering as .${exportFormat.toUpperCase()}`}
            />
          ) : (
            <button
              onClick={handleSaveDocument}
              className="w-full py-3.5 bg-[#D94A26] hover:bg-[#EE5328] text-white font-mono text-sm tracking-wide transition-colors cursor-pointer border border-[#E95B33]"
            >
              Export & Download .{exportFormat.toUpperCase()} Document
            </button>
          )}
        </div>
      )}
    </div>
  );
}
