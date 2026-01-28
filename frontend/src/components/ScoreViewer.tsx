'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ScoreViewerProps {
  open: boolean;
  file: string;
  title: string;
  onClose: () => void;
}

export default function ScoreViewer({ open, file, title, onClose }: ScoreViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="w-[90%] max-w-4xl p-0 rounded-lg shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-0">
        {open && file && (
          <iframe
            src={file}
            className="w-full h-[500px] border-0"
            title={title}
          />
        )}
      </div>
    </dialog>
  );
}
