import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '@/components/canvas/FlowCanvas';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex">
        {/* Sidebar placeholder - Phase 5 */}
        <div className="flex-1">
          <FlowCanvas />
        </div>
        {/* Property panel placeholder - Phase 4 */}
      </div>
    </ReactFlowProvider>
  );
}
