import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '@/components/canvas/FlowCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { PropertyPanel } from '@/components/panel/PropertyPanel';
import { useAppStore } from '@/store';

export default function App() {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col">
        <Toolbar />
        <div className="flex flex-1 min-h-0">
          {/* Sidebar placeholder - Phase 5 */}
          <div className="flex-1">
            <FlowCanvas />
          </div>
          {selectedNodeId && <PropertyPanel nodeId={selectedNodeId} />}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
