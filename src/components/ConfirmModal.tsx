import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
      <div className="bg-dark-panel rounded-lg shadow-2xl w-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-dark-hover border-b border-dark-border">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle size={20} className="text-marker-city" />}
            <h3 className="text-accent-blue font-semibold">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-300">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-dark-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-dark-hover text-white rounded hover:bg-dark-border transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded font-medium hover:opacity-90 transition-opacity ${
              danger ? 'bg-marker-city text-white' : 'bg-marker-region text-dark-bg'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
