'use client';

import React, { useEffect } from 'react';
import { XMarkIcon } from '@/components/icons';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColors = {
    success: 'border-caudal-green',
    error: 'border-caudal-error',
    info: 'border-blue-500'
  };

  const borderColor = borderColors[type] || borderColors.success;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in shadow-xl shadow-black/30">
      <div className={`flex items-center justify-between min-w-[300px] p-4 bg-caudal-surface rounded-r-lg border-l-4 ${borderColor}`}>
        <p className="text-caudal-text font-medium pr-4">{message}</p>
        <button 
          onClick={onClose}
          className="text-caudal-text-dim hover:text-caudal-text transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
