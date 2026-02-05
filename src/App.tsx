import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { MapContainer, ImageOverlay, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useMarkers } from './hooks/useMarkers';
import { toLeaflet, fromLeaflet } from './utils/coordinates';
import { Marker, MarkerType } from './types';

// Zoom thresholds for marker visibility
// At zoom -3 to -1.5: only continents
// At zoom -1.5 to -0.5: continents + regions
// At zoom -0.5 to 0.5: continents + regions + cities
// At zoom 0.5+: everything
const ZOOM_THRESHOLDS: Record<MarkerType, number> = {
  continent: -3,    // Always visible (at any zoom)
  region: -1.5,     // Visible when zoomed in past -1.5
  city: -0.5,       // Visible when zoomed in past -0.5
  town: 0.5,        // Visible when zoomed in past 0.5
  location: 0.5,    // Visible when zoomed in past 0.5
};

import {
  MapMarker,
  Legend,
  SearchBar,
  ControlPanel,
  EditPanel,
  ImportExportModal,
  ConfirmModal,
  HoverPreview,
  PlacesMenu,
  MiniMap,
} from './components';
import { getWikiUrl } from './utils/urls';
import { generateShareUrl, copyToClipboard, parseShareUrl } from './utils/shareUrl';
import { fromLeaflet as coordsFromLeaflet } from './utils/coordinates';

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

