import { JsonEditor, githubDarkTheme, githubLightTheme } from 'json-edit-react';
import { useAppStore } from '@/store';
import { useTheme } from '@/components/theme-provider';

interface JsonFallbackEditorProps {
  nodeId: string;
  step: Record<string, unknown>;
}

export function JsonFallbackEditor({ nodeId, step }: JsonFallbackEditorProps) {
  const updateNodeData = useAppStore((s) => s.updateNodeData);
  const { theme } = useTheme();
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
        theme={isDark ? githubDarkTheme : githubLightTheme}
      />
    </div>
  );
}
