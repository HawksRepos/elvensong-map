export type MarkerType = 'continent' | 'city' | 'region' | 'location' | 'town';

export interface Marker {
  id: string;
  name: string;
  type: MarkerType;
  x: number;
  y: number;
  link?: string;
  visible?: boolean;
  description?: string;
  quickFacts?: Record<string, string>;
}

export interface MarkerFilters {
  search: string;
  types: Record<MarkerType, boolean>;
}

export interface HistoryState {
  markers: Marker[];
  timestamp: number;
}

export interface MapConfig {
  imageWidth: number;
  imageHeight: number;
  publishBaseUrl: string;
  currentLocation: {
    name: string;
    x: number;
    y: number;
    zoom: number;
  };
}

export const MARKER_COLORS: Record<MarkerType, string> = {
  continent: '#3498db',
  city: '#e74c3c',
  region: '#2ecc71',
  location: '#9b59b6',
  town: '#f39c12',
};

export const MARKER_TYPE_LABELS: Record<MarkerType, string> = {
  continent: 'Continent',
  city: 'City',
  region: 'Region',
  location: 'Location',
  town: 'Town',
};
