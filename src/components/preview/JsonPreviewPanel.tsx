import { X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store';
import { flowToJson } from '@/lib/flowToJson';

export function JsonPreviewPanel() {
  const { nodes, edges, metadata, toggleJsonPreview } = useAppStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      metadata: s.metadata,
      toggleJsonPreview: s.toggleJsonPreview,
    }))
  );

  if (!metadata) return null;

  const json = flowToJson(nodes, edges, metadata);
  const formatted = JSON.stringify(json, null, 2);

  return (
    <div
      data-testid="json-preview-panel"
      className="w-96 border-l flex flex-col min-h-0"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">JSON Preview</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => toggleJsonPreview()}
        >
          <X />
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <pre className="p-3 text-xs font-mono whitespace-pre overflow-x-auto bg-muted/50">
          {formatted}
        </pre>
      </ScrollArea>
    </div>
  );
}
