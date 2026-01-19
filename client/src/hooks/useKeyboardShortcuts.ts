import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description: string;
  category: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd/Ctrl+K even in input fields for global search
        if (
          event.key.toLowerCase() === 'k' &&
          (event.ctrlKey || event.metaKey)
        ) {
          // Continue to check shortcuts
        } else {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
        const shiftMatches = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatches = shortcut.altKey === undefined || shortcut.altKey === event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Global shortcuts registry
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrlKey: true,
    callback: () => {}, // Will be overridden by component
    description: 'Open global search',
    category: 'Navigation',
  },
  {
    key: 'n',
    ctrlKey: true,
    callback: () => {},
    description: 'Create new formulation',
    category: 'Actions',
  },
  {
    key: 'b',
    ctrlKey: true,
    callback: () => {},
    description: 'Toggle sidebar',
    category: 'Navigation',
  },
  {
    key: '/',
    ctrlKey: true,
    callback: () => {},
    description: 'Show keyboard shortcuts',
    category: 'Help',
  },
  {
    key: 'z',
    ctrlKey: true,
    callback: () => {},
    description: 'Undo',
    category: 'Editing',
  },
  {
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    callback: () => {},
    description: 'Redo',
    category: 'Editing',
  },
];
