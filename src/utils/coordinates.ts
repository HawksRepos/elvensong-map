import { MAP_CONFIG } from '../data/markers';

// Convert from image pixels (y from top) to Leaflet coords (y from bottom)
export function toLeaflet(x: number, y: number): [number, number] {
  return [MAP_CONFIG.imageHeight - y, x];
}

// Convert from Leaflet coords back to image pixels
export function fromLeaflet(lat: number, lng: number): { x: number; y: number } {
  return {
    x: Math.round(lng),
    y: Math.round(MAP_CONFIG.imageHeight - lat),
  };
}
