import React from 'react';

export default function ProgressBar({
  progress = 0,
  statusMessage = "Processing document...",
  subMessage = "Reading bitstreams and optimizing payloads"
}) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full bg-[#14161A] p-6 border border-[#272B33] text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#D94A26] rounded-none animate-pulse" />
          <span className="font-display font-medium text-base text-[#F4F1EA]">
            {statusMessage}
          </span>
        </div>
        <span className="font-mono text-sm font-semibold text-[#D94A26]">
          {clampedProgress}%
        </span>
      </div>

      {/* Mechanical Hatch-Pattern Progress Track */}
      <div className="w-full h-4 bg-[#1B1E24] border border-[#292D37] p-0.5 overflow-hidden">
        <div
          className="h-full bg-[#D94A26] bg-hatch-accent transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-3 text-xs font-mono text-[#787E8B]">
        <span>{subMessage}</span>
        <span>ENGINE RUNNING</span>
      </div>
    </div>
  );
}
