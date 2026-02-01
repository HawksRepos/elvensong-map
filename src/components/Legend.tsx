import { MARKER_COLORS, MARKER_TYPE_LABELS, MarkerType } from '../types';

interface LegendProps {
  filters: Record<MarkerType, boolean>;
  onToggle: (type: MarkerType) => void;
}

const TYPES: MarkerType[] = ['continent', 'city', 'region', 'location', 'town'];

export function Legend({ filters, onToggle }: LegendProps) {
  return (
    <div className="fixed bottom-5 left-5 bg-dark-panel p-4 rounded-lg shadow-xl z-[1000]">
      <h4 className="text-accent-blue font-semibold mb-3">Legend</h4>
      {TYPES.map(type => (
        <button
          key={type}
          onClick={() => onToggle(type)}
          className={`flex items-center gap-2 w-full py-1 px-2 rounded transition-colors ${
            filters[type] ? 'opacity-100' : 'opacity-40'
          } hover:bg-dark-hover`}
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: MARKER_COLORS[type] }}
          />
          <span className="text-sm text-gray-200">{MARKER_TYPE_LABELS[type]}s</span>
        </button>
      ))}
    </div>
  );
}
