import { useState, useMemo } from 'react';
import { Menu, X, SortAsc, Layers, Globe } from 'lucide-react';
import { Marker, MARKER_COLORS, MARKER_TYPE_LABELS } from '../types';

type SortMode = 'alphabetical' | 'category' | 'continent';

interface PlacesMenuProps {
  markers: Marker[];
  onSelectPlace: (marker: Marker) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map markers to their continents based on coordinates or quickFacts
function getContinent(marker: Marker): string {
  // Check quickFacts for continent/region info
  if (marker.quickFacts) {
    if (marker.quickFacts['Continent']) return marker.quickFacts['Continent'];
    if (marker.quickFacts['Region']) return marker.quickFacts['Region'];
  }

  // If it's a continent itself, return its name
  if (marker.type === 'continent') return marker.name;

  // Rough coordinate-based continent detection for Auken vs others
  if (marker.x < 4000 && marker.y < 4000) return 'Auken';
  if (marker.x > 5500 && marker.y < 3000) return 'Edaria';
  if (marker.x > 6500) return "Q'Shar";
  if (marker.y > 6000) return 'Ganath';
  if (marker.x > 3500 && marker.x < 5500) return 'Iros';

  return 'Unknown';
}

export function PlacesMenu({ markers, onSelectPlace, isOpen, onOpenChange }: PlacesMenuProps) {
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const sortedMarkers = useMemo(() => {
    const sorted = [...markers];

    if (sortMode === 'alphabetical') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [markers, sortMode]);

  const groupedMarkers = useMemo(() => {
    if (sortMode === 'alphabetical') {
      return null; // Flat list
    }

    const groups: Record<string, Marker[]> = {};

    sortedMarkers.forEach(marker => {
      let key: string;
      if (sortMode === 'category') {
        key = MARKER_TYPE_LABELS[marker.type] + 's';
      } else {
        key = getContinent(marker);
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(marker);
    });

    // Sort markers within each group alphabetically
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [sortedMarkers, sortMode]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const handleSelectPlace = (marker: Marker) => {
    onSelectPlace(marker);
    onOpenChange(false);
  };

  return (
    <>
      {/* Burger Button - styled to match Leaflet zoom controls */}
      <button
        onClick={() => onOpenChange(true)}
        className="fixed top-2.5 left-2.5 w-[36px] h-[36px] bg-[#262626] text-gray-200 rounded-lg shadow-xl z-[1000] hover:bg-[#363636] transition-colors flex items-center justify-center"
        title="Places Menu"
      >
        <Menu size={18} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[1001]"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-[65vw] sm:w-72 md:w-80 bg-dark-panel shadow-2xl z-[1002] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-white">Places</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex gap-1 p-3 border-b border-dark-border">
          <button
            onClick={() => setSortMode('alphabetical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              sortMode === 'alphabetical'
                ? 'bg-accent-blue text-white'
                : 'bg-dark-hover text-gray-300 hover:bg-dark-border'
            }`}
            title="Sort Alphabetically"
          >
            <SortAsc size={14} />
            <span>A-Z</span>
          </button>
          <button
            onClick={() => setSortMode('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              sortMode === 'category'
                ? 'bg-accent-blue text-white'
                : 'bg-dark-hover text-gray-300 hover:bg-dark-border'
            }`}
            title="Sort by Category"
          >
            <Layers size={14} />
            <span>Type</span>
          </button>
          <button
            onClick={() => setSortMode('continent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              sortMode === 'continent'
                ? 'bg-accent-blue text-white'
                : 'bg-dark-hover text-gray-300 hover:bg-dark-border'
            }`}
            title="Sort by Continent"
          >
            <Globe size={14} />
            <span>Region</span>
          </button>
        </div>

        {/* Places List */}
        <div className="overflow-y-auto h-[calc(100%-120px)]">
          {sortMode === 'alphabetical' ? (
            // Flat alphabetical list
            <div className="p-2">
              {sortedMarkers.map(marker => (
                <button
                  key={marker.id}
                  onClick={() => handleSelectPlace(marker)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-dark-hover transition-colors text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: MARKER_COLORS[marker.type] }}
                  />
                  <span className="text-sm text-gray-200 truncate">{marker.name}</span>
                </button>
              ))}
            </div>
          ) : (
            // Grouped list
            <div className="p-2">
              {groupedMarkers && Object.entries(groupedMarkers)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([group, groupMarkers]) => (
                  <div key={group} className="mb-1">
                    <button
                      onClick={() => toggleGroup(group)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-dark-hover transition-colors"
                    >
                      <span className="text-sm font-medium text-accent-blue">{group}</span>
                      <span className="text-xs text-gray-500">{groupMarkers.length}</span>
                    </button>
                    {expandedGroups.has(group) && (
                      <div className="ml-2 border-l border-dark-border">
                        {groupMarkers.map(marker => (
                          <button
                            key={marker.id}
                            onClick={() => handleSelectPlace(marker)}
                            className="flex items-center gap-2 w-full px-3 py-1.5 rounded hover:bg-dark-hover transition-colors text-left"
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: MARKER_COLORS[marker.type] }}
                            />
                            <span className="text-sm text-gray-300 truncate">{marker.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
