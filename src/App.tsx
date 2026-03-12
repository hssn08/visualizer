import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '@/components/canvas/FlowCanvas';
import { ImportButton } from '@/components/toolbar/ImportButton';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <ImportButton />
        </div>
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
