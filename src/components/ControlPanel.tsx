import { useState } from 'react';
import { MapPin, Map, Edit, Undo, Redo, Download, Upload, RotateCcw, ExternalLink, RefreshCw, Share2, Check } from 'lucide-react';

interface ControlPanelProps {
  editMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isLoading?: boolean;
  onToggleEditMode: () => void;
  onGoToCurrentLocation: () => void;
  onShowFullMap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onRefresh?: () => void;
  onShare?: () => Promise<boolean>;
}

export function ControlPanel({
  editMode,
  canUndo,
  canRedo,
  isLoading,
  onToggleEditMode,
  onGoToCurrentLocation,
  onShowFullMap,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onReset,
  onRefresh,
  onShare,
}: ControlPanelProps) {
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    if (onShare) {
      const success = await onShare();
      if (success) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    }
  };

  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-1.5 sm:gap-2 z-[1000]">
      {/* Campaign Link */}
      <a
        href="https://publish.obsidian.md/elvensong"
        className="flex items-center gap-2 bg-dark-hover text-accent-blue px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-xl hover:bg-dark-border transition-colors text-sm sm:text-base"
      >
        <ExternalLink size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="hidden sm:inline">Back to Campaign</span>
        <span className="sm:hidden">Campaign</span>
      </a>

      {/* Navigation */}
      <button
        onClick={onGoToCurrentLocation}
        className="flex items-center gap-2 bg-dark-panel text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-xl hover:bg-dark-hover transition-colors text-sm sm:text-base"
      >
        <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="hidden sm:inline">Current Location</span>
        <span className="sm:hidden">Current</span>
      </button>

      <button
        onClick={onShowFullMap}
        className="flex items-center gap-2 bg-dark-panel text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-xl hover:bg-dark-hover transition-colors text-sm sm:text-base"
      >
        <Map size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="hidden sm:inline">Full Map</span>
        <span className="sm:hidden">Full</span>
      </button>

      {/* Share Current View */}
      {onShare && (
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-xl transition-colors text-sm sm:text-base ${
            shareSuccess
              ? 'bg-green-600 text-white'
              : 'bg-dark-panel text-white hover:bg-dark-hover'
          }`}
          title="Copy link to current view"
        >
          {shareSuccess ? (
            <>
              <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Link Copied!</span>
              <span className="sm:hidden">Copied</span>
            </>
          ) : (
            <>
              <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Share View</span>
              <span className="sm:hidden">Share</span>
            </>
          )}
        </button>
      )}

      {/* Refresh from Obsidian */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`flex items-center gap-2 bg-dark-panel text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-xl transition-colors text-sm sm:text-base ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-hover'
          }`}
          title="Sync markers from Obsidian Publish"
        >
          <RefreshCw size={16} className={`sm:w-[18px] sm:h-[18px] ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Sync Markers'}</span>
          <span className="sm:hidden">{isLoading ? '...' : 'Sync'}</span>
        </button>
      )}

      {/* Edit Mode Toggle */}
      <button
        onClick={onToggleEditMode}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-xl transition-colors text-sm sm:text-base ${
          editMode
            ? 'bg-marker-city text-white'
            : 'bg-dark-panel text-white hover:bg-dark-hover'
        }`}
      >
        <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="hidden sm:inline">Edit Mode</span>
        <span className="sm:hidden">Edit</span>
      </button>

      {/* Edit Mode Controls */}
      {editMode && (
        <>
          <div className="flex gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg shadow-xl transition-colors ${
                canUndo
                  ? 'bg-dark-panel text-white hover:bg-dark-hover'
                  : 'bg-dark-panel text-gray-600 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg shadow-xl transition-colors ${
                canRedo
                  ? 'bg-dark-panel text-white hover:bg-dark-hover'
                  : 'bg-dark-panel text-gray-600 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} />
            </button>
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-2 bg-marker-region text-dark-bg px-4 py-2.5 rounded-lg shadow-xl hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            <span>Export Markers</span>
          </button>

          <button
            onClick={onImport}
            className="flex items-center gap-2 bg-dark-panel text-white px-4 py-2.5 rounded-lg shadow-xl hover:bg-dark-hover transition-colors"
          >
            <Upload size={18} />
            <span>Import Markers</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-dark-panel text-marker-city px-4 py-2.5 rounded-lg shadow-xl hover:bg-dark-hover transition-colors"
          >
            <RotateCcw size={18} />
            <span>Reset to Default</span>
          </button>
        </>
      )}
    </div>
  );
}
