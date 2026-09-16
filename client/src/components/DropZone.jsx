import React, { useState, useRef } from 'react';
import { UploadIcon, AlertIcon } from './common/Icons';

export default function DropZone({
  onFilesSelected,
  accept = '*',
  multiple = false,
  title = "Drop your document here",
  subtitle = "Or browse from your local storage to begin forging",
  allowedTypesNotice = "Supports PDF, DOCX, JPEG, PNG, WEBP up to 50MB"
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeWarning, setSizeWarning] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndForward = (fileList) => {
    setSizeWarning(null);
    const files = Array.from(fileList);
    
    // Check 50MB limit
    const oversized = files.filter(f => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      setSizeWarning(`Warning: ${oversized.length} file(s) exceed the 50MB threshold and were excluded.`);
    }

    const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024);
    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndForward(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndForward(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className={`relative border-2 border-dashed transition-all duration-150 cursor-pointer p-8 md:p-12 text-center group bg-hatch-pattern ${
          isDragOver
            ? 'border-[#D94A26] bg-[#D94A26]/5 scale-[0.995]'
            : 'border-[#272B33] hover:border-[#3E4450] bg-[#121417]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Technical Corner Markers */}
        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#49505E]" />
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#49505E]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#49505E]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#49505E]" />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className={`p-4 rounded-none border transition-colors ${
            isDragOver 
              ? 'bg-[#D94A26] text-white border-[#D94A26]' 
              : 'bg-[#181A1F] text-[#868C98] border-[#292D36] group-hover:text-[#F3EFE9] group-hover:border-[#3A3F4C]'
          }`}>
            <UploadIcon className="w-8 h-8" />
          </div>

          <h3 className="font-display font-medium text-xl md:text-2xl text-[#EAE6DE] mt-5 tracking-tight">
            {title}
          </h3>

          <p className="text-sm text-[#878D99] mt-2 font-normal">
            {subtitle}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 bg-[#17191E] border border-[#262A32] text-[11px] font-mono text-[#9BA1AF]">
            <span>{allowedTypesNotice}</span>
          </div>
        </div>
      </div>

      {sizeWarning && (
        <div className="mt-3 p-3 bg-[#2D1B17] border border-[#D94A26]/50 flex items-center gap-3 text-xs text-[#F2C0B5] font-mono">
          <AlertIcon className="w-4 h-4 text-[#D94A26] shrink-0" />
          <span>{sizeWarning}</span>
        </div>
      )}
    </div>
  );
}
