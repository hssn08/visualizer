import { JsonEditor } from 'json-edit-react';
import { useAppStore } from '@/store';

interface JsonFallbackEditorProps {
  nodeId: string;
  step: Record<string, unknown>;
}

export function JsonFallbackEditor({ nodeId, step }: JsonFallbackEditorProps) {
  const updateNodeData = useAppStore((s) => s.updateNodeData);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      data-testid="json-fallback-editor"
    >
      <JsonEditor
        data={step}
        setData={(newData) =>
          updateNodeData(nodeId, newData as Record<string, unknown>)
        }
        rootName={nodeId}
        collapse={2}
        minWidth="100%"
        maxWidth="100%"
      />
    </div>
  );
}
