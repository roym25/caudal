import React from 'react';
import { FolderIcon } from '@/components/icons';

export default function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-caudal-surface border border-caudal-border rounded-lg text-center">
      <div className="text-caudal-text-dim mb-4">
        <FolderIcon className="w-16 h-16" />
      </div>
      <h3 className="text-lg font-medium text-caudal-text mb-2">
        {message || 'No data available'}
      </h3>
      {action && (
        <p className="text-sm text-caudal-text-muted">
          {action}
        </p>
      )}
    </div>
  );
}
