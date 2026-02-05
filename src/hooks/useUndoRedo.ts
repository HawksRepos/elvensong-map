import { useState, useCallback, useEffect, useRef } from 'react';

interface UseUndoRedoResult<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UseUndoRedoResult<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFirstMount = useRef(true);

  // Update history when initialState changes (e.g., when loaded from localStorage)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      // On first mount, if initialState differs from current history[0], reset
      if (JSON.stringify(initialState) !== JSON.stringify(history[0])) {
        setHistory([initialState]);
        setCurrentIndex(0);
      }
    }
  }, [initialState]);

  const state = history[currentIndex] ?? initialState;

  const setState = useCallback((newState: T) => {
    setHistory(prev => {
      // Remove any future states (if we're not at the end)
      const newHistory = prev.slice(0, currentIndex + 1);

      // Add new state
      newHistory.push(newState);

      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }

      return newHistory;
    });

    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, history.length]);

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    clearHistory,
  };
}
