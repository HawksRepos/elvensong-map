import { useEffect, useState } from 'react';
import { Marker, MARKER_COLORS, MARKER_TYPE_LABELS } from '../types';

interface HoverPreviewProps {
  marker: Marker;
  position: { x: number; y: number };
  onClose: () => void;
  onClick: () => void;
}

export function HoverPreview({ marker, position, onClose, onClick }: HoverPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const color = MARKER_COLORS[marker.type];
  const typeLabel = MARKER_TYPE_LABELS[marker.type];

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Calculate position to keep preview on screen
  const previewWidth = 320;
  const previewHeight = 280;
  const padding = 20;

  let left = position.x + 20;
  let top = position.y - previewHeight / 2;

  // Adjust if too far right
  if (left + previewWidth > window.innerWidth - padding) {
    left = position.x - previewWidth - 20;
  }

  // Adjust if too far down
  if (top + previewHeight > window.innerHeight - padding) {
    top = window.innerHeight - previewHeight - padding;
  }

  // Adjust if too far up
  if (top < padding) {
    top = padding;
  }

  return (
    <div
      className={`fixed z-[2000] transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ left, top }}
      onMouseLeave={onClose}
    >
      <div className="w-80 bg-dark-panel rounded-lg shadow-2xl border border-dark-border overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-dark-border"
          style={{ borderLeftWidth: 4, borderLeftColor: color }}
        >
          <h3 className="text-lg font-semibold text-white">{marker.name}</h3>
          <span className="text-xs uppercase tracking-wide text-gray-400">
            {typeLabel}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 max-h-48 overflow-y-auto">
          {/* Description */}
          {marker.description && (
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {marker.description}
            </p>
          )}

          {/* Quick Facts */}
          {marker.quickFacts && Object.keys(marker.quickFacts).length > 0 && (
            <div className="space-y-1">
              {Object.entries(marker.quickFacts).map(([key, value]) => (
                <div key={key} className="flex text-xs">
                  <span className="text-gray-500 w-24 flex-shrink-0">{key}:</span>
                  <span className="text-gray-300">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* No description fallback */}
          {!marker.description && (!marker.quickFacts || Object.keys(marker.quickFacts).length === 0) && (
            <p className="text-sm text-gray-500 italic">No preview available</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-dark-bg/50 border-t border-dark-border">
          <button
            onClick={onClick}
            className="w-full px-4 py-2 bg-dark-hover text-white rounded text-sm font-medium hover:bg-dark-border transition-colors"
          >
            View Full Details
          </button>
        </div>
      </div>
    </div>
  );
}
