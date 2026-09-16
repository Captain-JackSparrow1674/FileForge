import React from 'react';
import { AnvilIcon, CompressIcon, ConvertIcon, PdfEditIcon, DocxEditIcon } from './common/Icons';

export default function CommandRail({ activeTool, onSelectTool, fileCount }) {
  const tools = [
    {
      id: 'compress',
      index: '01',
      title: 'Compress',
      desc: 'Lossless & tuned reduction',
      icon: CompressIcon,
      formats: 'PDF, JPG, PNG, WEBP'
    },
    {
      id: 'convert',
      index: '02',
      title: 'Convert',
      desc: 'Interchange format matrix',
      icon: ConvertIcon,
      formats: 'PDF ↔ DOCX ↔ IMG'
    },
    {
      id: 'pdf-edit',
      index: '03',
      title: 'PDF Studio',
      desc: 'Reorder, rotate, watermark',
      icon: PdfEditIcon,
      formats: 'PDF Manipulation'
    },
    {
      id: 'docx-edit',
      index: '04',
      title: 'DOCX Studio',
      desc: 'Text, headers & layout',
      icon: DocxEditIcon,
      formats: 'Word / Office'
    }
  ];

  return (
    <aside className="w-full md:w-72 md:min-h-screen bg-[#111215] hairline-border border-r border-[#22252C] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#22252C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#D94A26] flex items-center justify-center text-white shadow-sm">
              <AnvilIcon className="w-5 h-5" color="#FFFFFF" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-[#F2EFE9] block leading-none">
                FileForge
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#858A94] uppercase mt-1 block">
                Editorial Workshop
              </span>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-6 pt-6 pb-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#696E79]">
            Select Apparatus
          </span>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTool(t.id)}
                className={`w-full text-left p-3 rounded-none transition-all flex items-start gap-3.5 border ${
                  isActive
                    ? 'bg-[#181A1F] border-[#D94A26] text-[#F3EFE8]'
                    : 'bg-transparent border-transparent text-[#9DA2AD] hover:bg-[#15171B] hover:text-[#D5D8DF] hover:border-[#252830]'
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-none border ${
                    isActive
                      ? 'bg-[#D94A26] text-white border-[#D94A26]'
                      : 'bg-[#1A1C22] text-[#838894] border-[#292C35]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-medium text-base text-[#F4F1EA]">
                      {t.title}
                    </span>
                    <span className="font-mono text-[10px] text-[#636873]">
                      [{t.index}]
                    </span>
                  </div>
                  <p className="text-xs text-[#828793] truncate mt-0.5">
                    {t.desc}
                  </p>
                  <span className="font-mono text-[9px] text-[#D94A26]/80 mt-1 block tracking-wider">
                    {t.formats}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-5 border-t border-[#22252C] bg-[#0E0F12]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6BA86D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4E8C50]"></span>
            </span>
            <span className="font-mono text-[11px] text-[#868B96] uppercase tracking-wider">
              Forge Engine
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#555A64]">
            v2.4 LOCAL
          </span>
        </div>
        <p className="font-mono text-[10px] text-[#606570] mt-2">
          Stateless • In-Memory Processing • 50MB Cap
        </p>
      </div>
    </aside>
  );
}
