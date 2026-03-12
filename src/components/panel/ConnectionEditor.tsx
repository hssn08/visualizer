import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ConnectionEditorProps {
  nodeId: string;
}

export function ConnectionEditor({ nodeId }: ConnectionEditorProps) {
  const { edges, nodes, updateEdgeTarget } = useAppStore(
    useShallow((s) => ({
      edges: s.edges,
      nodes: s.nodes,
      updateEdgeTarget: s.updateEdgeTarget,
    }))
  );

  const outgoing = edges.filter((e) => e.source === nodeId);
  const nodeIds = nodes.map((n) => n.id);

  if (outgoing.length === 0) {
    return (
      <p className="text-xs text-muted-foreground" data-testid="no-connections">
        No connections
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="connection-editor">
      {outgoing.map((edge) => {
        const edgeType = (edge.data as Record<string, unknown> | undefined)?.edgeType as
          | string
          | undefined;
        const edgeLabel = edge.label as string | undefined;
        const displayLabel = edgeLabel
          ? `${edgeType ?? 'edge'}: ${edgeLabel}`
          : edgeType ?? 'edge';

        return (
          <div key={edge.id} className="space-y-1">
            <Label className="text-xs">{displayLabel}</Label>
            <Select
              value={edge.target}
              onValueChange={(newTarget) => {
                if (newTarget) updateEdgeTarget(edge.id, newTarget);
              }}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nodeIds.map((nid) => (
                  <SelectItem key={nid} value={nid}>
                    {nid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
