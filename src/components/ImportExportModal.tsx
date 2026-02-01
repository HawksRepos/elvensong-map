import { useState } from 'react';
import { X, Copy, Check, AlertCircle } from 'lucide-react';

interface ImportExportModalProps {
  mode: 'import' | 'export';
  exportData?: string;
  onImport: (data: string) => { success: boolean; error?: string };
  onClose: () => void;
}

export function ImportExportModal({ mode, exportData, onImport, onClose }: ImportExportModalProps) {
  const [importData, setImportData] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (exportData) {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImport = () => {
    const result = onImport(importData);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Import failed');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportData(content);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
      <div className="bg-dark-panel rounded-lg shadow-2xl w-[500px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-dark-hover border-b border-dark-border">
          <h3 className="text-accent-blue font-semibold text-lg">
            {mode === 'export' ? 'Export Markers' : 'Import Markers'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {mode === 'export' ? (
            <>
              <p className="text-gray-400 text-sm mb-3">
                Copy this JSON data to save your markers. You can paste it back later to restore them.
              </p>
              <div className="relative">
                <textarea
                  value={exportData}
                  readOnly
                  className="w-full h-64 px-3 py-2 bg-dark-bg border border-dark-border rounded text-white font-mono text-sm focus:outline-none resize-none"
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-dark-hover text-white rounded text-sm hover:bg-dark-border transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-3">
                Paste previously exported JSON data or upload a file to restore markers.
              </p>

              {/* File Upload */}
              <div className="mb-3">
                <label className="flex items-center justify-center w-full px-4 py-3 bg-dark-bg border-2 border-dashed border-dark-border rounded cursor-pointer hover:border-accent-blue transition-colors">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-gray-400">Click to upload JSON file</span>
                </label>
              </div>

              <div className="text-center text-gray-500 text-sm mb-3">or paste JSON below</div>

              <textarea
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setError(null);
                }}
                placeholder="Paste JSON here..."
                className="w-full h-48 px-3 py-2 bg-dark-bg border border-dark-border rounded text-white font-mono text-sm focus:outline-none focus:border-accent-blue resize-none"
              />

              {error && (
                <div className="flex items-center gap-2 mt-2 text-marker-city text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-dark-border">
          {mode === 'import' && (
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="px-4 py-2 bg-marker-region text-dark-bg rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-hover text-white rounded hover:bg-dark-border transition-colors"
          >
            {mode === 'export' ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
