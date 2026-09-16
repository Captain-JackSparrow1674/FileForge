import React from 'react';

export const AnvilIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16l-2 4H6L4 6z" />
    <path d="M7 10v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-4" />
    <path d="M5 21h14" />
    <path d="M9 17v4" />
    <path d="M15 17v4" />
  </svg>
);

export const CompressIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5" />
    <path d="M12 12v6" />
    <path d="m9 15 3-3 3 3" />
    <path d="M8 18h8" />
  </svg>
);

export const ConvertIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 8h10l-3-3" />
    <path d="M17 16H7l3 3" />
    <rect x="2" y="6" width="3" height="4" rx="0.5" />
    <rect x="19" y="14" width="3" height="4" rx="0.5" />
  </svg>
);

export const PdfEditIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="13" y2="12" />
    <circle cx="16" cy="15" r="2" />
    <path d="M16 17v3" />
  </svg>
);

export const DocxEditIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3v5h5" />
    <path d="M5 19V4a1 1 0 0 1 1-1h8l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
    <path d="M8 13h8" />
    <path d="M8 16h5" />
    <line x1="17" y1="18" x2="17.01" y2="18" />
  </svg>
);

export const UploadIcon = ({ className = "w-8 h-8", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    <path d="m8 9 4-5 4 5" />
    <line x1="12" y1="4" x2="12" y2="15" />
  </svg>
);

export const DownloadIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 15v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4" />
    <path d="m8 10 4 4 4-4" />
    <line x1="12" y1="3" x2="12" y2="14" />
  </svg>
);

export const RotateIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
    <polyline points="21 3 21 8 16 8" />
  </svg>
);

export const TrashIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const MergeIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="11" height="13" rx="1" />
    <rect x="10" y="8" width="11" height="13" rx="1" />
  </svg>
);

export const SplitIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4" />
    <path d="M16 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 3" />
  </svg>
);

export const WatermarkIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <line x1="5" y1="19" x2="19" y2="5" />
    <path d="M8 7l4 4" />
    <path d="M12 13l4 4" />
  </svg>
);

export const PageNumberIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M10 16h4" />
    <path d="M12 13v3" />
    <circle cx="12" cy="8" r="1.5" />
  </svg>
);

export const CheckIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const AlertIcon = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 20 2 20 12 2" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const CloseIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
