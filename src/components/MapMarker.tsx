import { Marker as LeafletMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Marker, MARKER_COLORS } from '../types';
import { toLeaflet } from '../utils/coordinates';
import { MAP_CONFIG } from '../data/markers';

interface MapMarkerProps {
  marker: Marker;
  editMode: boolean;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onRightClick?: (id: string) => void;
  onHover?: (marker: Marker, screenPos: { x: number; y: number }) => void;
  onHoverEnd?: () => void;
  onClick?: (marker: Marker) => void;
}

function createIcon(color: string, isCurrentLocation: boolean = false) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<svg width="32" height="48" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" stroke="${isCurrentLocation ? '#FFD700' : '#fff'}" stroke-width="${isCurrentLocation ? '3' : '1.5'}" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.9 12.5 28.5 12.5 28.5S25 23.4 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="#fff" cx="12.5" cy="12.5" r="5"/>
    </svg>`,
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -45],
  });
}

export function MapMarker({
  marker,
  editMode,
  onDragEnd,
  onRightClick,
  onHover,
  onHoverEnd,
  onClick,
}: MapMarkerProps) {
  const isCurrentLocation = marker.name === MAP_CONFIG.currentLocation.name;
  const color = MARKER_COLORS[marker.type];
  const icon = createIcon(color, isCurrentLocation);
  const position = toLeaflet(marker.x, marker.y);

  const handleDragEnd = (e: L.DragEndEvent) => {
    if (onDragEnd) {
      const { lat, lng } = e.target.getLatLng();
      const x = Math.round(lng);
      const y = Math.round(MAP_CONFIG.imageHeight - lat);
      onDragEnd(marker.id, x, y);
    }
  };

  return (
    <LeafletMarker
      position={position}
      icon={icon}
      draggable={editMode}
      eventHandlers={{
        dragend: handleDragEnd,
        contextmenu: (e) => {
          if (editMode && onRightClick) {
            L.DomEvent.stopPropagation(e);
            onRightClick(marker.id);
          }
        },
        mouseover: (e) => {
          if (!editMode && onHover) {
            const containerPoint = e.containerPoint;
            onHover(marker, { x: containerPoint.x, y: containerPoint.y });
          }
        },
        mouseout: () => {
          if (!editMode && onHoverEnd) {
            onHoverEnd();
          }
        },
        click: () => {
          if (!editMode && onClick) {
            onClick(marker);
          }
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -45]}>
        {marker.name}
        {isCurrentLocation && ' (You are here)'}
      </Tooltip>
    </LeafletMarker>
  );
}
