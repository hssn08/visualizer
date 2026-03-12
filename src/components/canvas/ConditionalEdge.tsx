import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

/**
 * Visual style definitions for each edge type.
 * Solid = no strokeDasharray, Dashed = '8,4', Dotted = '3,3'.
 */
export const EDGE_STYLES: Record<string, { stroke: string; strokeDasharray?: string }> = {
  next:      { stroke: '#64748b' },                         // solid slate
  condition: { stroke: '#3b82f6' },                         // solid blue
  timeout:   { stroke: '#f97316', strokeDasharray: '8,4' }, // dashed orange
  no_match:  { stroke: '#9ca3af', strokeDasharray: '8,4' }, // dashed gray
  intent:    { stroke: '#ef4444', strokeDasharray: '3,3' }, // dotted red
};

/**
 * Tailwind classes for label badges per edge type.
 */
export const LABEL_STYLES: Record<string, string> = {
  next:      'bg-white border-gray-300 text-gray-700',
  condition: 'bg-blue-50 border-blue-200 text-blue-700',
  timeout:   'bg-orange-50 border-orange-200 text-orange-700',
  no_match:  'bg-gray-50 border-gray-200 text-gray-600',
  intent:    'bg-red-50 border-red-200 text-red-700',
};

/**
 * Look up edge style with fallback to 'next'.
 */
export function getEdgeStyle(edgeType: string): { stroke: string; strokeDasharray?: string } {
  return EDGE_STYLES[edgeType] ?? EDGE_STYLES.next;
}

/**
 * Look up label badge classes with fallback to 'next'.
 */
function getLabelStyle(edgeType: string): string {
  return LABEL_STYLES[edgeType] ?? LABEL_STYLES.next;
}

/**
 * Custom edge component that renders 5 distinct visual styles based on
 * edge.data.edgeType and displays label badges via EdgeLabelRenderer.
 */
export function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = (data?.edgeType as string) || 'next';
  const style = getEdgeStyle(edgeType);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: 2 }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`nodrag nopan text-xs px-1.5 py-0.5 rounded shadow-sm border font-medium ${getLabelStyle(edgeType)}`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
