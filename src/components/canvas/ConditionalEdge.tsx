import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { useTheme } from '@/components/theme-provider';

/**
 * Visual style definitions for each edge type (light mode).
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
 * Dark mode edge styles with brighter colors for contrast on dark backgrounds.
 */
export const EDGE_STYLES_DARK: Record<string, { stroke: string; strokeDasharray?: string }> = {
  next:      { stroke: '#94a3b8' },                         // solid light slate
  condition: { stroke: '#60a5fa' },                         // solid light blue
  timeout:   { stroke: '#fb923c', strokeDasharray: '8,4' }, // dashed light orange
  no_match:  { stroke: '#6b7280', strokeDasharray: '8,4' }, // dashed gray
  intent:    { stroke: '#f87171', strokeDasharray: '3,3' }, // dotted light red
};

/**
 * Tailwind classes for label badges per edge type (with dark: variants).
 */
export const LABEL_STYLES: Record<string, string> = {
  next:      'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200',
  condition: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200',
  timeout:   'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-200',
  no_match:  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300',
  intent:    'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200',
};

/**
 * Look up edge style with fallback to 'next'.
 * When isDark is true, uses brighter colors for dark backgrounds.
 */
export function getEdgeStyle(edgeType: string, isDark = false): { stroke: string; strokeDasharray?: string } {
  const styles = isDark ? EDGE_STYLES_DARK : EDGE_STYLES;
  return styles[edgeType] ?? styles.next;
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
 * Theme-aware: uses brighter stroke colors in dark mode.
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
  const { theme } = useTheme();
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = (data?.edgeType as string) || 'next';
  const style = getEdgeStyle(edgeType, isDark);

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
