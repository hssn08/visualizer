import { Download } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { flowToJson } from '@/lib/flowToJson';

export function ExportButton() {
  const { nodes, edges, metadata } = useAppStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      metadata: s.metadata,
    }))
  );

  const handleExport = () => {
    if (!metadata) return;
    const json = flowToJson(nodes, edges, metadata);
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const flowName = metadata.wrapperFields.flow_name as string | undefined;
    const safeName = (flowName ?? 'flow')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    a.download = `${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={!metadata}
    >
      <Download data-icon="inline-start" />
      Export
    </Button>
  );
}
