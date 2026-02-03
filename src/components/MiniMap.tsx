import { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';

interface MiniMapProps {
  mapRef: React.MutableRefObject<L.Map | null>;
  imageWidth: number;
  imageHeight: number;
}

interface ViewportBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Size for the mini map - will be responsive via CSS
const MINI_SIZE_DESKTOP = 200;
const MINI_SIZE_MOBILE = 100;

export function MiniMap({ mapRef, imageWidth, imageHeight }: MiniMapProps) {
  const [viewport, setViewport] = useState<ViewportBounds | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [miniSize, setMiniSize] = useState(MINI_SIZE_DESKTOP);
  const miniMapRef = useRef<HTMLDivElement>(null);

  // Responsive size based on window width
  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        setMiniSize(MINI_SIZE_MOBILE);
      } else if (window.innerWidth < 1024) {
        setMiniSize(150);
      } else {
        setMiniSize(MINI_SIZE_DESKTOP);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const updateViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();

    // Convert Leaflet bounds to image coordinates
    // In CRS.Simple, lat = y, lng = x
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    // Clamp to image bounds
    const clampedSouth = Math.max(0, south);
    const clampedNorth = Math.min(imageHeight, north);
    const clampedWest = Math.max(0, west);
    const clampedEast = Math.min(imageWidth, east);

    // Calculate viewport rectangle as percentage of full map
    const left = (clampedWest / imageWidth) * 100;
    const top = ((imageHeight - clampedNorth) / imageHeight) * 100;
    const width = ((clampedEast - clampedWest) / imageWidth) * 100;
    const height = ((clampedNorth - clampedSouth) / imageHeight) * 100;

    setViewport({
      left,
      top,
      width: Math.max(2, width), // Minimum 2% so it's always visible
      height: Math.max(2, height),
    });
  }, [imageWidth, imageHeight, mapRef]);

  // Check for map availability
  useEffect(() => {
    const checkMap = () => {
      if (mapRef.current) {
        setMapReady(true);
        return true;
      }
      return false;
    };

    if (!checkMap()) {
      // Poll for map to be ready
      const interval = setInterval(() => {
        if (checkMap()) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mapRef]);

  // Set up map event listeners once map is ready
  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    // Update on map events
    map.on('moveend', updateViewport);
    map.on('zoomend', updateViewport);
    map.on('move', updateViewport);
    map.on('zoom', updateViewport);

    // Initial update
    updateViewport();

    return () => {
      map.off('moveend', updateViewport);
      map.off('zoomend', updateViewport);
      map.off('move', updateViewport);
      map.off('zoom', updateViewport);
    };
  }, [mapReady, updateViewport, mapRef]);

  // Click on mini map to navigate
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const map = mapRef.current;
    if (!map || !miniMapRef.current) return;

    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to map coordinates
    const mapX = (clickX / miniSize) * imageWidth;
    const mapY = imageHeight - (clickY / miniSize) * imageHeight;

    // Pan to clicked location
    map.setView([mapY, mapX], map.getZoom(), { animate: true });
  };

  return (
    <div
      ref={miniMapRef}
      className="fixed top-5 right-5 bg-dark-panel p-1 rounded-lg shadow-xl z-[1000] overflow-hidden cursor-pointer"
      style={{ width: miniSize + 8, height: miniSize + 8 }}
      onClick={handleMiniMapClick}
      title="Click to navigate"
    >
      {/* Mini map container */}
      <div className="relative w-full h-full overflow-hidden rounded">
        {/* Mini map image */}
        <img
          src="/elvensong-map/World Map.jpg"
          alt="Mini map"
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Viewport indicator */}
        {viewport && (
          <div
            className="absolute border border-red-500 bg-red-500/20 pointer-events-none"
            style={{
              left: `${viewport.left}%`,
              top: `${viewport.top}%`,
              width: `${viewport.width}%`,
              height: `${viewport.height}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}
