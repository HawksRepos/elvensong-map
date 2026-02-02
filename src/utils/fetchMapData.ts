import { Marker, MapConfig } from '../types';
import { DEFAULT_MARKERS, MAP_CONFIG } from '../data/markers';

const OBSIDIAN_PUBLISH_URL = 'https://publish-01.obsidian.md/access/889558bf3470938e471de91ad951317b/Map-Data.md';

interface MapData {
  config: {
    imageWidth: number;
    imageHeight: number;
    currentLocation: {
      name: string;
      x: number;
      y: number;
      zoom: number;
    };
  };
  markers: Marker[];
}

/**
 * Fetches map data from Obsidian Publish.
 * Falls back to static data if fetch fails.
 */
export async function fetchMapData(): Promise<{ markers: Marker[]; config: MapConfig }> {
  try {
    const response = await fetch(OBSIDIAN_PUBLISH_URL, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('Failed to fetch map data from Obsidian Publish, using static fallback');
      return { markers: DEFAULT_MARKERS, config: MAP_CONFIG };
    }

    const markdown = await response.text();

    // Extract JSON from markdown code block
    const jsonMatch = markdown.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch || !jsonMatch[1]) {
      console.warn('Could not find JSON in Map-Data.md, using static fallback');
      return { markers: DEFAULT_MARKERS, config: MAP_CONFIG };
    }

    const data: MapData = JSON.parse(jsonMatch[1]);

    const config: MapConfig = {
      imageWidth: data.config.imageWidth,
      imageHeight: data.config.imageHeight,
      publishBaseUrl: MAP_CONFIG.publishBaseUrl, // Keep static publish URL
      currentLocation: data.config.currentLocation,
    };

    return { markers: data.markers, config };
  } catch (error) {
    console.error('Error fetching map data:', error);
    return { markers: DEFAULT_MARKERS, config: MAP_CONFIG };
  }
}
