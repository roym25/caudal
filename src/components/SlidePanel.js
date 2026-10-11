'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@/components/icons';

export default function SlidePanel({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md md:w-96 h-[100dvh] bg-caudal-surface border-l border-caudal-border shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header with Safe Area Top */}
        <div 
          className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-caudal-border"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
        >
          <h2 className="text-lg font-semibold text-caudal-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-1.5 text-caudal-text-muted hover:text-caudal-text rounded-lg hover:bg-caudal-surface-alt transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close panel"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body with Safe Area Bottom */}
        <div 
          className="flex-1 overflow-y-auto p-5 sm:p-6 touch-scroll"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
