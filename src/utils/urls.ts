import { Marker, MarkerType } from '../types';
import { MAP_CONFIG } from '../data/markers';

const TYPE_FOLDERS: Record<MarkerType, string> = {
  continent: 'Continents',
  city: 'Cities',
  region: 'Regions',
  location: 'Locations',
  town: 'Towns',
};

const TYPE_PREFIXES: Record<MarkerType, string> = {
  continent: 'Continent',
  city: 'City',
  region: 'Region',
  location: 'Location',
  town: 'Town',
};

export function getWikiUrl(marker: Marker): string {
  if (marker.link) {
    return MAP_CONFIG.publishBaseUrl + marker.link;
  }

  const folder = TYPE_FOLDERS[marker.type];
  const prefix = TYPE_PREFIXES[marker.type];
  const encodedName = marker.name.replace(/ /g, '+');

  return `${MAP_CONFIG.publishBaseUrl}${folder}/${prefix}+-+${encodedName}`;
}

export function generateLink(name: string, type: MarkerType): string {
  const folder = TYPE_FOLDERS[type];
  const prefix = TYPE_PREFIXES[type];
  const encodedName = name.replace(/ /g, '+');

  return `${folder}/${prefix}+-+${encodedName}`;
}
