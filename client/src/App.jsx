import React, { useState } from 'react';
import CommandRail from './components/CommandRail';
import CompressTool from './components/tools/CompressTool';
import ConvertTool from './components/tools/ConvertTool';
import PdfEditorTool from './components/tools/PdfEditorTool';
import DocxEditorTool from './components/tools/DocxEditorTool';

export default function App() {
  const [activeTool, setActiveTool] = useState('compress');

  return (
    <div className="min-h-screen bg-[#0C0D0F] text-[#E8E4DC] flex flex-col md:flex-row bg-forge-grid">
      {/* Fixed Vertical Command Rail */}
      <CommandRail
        activeTool={activeTool}
        onSelectTool={setActiveTool}
      />

      {/* Primary Workshop Workbench */}
      <main className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="max-w-5xl w-full mx-auto p-6 md:p-12 space-y-8">
          {/* Typographic Asymmetric Hero / Header */}
          <header className="border-b border-[#21242C] pb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#D94A26] font-semibold">
                  FileForge Workshop • No Cloud Telemetry
                </span>
                <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-[#F5F2EA] tracking-tight mt-2 leading-[1.08]">
                  Drop a file. Pick what you want it to become.
                </h1>
              </div>
              <div className="font-mono text-xs text-[#7B828F] text-right hidden sm:block">
                <div>SESSION LOCAL</div>
                <div className="text-[#A2A9B6]">FAST IN-MEMORY ENGINE</div>
              </div>
            </div>
          </header>

          {/* Active Apparatus Station */}
          <section className="min-h-[500px]">
            {activeTool === 'compress' && <CompressTool />}
            {activeTool === 'convert' && <ConvertTool />}
            {activeTool === 'pdf-edit' && <PdfEditorTool />}
            {activeTool === 'docx-edit' && <DocxEditorTool />}
          </section>
        </div>

        {/* Workbench Technical Footer */}
        <footer className="border-t border-[#1F2229] py-6 px-6 md:px-12 bg-[#090A0C]">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6C7280]">
            <div>
              <span>FileForge Heavy Document Workbench</span>
              <span className="mx-2">•</span>
              <span>All operations executed locally in-memory</span>
            </div>
            <div className="flex items-center gap-4">
              <span>PDF-LIB</span>
              <span>SHARP</span>
              <span>MAMMOTH</span>
              <span>DOCX</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
