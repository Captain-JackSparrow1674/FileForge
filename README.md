# FileForge — Full-Stack Document & Media Workshop

> A full-stack file toolkit for compressing, converting, and editing PDFs, Word DOCX documents, and images. Designed with an editorial workshop aesthetic, zero cloud telemetry, and in-memory processing.

---

## Features

### 1. File Compression
- **Lossless & Tuned Compression**: Optimize PDF, PNG, JPEG, WebP, AVIF, and DOCX files.
- **Fidelity Controls**: Presets (*Maximum Reduction*, *Balanced*, *High Fidelity*) + real-time 15%–95% fine slider.
- **Side-by-Side Telemetry**: Byte-exact before/after metrics with a `% smaller` footprint savings badge.

### 2. Format Matrix (Conversion)
- **PDF ↔ DOCX**: Convert Word documents to PDF and extract PDF text into structured, styled Word documents.
- **Images → PDF**: Merge single or multiple images (PNG, JPEG, WebP) into a combined PDF document.
- **Image Codecs**: Transmute between JPEG ↔ PNG ↔ WebP ↔ AVIF.

### 3. PDF Studio
- **Visual Page Arranger**: Interactive page thumbnails rendered directly in the browser via `pdfjs-dist`.
- **Page Transformations**: 90° clockwise rotation per page, drag/move order, and page removal.
- **Document Concatenation**: Merge additional PDF files into a single unified output.
- **Diagonal Watermark Stamp**: Custom text, angle (0°–90°), opacity (5%–80%), and font size.
- **Page Numbers**: Stencil positions (bottom-center, bottom-right, top-right, top-center) and format tokens (`Page {n} of {total}`).
- **Page Splitting**: Extract specific pages or intervals (e.g. `1-3, 5`).

### 4. DOCX Studio
- **Manuscript Extraction**: Extracts Word document text and HTML structure via `mammoth`.
- **Batch Find & Replace**: Global case-insensitive search and replace across the document body.
- **Header & Footer Stencils**: Right-aligned top margin headers and centered bottom margin footers.
- **Dual Export**: One-click download as either Microsoft Word (`.docx`) or formatted PDF (`.pdf`).

---

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS (with a custom editorial workshop design system), `pdfjs-dist`.
- **Backend**: Node.js, Express, `multer`.
- **Processing Libraries**:
  - PDF: `pdf-lib`
  - Images: `sharp`
  - Word: `mammoth`, `docx`, `pdf-parse`
- **Typography**: Google Fonts `Fraunces` (Display Serif) + `JetBrains Mono` (Technical Code) + `Plus Jakarta Sans` (Interface).

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
Clone the repository and install dependencies:
```bash
# Clone the repository
git clone <your-repo-url>
cd PDF_TOOL

# Install root, backend, and frontend packages
npm install
npm --prefix server install
npm --prefix client install
```

### Running Locally
Run both the Express backend and the Vite development client with a single command:
```bash
npm start
```
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`

---

## Architecture & Project Structure

```
PDF_TOOL/
├── client/                      # React (Vite) Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CommandRail.jsx  # Vertical tool switcher
│   │   │   ├── DropZone.jsx     # Tactile drag-and-drop target
│   │   │   ├── ProgressBar.jsx  # Hatch-striped mechanical progress
│   │   │   ├── ResultView.jsx   # Comparison metrics & download
│   │   │   ├── common/Icons.jsx # Handcrafted SVG tool glyphs
│   │   │   └── tools/           # Compress, Convert, PdfEdit, DocxEdit
│   │   ├── index.css            # Workshop styles & design tokens
│   │   └── App.jsx
│   └── vite.config.js
│
├── server/                      # Express Backend
│   ├── routes/                  # /api/compress, /api/convert, /api/pdf, /api/docx
│   ├── services/
│   │   ├── pdfService.js        # pdf-lib manipulation & compression
│   │   ├── imageService.js      # sharp image pipeline
│   │   ├── docxService.js       # mammoth + docx generation
│   │   └── downloadStore.js     # RFC binary download cache & local auto-save
│   └── server.js
│
├── output/                      # Auto-saved local output copies
├── start.js                     # Unified concurrent process launcher
└── package.json
```

---

## License
MIT
