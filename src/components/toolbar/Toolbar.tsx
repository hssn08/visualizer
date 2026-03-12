import { LayoutGrid, ArrowUpDown, ArrowLeftRight, Maximize2, Braces } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { ImportButton } from './ImportButton';
import { ExportButton } from './ExportButton';

export function Toolbar() {
  const { fitView } = useReactFlow();

  const {
    autoLayout,
    setLayoutDirection,
    layoutDirection,
    metadata,
    toggleJsonPreview,
    jsonPreviewOpen,
  } = useAppStore(
    useShallow((s) => ({
      autoLayout: s.autoLayout,
      setLayoutDirection: s.setLayoutDirection,
      layoutDirection: s.layoutDirection,
      metadata: s.metadata,
      toggleJsonPreview: s.toggleJsonPreview,
      jsonPreviewOpen: s.jsonPreviewOpen,
    }))
  );

  const toggleDirection = () => {
    setLayoutDirection(layoutDirection === 'TB' ? 'LR' : 'TB');
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b">
      <ImportButton />
      <ExportButton />

      {/* Separator */}
      <div className="w-px h-5 bg-border" />

      <Button variant="outline" size="sm" onClick={() => autoLayout()}>
        <LayoutGrid data-icon="inline-start" />
        Layout
      </Button>

      <Button variant="outline" size="sm" onClick={toggleDirection}>
        {layoutDirection === 'TB' ? (
          <ArrowUpDown data-icon="inline-start" />
        ) : (
          <ArrowLeftRight data-icon="inline-start" />
        )}
        {layoutDirection}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => fitView({ padding: 0.2 })}
      >
        <Maximize2 data-icon="inline-start" />
        Fit
      </Button>

      {/* Separator */}
      <div className="w-px h-5 bg-border" />

      <Button
        variant={jsonPreviewOpen ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleJsonPreview()}
        disabled={!metadata}
      >
        <Braces data-icon="inline-start" />
        JSON
      </Button>
    </div>
  );
}
