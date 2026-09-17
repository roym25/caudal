import React from 'react';

export default function LoadingTable({ columns = 4, rows = 5 }) {
  return (
    <div className="w-full rounded-lg border border-caudal-border bg-caudal-surface overflow-hidden">
      <div className="w-full">
        <div className="flex border-b border-caudal-border bg-caudal-surface-alt p-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`header-${i}`} className="flex-1 px-2">
              <div className="h-4 w-3/4 rounded animate-shimmer bg-[#2E2E2E]"></div>
            </div>
          ))}
        </div>
        <div>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="flex border-b border-caudal-border border-opacity-50 p-4 last:border-0"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 px-2">
                  <div className="h-4 w-full rounded animate-shimmer bg-[#2E2E2E] opacity-70"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
