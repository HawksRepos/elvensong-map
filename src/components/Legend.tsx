import { MARKER_COLORS, MARKER_TYPE_LABELS, MarkerType } from '../types';

interface LegendProps {
  filters: Record<MarkerType, boolean>;
  onToggle: (type: MarkerType) => void;
  menuOpen?: boolean;
}

const TYPES: MarkerType[] = ['continent', 'city', 'region', 'location', 'town'];

export function Legend({ filters, onToggle, menuOpen = false }: LegendProps) {
  return (
    <div
      className={`fixed bottom-5 bg-dark-panel p-2 sm:p-4 rounded-lg shadow-xl z-[1000] transition-all duration-300 ${
        menuOpen ? 'left-[calc(85vw+12px)] sm:left-[332px]' : 'left-5'
      }`}
    >
      <h4 className="text-accent-blue font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Legend</h4>
      {TYPES.map(type => (
        <button
          key={type}
          onClick={() => onToggle(type)}
          className={`flex items-center gap-1.5 sm:gap-2 w-full py-0.5 sm:py-1 px-1.5 sm:px-2 rounded transition-colors ${
            filters[type] ? 'opacity-100' : 'opacity-40'
          } hover:bg-dark-hover`}
        >
          <span
            className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: MARKER_COLORS[type] }}
          />
          <span className="text-xs sm:text-sm text-gray-200">{MARKER_TYPE_LABELS[type]}s</span>
        </button>
      ))}
    </div>
  );
}
