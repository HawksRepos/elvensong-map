import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Marker, MarkerType, MARKER_TYPE_LABELS } from '../types';
import { generateLink } from '../utils/urls';

interface EditPanelProps {
  marker: Marker | null;
  isNew: boolean;
  pendingCoords: { x: number; y: number } | null;
  onSave: (marker: Omit<Marker, 'id'> | Marker) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TYPES: MarkerType[] = ['continent', 'city', 'town', 'region', 'location'];

export function EditPanel({ marker, isNew, pendingCoords, onSave, onDelete, onClose }: EditPanelProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<MarkerType>('location');
  const [link, setLink] = useState('');
  const [autoLink, setAutoLink] = useState(true);

  useEffect(() => {
    if (marker) {
      setName(marker.name);
      setType(marker.type);
      setLink(marker.link || '');
      setAutoLink(!marker.link);
    } else {
      setName('');
      setType('location');
      setLink('');
      setAutoLink(true);
    }
  }, [marker]);

  const coords = marker ? { x: marker.x, y: marker.y } : pendingCoords;

  const handleSave = () => {
    if (!name.trim() || !coords) return;

    const finalLink = autoLink ? generateLink(name, type) : link;

    if (isNew) {
      onSave({
        name: name.trim(),
        type,
        x: coords.x,
        y: coords.y,
        link: finalLink,
      });
    } else if (marker) {
      onSave({
        ...marker,
        name: name.trim(),
        type,
        link: finalLink,
      });
    }
  };

  if (!marker && !pendingCoords) return null;

  return (
    <div className="fixed top-32 right-5 w-80 bg-dark-panel rounded-lg shadow-xl z-[1001] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-dark-hover border-b border-dark-border">
        <h3 className="text-accent-blue font-semibold">
          {isNew ? 'Add New Marker' : 'Edit Marker'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Treston"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MarkerType)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white focus:outline-none focus:border-accent-blue"
          >
            {TYPES.map(t => (
              <option key={t} value={t}>{MARKER_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Wiki Link */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-400">Wiki Link</label>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={autoLink}
                onChange={(e) => setAutoLink(e.target.checked)}
                className="rounded"
              />
              Auto-generate
            </label>
          </div>
          <input
            type="text"
            value={autoLink ? generateLink(name || 'Name', type) : link}
            onChange={(e) => setLink(e.target.value)}
            disabled={autoLink}
            placeholder="e.g., Cities/City+-+Treston"
            className={`w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue ${
              autoLink ? 'opacity-50' : ''
            }`}
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Position</label>
          <div className="px-3 py-2 bg-dark-bg border border-dark-border rounded text-gray-300 font-mono text-sm">
            x: {coords?.x}, y: {coords?.y}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-4 border-t border-dark-border">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 px-4 py-2 bg-marker-region text-dark-bg rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
        {!isNew && marker && (
          <button
            onClick={() => onDelete(marker.id)}
            className="px-4 py-2 bg-marker-city text-white rounded hover:opacity-90 transition-opacity"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 bg-dark-hover text-white rounded hover:bg-dark-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
