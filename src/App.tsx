import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '@/components/canvas/FlowCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col">
        <Toolbar />
        <div className="flex flex-1 min-h-0">
          {/* Sidebar placeholder - Phase 5 */}
          <div className="flex-1">
            <FlowCanvas />
          </div>
          {/* Property panel placeholder - Phase 4 */}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
