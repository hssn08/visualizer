import { useAppStore } from '@/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StructuredFields } from './StructuredFields';
import { ConnectionEditor } from './ConnectionEditor';
import { JsonFallbackEditor } from './JsonFallbackEditor';
import { X } from 'lucide-react';

interface PropertyPanelProps {
  nodeId: string;
}

export function PropertyPanel({ nodeId }: PropertyPanelProps) {
  const node = useAppStore((s) => s.nodes.find((n) => n.id === nodeId));
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);

  if (!node) return null;

  const step = (node.data as { step: Record<string, unknown> }).step;

  return (
    <div
      className="w-80 border-l bg-background flex flex-col h-full"
      data-testid="property-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-semibold text-sm truncate" data-testid="panel-title">
          {nodeId}
        </h2>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Close panel"
          data-testid="close-panel"
        >
          <X className="size-4" />
        </button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Properties section */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              Properties
            </h3>
            <StructuredFields nodeId={nodeId} step={step} />
          </section>

          <Separator />

          {/* Connections section */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              Connections
            </h3>
            <ConnectionEditor nodeId={nodeId} />
          </section>

          <Separator />

          {/* JSON Editor section */}
          <section>
            <h3 className="text-sm font-semibold mb-1">JSON Editor</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Edit all properties
            </p>
            <JsonFallbackEditor nodeId={nodeId} step={step} />
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
