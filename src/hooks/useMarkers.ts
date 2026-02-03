import { useState, useCallback, useMemo, useEffect } from 'react';
import { Marker, MarkerType, MarkerFilters, MapConfig } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useUndoRedo } from './useUndoRedo';
import { DEFAULT_MARKERS, MAP_CONFIG } from '../data/markers';
import { fetchMapData } from '../utils/fetchMapData';

const STORAGE_KEY = 'elvensong-map-markers';
const CONFIG_STORAGE_KEY = 'elvensong-map-config';
const LAST_FETCH_KEY = 'elvensong-map-last-fetch';

// Refresh data if older than 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export function useMarkers() {
  // Load saved markers or use defaults
  const [savedMarkers, setSavedMarkers] = useLocalStorage<Marker[]>(STORAGE_KEY, DEFAULT_MARKERS);
  const [savedConfig, setSavedConfig] = useLocalStorage<MapConfig>(CONFIG_STORAGE_KEY, MAP_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [mapConfig, setMapConfig] = useState<MapConfig>(savedConfig);

  // Undo/redo for markers (moved up so setMarkersState is available)
  const {
    state: markers,
    setState: setMarkersState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<Marker[]>(savedMarkers);

  // Fetch fresh data from Obsidian Publish
  const refreshFromSource = useCallback(async (force = false) => {
    const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
    const now = Date.now();

    // Skip if recently fetched (unless forced)
    if (!force && lastFetch && now - parseInt(lastFetch) < CACHE_DURATION) {
      return;
    }

    setIsLoading(true);
    try {
      const { markers: freshMarkers, config: freshConfig } = await fetchMapData();
      // Update both localStorage AND displayed markers
      setSavedMarkers(freshMarkers);
      setMarkersState(freshMarkers);
      setSavedConfig(freshConfig);
      setMapConfig(freshConfig);
      localStorage.setItem(LAST_FETCH_KEY, now.toString());
      console.log('Map data refreshed from Obsidian Publish');
    } catch (error) {
      console.error('Failed to refresh map data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setSavedMarkers, setSavedConfig, setMarkersState]);

  // Fetch on mount (background refresh)
  useEffect(() => {
    refreshFromSource();
  }, [refreshFromSource]);

  // Filters
  const [filters, setFilters] = useState<MarkerFilters>({
    search: '',
    types: {
      continent: true,
      city: true,
      region: true,
      location: true,
      town: true,
    },
  });

  // Auto-save to localStorage when markers change
  useEffect(() => {
    setSavedMarkers(markers);
  }, [markers, setSavedMarkers]);

  // Filter markers based on search and type filters
  const filteredMarkers = useMemo(() => {
    return markers.filter(marker => {
      // Type filter
      if (!filters.types[marker.type]) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return marker.name.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }, [markers, filters]);

  // Add a new marker
  const addMarker = useCallback((marker: Omit<Marker, 'id'>) => {
    const newMarker: Marker = {
      ...marker,
      id: Date.now().toString(),
    };
    setMarkersState([...markers, newMarker]);
  }, [markers, setMarkersState]);

  // Update an existing marker
  const updateMarker = useCallback((id: string, updates: Partial<Marker>) => {
    setMarkersState(
      markers.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
  }, [markers, setMarkersState]);

  // Delete a marker
  const deleteMarker = useCallback((id: string) => {
    setMarkersState(markers.filter(m => m.id !== id));
  }, [markers, setMarkersState]);

  // Move a marker (update position)
  const moveMarker = useCallback((id: string, x: number, y: number) => {
    updateMarker(id, { x, y });
  }, [updateMarker]);

  // Update search filter
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  // Toggle type filter
  const toggleTypeFilter = useCallback((type: MarkerType) => {
    setFilters(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type],
      },
    }));
  }, []);

  // Set all type filters
  const setAllTypeFilters = useCallback((enabled: boolean) => {
    setFilters(prev => ({
      ...prev,
      types: {
        continent: enabled,
        city: enabled,
        region: enabled,
        location: enabled,
        town: enabled,
      },
    }));
  }, []);

  // Export full map data as JSON (config + markers) for Map-Data.md
  const exportMarkers = useCallback(() => {
    const exportData = {
      config: {
        imageWidth: mapConfig.imageWidth,
        imageHeight: mapConfig.imageHeight,
        currentLocation: mapConfig.currentLocation,
      },
      markers: markers,
    };
    return JSON.stringify(exportData, null, 2);
  }, [markers, mapConfig]);

  // Import markers from JSON (supports full format or markers-only)
  const importMarkers = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json);

      // Handle full format (config + markers)
      if (imported.config && imported.markers && Array.isArray(imported.markers)) {
        setMarkersState(imported.markers);
        if (imported.config.currentLocation) {
          setMapConfig(prev => ({
            ...prev,
            ...imported.config,
          }));
          setSavedConfig(prev => ({
            ...prev,
            ...imported.config,
          }));
        }
        return { success: true };
      }

      // Handle markers-only format (backwards compatibility)
      if (Array.isArray(imported)) {
        setMarkersState(imported);
        return { success: true };
      }

      return { success: false, error: 'Invalid format: expected markers array or {config, markers} object' };
    } catch (e) {
      return { success: false, error: 'Invalid JSON' };
    }
  }, [setMarkersState, setMapConfig, setSavedConfig]);

  // Reset to default markers (refetch from source)
  const resetMarkers = useCallback(async () => {
    await refreshFromSource(true);
  }, [refreshFromSource]);

  return {
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
    setAllTypeFilters,
    undo,
    redo,
    canUndo,
    canRedo,
    exportMarkers,
    importMarkers,
    resetMarkers,
    refreshFromSource,
  };
}
