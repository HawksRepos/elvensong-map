import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { MapContainer, ImageOverlay, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useMarkers } from './hooks/useMarkers';
import { MAP_CONFIG } from './data/markers';
import { toLeaflet, fromLeaflet } from './utils/coordinates';
import { Marker } from './types';

import {
  MapMarker,
  Legend,
  SearchBar,
  ControlPanel,
  EditPanel,
  ImportExportModal,
  ConfirmModal,
  HoverPreview,
} from './components';
import { getWikiUrl } from './utils/urls';

// Map bounds based on image size
const imageBounds: L.LatLngBoundsExpression = [
  [0, 0],
  [MAP_CONFIG.imageHeight, MAP_CONFIG.imageWidth],
];

// Component to handle map events
function MapEvents({
  editMode,
  onMapClick,
  onMapRightClick,
}: {
  editMode: boolean;
  onMapClick: (x: number, y: number) => void;
  onMapRightClick: (x: number, y: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (editMode) {
        const { x, y } = fromLeaflet(e.latlng.lat, e.latlng.lng);
        onMapClick(x, y);
      }
    },
    contextmenu: (e) => {
      if (editMode) {
        const { x, y } = fromLeaflet(e.latlng.lat, e.latlng.lng);
        onMapRightClick(x, y);
      }
    },
  });
  return null;
}

// Component to control map view
function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
}

// Component to handle trackpad gestures (pinch to zoom, scroll to pan)
function TrackpadHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Pinch gesture on trackpad sets ctrlKey to true
      if (e.ctrlKey || e.metaKey) {
        // Pinch to zoom
        const zoom = map.getZoom();
        const delta = -e.deltaY * 0.01;
        map.setZoom(zoom + delta, { animate: false });
      } else {
        // Two-finger scroll to pan
        map.panBy([e.deltaX, e.deltaY], { animate: false });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [map]);

  return null;
}

