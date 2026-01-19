import { useState, useCallback } from 'react';

export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UndoRedoActions<T> {
  set: (newPresent: T, checkpoint?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newPresent: T) => void;
}

export function useUndoRedo<T>(initialPresent: T): [T, UndoRedoActions<T>] {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback(
    (newPresent: T, checkpoint: boolean = true) => {
      if (checkpoint) {
        setState((currentState) => ({
          past: [...currentState.past, currentState.present],
          present: newPresent,
          future: [],
        }));
      } else {
        // Update without creating history entry (for intermediate states)
        setState((currentState) => ({
          ...currentState,
          present: newPresent,
        }));
      }
    },
    []
  );

  const undo = useCallback(() => {
    setState((currentState) => {
      if (currentState.past.length === 0) {
        return currentState;
      }

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      if (currentState.future.length === 0) {
        return currentState;
      }

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return [
    state.present,
    {
      set,
      undo,
      redo,
      canUndo,
      canRedo,
      reset,
    },
  ];
}
