import { useState, useCallback, useMemo, useEffect } from 'react';
import { Marker, MarkerType, MarkerFilters } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useUndoRedo } from './useUndoRedo';
import { DEFAULT_MARKERS } from '../data/markers';

const STORAGE_KEY = 'elvensong-map-markers';

export function useMarkers() {
  // Load saved markers or use defaults
  const [savedMarkers, setSavedMarkers] = useLocalStorage<Marker[]>(STORAGE_KEY, DEFAULT_MARKERS);

  // Undo/redo for markers
  const {
    state: markers,
    setState: setMarkersState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<Marker[]>(savedMarkers);

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

  // Export markers as JSON
  const exportMarkers = useCallback(() => {
    return JSON.stringify(markers, null, 2);
  }, [markers]);

  // Import markers from JSON
  const importMarkers = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json) as Marker[];
      if (Array.isArray(imported)) {
        setMarkersState(imported);
        return { success: true };
      }
      return { success: false, error: 'Invalid format: expected an array' };
    } catch (e) {
      return { success: false, error: 'Invalid JSON' };
    }
  }, [setMarkersState]);

  // Reset to default markers
  const resetMarkers = useCallback(() => {
    setMarkersState(DEFAULT_MARKERS);
  }, [setMarkersState]);

  return {
    markers,
    filteredMarkers,
    filters,
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
  };
}
