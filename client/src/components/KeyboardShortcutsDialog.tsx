import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Group shortcuts by category
  const groupedShortcuts = KEYBOARD_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof KEYBOARD_SHORTCUTS>);

  const formatShortcut = (shortcut: typeof KEYBOARD_SHORTCUTS[0]) => {
    const keys: string[] = [];
    
    if (shortcut.ctrlKey) keys.push(modKey);
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push(isMac ? '⌥' : 'Alt');
    
    // Format the main key
    let mainKey = shortcut.key.toUpperCase();
    if (mainKey === '/') mainKey = '/';
    
    keys.push(mainKey);
    
    return keys;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card/70 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {formatShortcut(shortcut).map((key, keyIndex) => (
                        <Badge
                          key={keyIndex}
                          variant="outline"
                          className="px-2 py-1 text-xs font-mono bg-background"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Press <Badge variant="outline" className="mx-1 text-xs font-mono">{modKey}</Badge> + 
            <Badge variant="outline" className="mx-1 text-xs font-mono">/</Badge> anytime to view this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