// Component to track zoom level changes
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    // Set initial zoom
    onZoomChange(map.getZoom());

    // Listen for zoom changes
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    map.on('zoom', handleZoom);

    return () => {
      map.off('zoomend', handleZoom);
      map.off('zoom', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

// Component to handle all trackpad gestures (taking full control from Leaflet)
function TrackpadGestureHandler() {
  const map = useMap();
  const zoomAccumulator = useRef(0);
  const lastMousePoint = useRef<L.Point | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Disable Leaflet's native scroll wheel zoom - we'll handle it ourselves
    map.scrollWheelZoom.disable();

    const container = map.getContainer();

    const applySmoothedZoom = () => {
      if (Math.abs(zoomAccumulator.current) > 0.001 && lastMousePoint.current) {
        const currentZoom = map.getZoom();
        // Apply 70% of accumulated zoom (smoothing)
        const zoomToApply = zoomAccumulator.current * 0.7;
        zoomAccumulator.current -= zoomToApply;

        const newZoom = Math.max(-3, Math.min(2, currentZoom + zoomToApply));
        map.setZoomAround(lastMousePoint.current, newZoom, { animate: false });

        // Continue smoothing if there's remaining zoom
        if (Math.abs(zoomAccumulator.current) > 0.001) {
          rafId.current = requestAnimationFrame(applySmoothedZoom);
        } else {
          zoomAccumulator.current = 0;
          rafId.current = null;
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Pinch gesture (ctrlKey) = zoom
      if (e.ctrlKey || e.metaKey) {
        // Accumulate zoom delta
        zoomAccumulator.current += -e.deltaY * 0.02;

        // Store mouse position for zoom centering
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        lastMousePoint.current = L.point(mouseX, mouseY);

        // Start smoothed zoom if not already running
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(applySmoothedZoom);
        }

        // Also pan if there's horizontal movement during pinch
        if (Math.abs(e.deltaX) > 0.5) {
          map.panBy([e.deltaX * 0.5, 0], { animate: false });
        }
      } else {
        // Two-finger scroll = pan
        map.panBy([e.deltaX, e.deltaY], { animate: false });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      map.scrollWheelZoom.enable();
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
    mapConfig,
    isLoading,
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
    refreshFromSource,
  } = useMarkers();

  // Map bounds based on image size (computed from config)
  const imageBounds: L.LatLngBoundsExpression = useMemo(() => [
    [0, 0],
    [mapConfig.imageHeight, mapConfig.imageWidth],
  ], [mapConfig.imageHeight, mapConfig.imageWidth]);

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [isNewMarker, setIsNewMarker] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);
  const [modalMode, setModalMode] = useState<'import' | 'export' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [placesMenuOpen, setPlacesMenuOpen] = useState(false);

  // Hover preview state
  const [hoveredMarker, setHoveredMarker] = useState<Marker | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get initial location from URL params or default to current location
  const { initialCenter, initialZoom } = useMemo(() => {
    // Check for share URL params first (x, y, z coordinates)
    const shareParams = parseShareUrl();
    if (shareParams) {
      return {
        initialCenter: toLeaflet(shareParams.x, shareParams.y),
        initialZoom: shareParams.zoom,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const locationName = params.get('location');

    if (locationName && markers && Array.isArray(markers)) {
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
      initialCenter: toLeaflet(mapConfig.currentLocation.x, mapConfig.currentLocation.y),
      initialZoom: mapConfig.currentLocation.zoom,
    };
  }, [markers, mapConfig]);

  // Zoom level for marker visibility
  const [currentZoom, setCurrentZoom] = useState(initialZoom);

  // Filter markers based on zoom level
  const zoomFilteredMarkers = useMemo(() => {
    if (!filteredMarkers || !Array.isArray(filteredMarkers)) {
      return [];
    }
    return filteredMarkers.filter(marker => {
      const threshold = ZOOM_THRESHOLDS[marker.type];
      return currentZoom >= threshold;
    });
  }, [filteredMarkers, currentZoom]);

  // Pre-search position for restoring after clearing search
  const preSearchPositionRef = useRef<{ center: L.LatLng; zoom: number } | null>(null);
  const wasSearchingRef = useRef(false);

  // Zoom to single search result, restore position when clearing
  useEffect(() => {
    if (!mapRef.current) return;

    const isSearching = filters.search.length > 0;
    const wasSearching = wasSearchingRef.current;

    // Starting a new search - save current position
    if (isSearching && !wasSearching) {
      preSearchPositionRef.current = {
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom(),
      };
    }

    // If searching and exactly one result, zoom to it
    if (isSearching && zoomFilteredMarkers.length === 1) {
      const marker = zoomFilteredMarkers[0];
      const pos = toLeaflet(marker.x, marker.y);
      // Zoom to a level that shows the marker type
      const targetZoom = Math.max(ZOOM_THRESHOLDS[marker.type] + 0.5, 0);
      mapRef.current.setView(pos, targetZoom, { animate: true });
    }

    // Clearing search - restore previous position
    if (!isSearching && wasSearching && preSearchPositionRef.current) {
      mapRef.current.setView(
        preSearchPositionRef.current.center,
        preSearchPositionRef.current.zoom,
        { animate: true }
      );
      preSearchPositionRef.current = null;
    }

    wasSearchingRef.current = isSearching;
  }, [filters.search, zoomFilteredMarkers]);

  // Navigate to a specific marker (from places menu)
  const goToMarker = useCallback((marker: Marker) => {
    if (mapRef.current) {
      const pos = toLeaflet(marker.x, marker.y);
      const targetZoom = Math.max(ZOOM_THRESHOLDS[marker.type] + 0.5, 0);
      mapRef.current.setView(pos, targetZoom, { animate: true });
    }
  }, []);

  // Navigation functions
  const goToCurrentLocation = useCallback(() => {
    if (mapRef.current) {
      const pos = toLeaflet(mapConfig.currentLocation.x, mapConfig.currentLocation.y);
      mapRef.current.setView(pos, mapConfig.currentLocation.zoom, { animate: true });
    }
  }, [mapConfig]);

  const showFullMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(imageBounds, { animate: true, padding: [20, 20] });
    }
  }, [imageBounds]);

  // Share current view
  const handleShare = useCallback(async (): Promise<boolean> => {
    if (!mapRef.current) return false;

    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    // Convert Leaflet coords back to image coords
    const { x, y } = coordsFromLeaflet(center.lat, center.lng);

    const shareUrl = generateShareUrl({
      x: Math.round(x),
      y: Math.round(y),
      zoom,
    });
    return await copyToClipboard(shareUrl);
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
    if (!markers) return;
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
        zoomSnap={0.01}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={6}
        scrollWheelZoom={true}
        inertia={false}
        bounceAtZoomLimits={false}
        maxBounds={[[-500, -500], [mapConfig.imageHeight + 500, mapConfig.imageWidth + 500]]}
        maxBoundsViscosity={0.5}
        className="w-full h-full"
      >
        <MapController mapRef={mapRef} />
        <TrackpadGestureHandler />
        <ZoomTracker onZoomChange={setCurrentZoom} />
        <MapEvents
          editMode={editMode}
          onMapClick={handleMapClick}
          onMapRightClick={handleMapRightClick}
        />
        <ImageOverlay url="/elvensong-map/World Map.jpg" bounds={imageBounds} />

        {/* Markers - filtered by zoom level */}
        {zoomFilteredMarkers.map((marker) => (
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

      {/* Places Menu */}
      <PlacesMenu
        markers={markers}
        onSelectPlace={goToMarker}
        isOpen={placesMenuOpen}
        onOpenChange={setPlacesMenuOpen}
      />

      {/* Mini Map */}
      <MiniMap
        mapRef={mapRef}
        imageWidth={mapConfig.imageWidth}
        imageHeight={mapConfig.imageHeight}
      />

      {/* Search Bar */}
      <SearchBar
        value={filters.search}
        onChange={setSearch}
        resultCount={zoomFilteredMarkers.length}
        totalCount={markers?.length ?? 0}
      />

      {/* Legend */}
      <Legend filters={filters.types} onToggle={toggleTypeFilter} menuOpen={placesMenuOpen} />

      {/* Control Panel */}
      <ControlPanel
        editMode={editMode}
        canUndo={canUndo}
        canRedo={canRedo}
        isLoading={isLoading}
        onToggleEditMode={() => setEditMode((prev) => !prev)}
        onGoToCurrentLocation={goToCurrentLocation}
        onShowFullMap={showFullMap}
        onUndo={undo}
        onRedo={redo}
        onExport={() => setModalMode('export')}
        onImport={() => setModalMode('import')}
        onReset={() => setShowResetConfirm(true)}
        onRefresh={() => refreshFromSource(true)}
        onShare={handleShare}
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
          Current: {mapConfig.currentLocation.name}
          {isLoading && <span className="ml-2 text-xs opacity-70">(syncing...)</span>}
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
          message={`Are you sure you want to delete "${markers?.find((m) => m.id === showDeleteConfirm)?.name ?? 'this marker'}"?`}
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
