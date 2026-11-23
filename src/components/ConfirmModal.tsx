import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isDanger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  isDestructive,
  isDanger,
  onConfirm,
  onCancel,
}) => {
  const finalConfirmText = confirmText || confirmLabel || 'Confirm';
  const finalCancelText = cancelText || cancelLabel || 'Cancel';
  const finalIsDestructive = isDanger !== undefined ? isDanger : (isDestructive !== undefined ? isDestructive : true);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className={`p-4 text-white flex items-center justify-between ${
          isDestructive ? 'bg-rose-700' : 'bg-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {isDestructive ? (
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            ) : (
              <Trash2 className="w-5 h-5 text-slate-300" />
            )}
            <h3 className="text-sm font-bold tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {finalCancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                finalIsDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {finalConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
