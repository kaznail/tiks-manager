"use client"
import React from 'react';

interface Props { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string; cancelText?: string; danger?: boolean; }

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'تأكيد', cancelText = 'إلغاء', danger }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="text-4xl mb-4">{danger ? '⚠️' : '❓'}</div>
        <h3 className="text-lg font-bold mb-2 text-onSurface">{title}</h3>
        <p className="text-sm text-onSurfaceVariant mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onConfirm} className={`px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 ${danger ? 'bg-error' : 'gradient-bg'}`}>{confirmText}</button>
          <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-sm bg-surfaceContainerHigh text-onSurfaceVariant hover:bg-surfaceContainerLow transition-all">{cancelText}</button>
        </div>
      </div>
    </div>
  );
}