export default function App() {
  const mapRef = useRef<L.Map | null>(null);

  // Markers state and actions
  const {
    markers,
    filteredMarkers,
    filters,
    addMarker,
    updateMarker,
    deleteMarker,
    moveMarker,
    setSearch,
    toggleTypeFilter,
    undo,
    redo,
    canUndo,
    canRedo,
    exportMarkers,
    importMarkers,
    resetMarkers,
  } = useMarkers();

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [isNewMarker, setIsNewMarker] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);
  const [modalMode, setModalMode] = useState<'import' | 'export' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Hover preview state
  const [hoveredMarker, setHoveredMarker] = useState<Marker | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get initial location from URL params or default to current location
  const { initialCenter, initialZoom } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const locationName = params.get('location');

    if (locationName) {
      // Find marker by name (case-insensitive)
      const targetMarker = markers.find(
        m => m.name.toLowerCase() === locationName.toLowerCase()
      );
      if (targetMarker) {
        return {
          initialCenter: toLeaflet(targetMarker.x, targetMarker.y),
          initialZoom: 0, // Zoom in a bit more for specific locations
        };
      }
    }

    // Default to current location
    return {
      initialCenter: toLeaflet(MAP_CONFIG.currentLocation.x, MAP_CONFIG.currentLocation.y),
      initialZoom: MAP_CONFIG.currentLocation.zoom,
    };
  }, [markers]);

  // Navigation functions
  const goToCurrentLocation = useCallback(() => {
    if (mapRef.current) {
      const pos = toLeaflet(MAP_CONFIG.currentLocation.x, MAP_CONFIG.currentLocation.y);
      mapRef.current.setView(pos, MAP_CONFIG.currentLocation.zoom, { animate: true });
    }
  }, []);

  const showFullMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(imageBounds, { animate: true, padding: [20, 20] });
    }
  }, []);

  // Edit mode handlers
  const handleMapClick = useCallback((x: number, y: number) => {
    // Just show coordinates, don't open panel
    console.log(`Clicked at x: ${x}, y: ${y}`);
  }, []);

  const handleMapRightClick = useCallback((x: number, y: number) => {
    setPendingCoords({ x, y });
    setEditingMarker(null);
    setIsNewMarker(true);
  }, []);

  const handleMarkerRightClick = useCallback((id: string) => {
    const marker = markers.find((m) => m.id === id);
    if (marker) {
      setEditingMarker(marker);
      setIsNewMarker(false);
      setPendingCoords(null);
    }
  }, [markers]);

  const handleMarkerDragEnd = useCallback((id: string, x: number, y: number) => {
    moveMarker(id, x, y);
  }, [moveMarker]);

  const handleSaveMarker = useCallback((data: Omit<Marker, 'id'> | Marker) => {
    if ('id' in data) {
      updateMarker(data.id, data);
    } else {
      addMarker(data);
    }
    setEditingMarker(null);
    setIsNewMarker(false);
    setPendingCoords(null);
  }, [addMarker, updateMarker]);

  const handleDeleteMarker = useCallback((id: string) => {
    setShowDeleteConfirm(id);
  }, []);

  const confirmDeleteMarker = useCallback(() => {
    if (showDeleteConfirm) {
      deleteMarker(showDeleteConfirm);
      setShowDeleteConfirm(null);
      setEditingMarker(null);
    }
  }, [showDeleteConfirm, deleteMarker]);

  const handleCloseEditPanel = useCallback(() => {
    setEditingMarker(null);
    setIsNewMarker(false);
    setPendingCoords(null);
  }, []);

  // Hover preview handlers
  const handleMarkerHover = useCallback((marker: Marker, screenPos: { x: number; y: number }) => {
    // Cancel any pending close
    if (hoverCloseTimeoutRef.current) {
      clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
    setHoveredMarker(marker);
    setHoverPosition(screenPos);
  }, []);

  const handleMarkerHoverEnd = useCallback(() => {
    // Delay closing to allow mouse to move to preview
    hoverCloseTimeoutRef.current = setTimeout(() => {
      setHoveredMarker(null);
      setHoverPosition(null);
    }, 150);
  }, []);

  const handlePreviewMouseEnter = useCallback(() => {
    // Cancel close when mouse enters preview
    if (hoverCloseTimeoutRef.current) {
      clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
  }, []);

  const handlePreviewClose = useCallback(() => {
    setHoveredMarker(null);
    setHoverPosition(null);
  }, []);

  // Navigate to wiki page (same tab)
  const handleMarkerClick = useCallback((marker: Marker) => {
    const url = getWikiUrl(marker);
    window.location.href = url;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        if (editingMarker || pendingCoords) {
          handleCloseEditPanel();
        } else if (editMode) {
          setEditMode(false);
        }
      }

      if (e.key === 'e' || e.key === 'E') {
        setEditMode((prev) => !prev);
      }

      if (e.key === 'r' || e.key === 'R') {
        showFullMap();
      }

      if (e.key === 'c' || e.key === 'C') {
        goToCurrentLocation();
      }

      // Undo/Redo with Ctrl/Cmd
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, editingMarker, pendingCoords, handleCloseEditPanel, showFullMap, goToCurrentLocation, undo, redo]);

  return (
    <div className="w-screen h-screen bg-dark-bg">
      {/* Map */}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        crs={L.CRS.Simple}
        minZoom={-3}
        maxZoom={2}
        zoomSnap={0.1}
        zoomDelta={0.25}
        scrollWheelZoom={false}
        inertia={true}
        inertiaDeceleration={2000}
        bounceAtZoomLimits={false}
        maxBounds={[[-500, -500], [MAP_CONFIG.imageHeight + 500, MAP_CONFIG.imageWidth + 500]]}
        maxBoundsViscosity={0.8}
        className="w-full h-full"
      >
        <MapController mapRef={mapRef} />
        <TrackpadHandler />
        <MapEvents
          editMode={editMode}
          onMapClick={handleMapClick}
          onMapRightClick={handleMapRightClick}
        />
        <ImageOverlay url="/elvensong-map/World Map.jpg" bounds={imageBounds} />

        {/* Markers */}
        {filteredMarkers.map((marker) => (
          <MapMarker
            key={marker.id}
            marker={marker}
            editMode={editMode}
            onDragEnd={handleMarkerDragEnd}
            onRightClick={handleMarkerRightClick}
            onHover={handleMarkerHover}
            onHoverEnd={handleMarkerHoverEnd}
            onClick={handleMarkerClick}
          />
        ))}
      </MapContainer>

      {/* Search Bar */}
      <SearchBar
        value={filters.search}
        onChange={setSearch}
        resultCount={filteredMarkers.length}
        totalCount={markers.length}
      />

      {/* Legend */}
      <Legend filters={filters.types} onToggle={toggleTypeFilter} />

      {/* Control Panel */}
      <ControlPanel
        editMode={editMode}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleEditMode={() => setEditMode((prev) => !prev)}
        onGoToCurrentLocation={goToCurrentLocation}
        onShowFullMap={showFullMap}
        onUndo={undo}
        onRedo={redo}
        onExport={() => setModalMode('export')}
        onImport={() => setModalMode('import')}
        onReset={() => setShowResetConfirm(true)}
      />

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-marker-city text-white px-4 py-2 rounded-full shadow-lg z-[1000] text-sm font-medium">
          EDIT MODE - Drag markers or right-click to add/edit
        </div>
      )}

      {/* Current Location Banner */}
      {!editMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-marker-region text-dark-bg px-4 py-2 rounded-full shadow-lg z-[1000] text-sm font-medium">
          Current: {MAP_CONFIG.currentLocation.name}
        </div>
      )}

      {/* Edit Panel */}
      {editMode && (editingMarker || pendingCoords) && (
        <EditPanel
          marker={editingMarker}
          isNew={isNewMarker}
          pendingCoords={pendingCoords}
          onSave={handleSaveMarker}
          onDelete={handleDeleteMarker}
          onClose={handleCloseEditPanel}
        />
      )}

      {/* Import/Export Modal */}
      {modalMode && (
        <ImportExportModal
          mode={modalMode}
          exportData={modalMode === 'export' ? exportMarkers() : undefined}
          onImport={importMarkers}
          onClose={() => setModalMode(null)}
        />
      )}

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <ConfirmModal
          title="Reset Markers"
          message="Are you sure you want to reset all markers to their default positions? This cannot be undone."
          confirmLabel="Reset"
          onConfirm={() => {
            resetMarkers();
            setShowResetConfirm(false);
          }}
          onCancel={() => setShowResetConfirm(false)}
          danger
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Marker"
          message={`Are you sure you want to delete "${markers.find((m) => m.id === showDeleteConfirm)?.name}"?`}
          confirmLabel="Delete"
          onConfirm={confirmDeleteMarker}
          onCancel={() => setShowDeleteConfirm(null)}
          danger
        />
      )}

      {/* Hover Preview */}
      {!editMode && hoveredMarker && hoverPosition && (
        <HoverPreview
          marker={hoveredMarker}
          position={hoverPosition}
          onClose={handlePreviewClose}
          onClick={() => handleMarkerClick(hoveredMarker)}
          onMouseEnter={handlePreviewMouseEnter}
        />
      )}
    </div>
  );
}
