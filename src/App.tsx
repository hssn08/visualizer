import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '@/components/canvas/FlowCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { PropertyPanel } from '@/components/panel/PropertyPanel';
import { JsonPreviewPanel } from '@/components/preview/JsonPreviewPanel';
import { NodePalette } from '@/components/palette/NodePalette';
import { ThemeProvider } from '@/components/theme-provider';
import { useAppStore } from '@/store';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useDefaultFlow } from '@/hooks/useDefaultFlow';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function App() {
  useDefaultFlow();
  useUndoRedo();
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const jsonPreviewOpen = useAppStore((s) => s.jsonPreviewOpen);
  const paletteOpen = useAppStore((s) => s.paletteOpen);
  const propertyPanelOpen = useAppStore((s) => s.propertyPanelOpen);
  const togglePalette = useAppStore((s) => s.togglePalette);
  const togglePropertyPanel = useAppStore((s) => s.togglePropertyPanel);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Auto-collapse panels on narrow viewports; never auto-expand
  useEffect(() => {
    if (!isDesktop) {
      if (paletteOpen) togglePalette();
      if (propertyPanelOpen) togglePropertyPanel();
    }
  }, [isDesktop]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ReactFlowProvider>
        <div className="h-screen w-screen flex flex-col">
          <Toolbar />
          <div className="flex flex-1 min-h-0">
            {paletteOpen && <NodePalette />}
            <div className="flex-1">
              <FlowCanvas />
            </div>
            {selectedNodeId && propertyPanelOpen && <PropertyPanel nodeId={selectedNodeId} />}
            {jsonPreviewOpen && <JsonPreviewPanel />}
          </div>
        </div>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
