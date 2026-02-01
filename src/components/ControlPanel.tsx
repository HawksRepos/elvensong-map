import { MapPin, Map, Edit, Undo, Redo, Download, Upload, RotateCcw, ExternalLink } from 'lucide-react';

interface ControlPanelProps {
  editMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToggleEditMode: () => void;
  onGoToCurrentLocation: () => void;
  onShowFullMap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}

export function ControlPanel({
  editMode,
  canUndo,
  canRedo,
  onToggleEditMode,
  onGoToCurrentLocation,
  onShowFullMap,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onReset,
}: ControlPanelProps) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[1000]">
      {/* Campaign Link */}
      <a
        href="https://publish.obsidian.md/elvensong"
        className="flex items-center gap-2 bg-dark-hover text-accent-blue px-4 py-2.5 rounded-lg shadow-xl hover:bg-dark-border transition-colors"
      >
        <ExternalLink size={18} />
        <span>Back to Campaign</span>
      </a>

      {/* Navigation */}
      <button
        onClick={onGoToCurrentLocation}
        className="flex items-center gap-2 bg-dark-panel text-white px-4 py-2.5 rounded-lg shadow-xl hover:bg-dark-hover transition-colors"
      >
        <MapPin size={18} />
        <span>Current Location</span>
      </button>

      <button
        onClick={onShowFullMap}
        className="flex items-center gap-2 bg-dark-panel text-white px-4 py-2.5 rounded-lg shadow-xl hover:bg-dark-hover transition-colors"
      >
        <Map size={18} />
        <span>Full Map</span>
      </button>

      {/* Edit Mode Toggle */}
      <button
        onClick={onToggleEditMode}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl transition-colors ${
          editMode
            ? 'bg-marker-city text-white'
            : 'bg-dark-panel text-white hover:bg-dark-hover'
        }`}
      >
        <Edit size={18} />
        <span>Edit Mode</span>
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
