import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { classifyNodeRole, ROLE_COLORS } from '@/lib/nodeClassify';
import { cn } from '@/lib/utils';

export type StepNodeData = {
  label: string;
  step: Record<string, unknown>;
  isFirstNode?: boolean;
};

type StepNodeType = Node<StepNodeData, 'step'>;

export interface HandleInfo {
  id: string;
  label: string;
}

/**
 * Derive output handle descriptors from a step's connection fields.
 * Handle IDs match the sourceHandle values produced by edgeExtractors.
 */
export function buildOutputHandles(step: Record<string, unknown>): HandleInfo[] {
  const handles: HandleInfo[] = [];

  if (typeof step.next === 'string') {
    handles.push({ id: 'next', label: 'Next' });
  }

  if (Array.isArray(step.conditions)) {
    (step.conditions as Array<Record<string, unknown>>).forEach((cond, i) => {
      if (cond.next) {
        const label = String(
          cond.condition_description || cond.condition || `Condition ${i + 1}`
        );
        handles.push({ id: `condition-${i}`, label });
      }
    });
  }

  if (typeof step.timeout_next === 'string') {
    handles.push({ id: 'timeout', label: 'Timeout' });
  }

  if (typeof step.no_match_next === 'string') {
    handles.push({ id: 'no_match', label: 'No Match' });
  }

  if (step.intent_detector_routes && typeof step.intent_detector_routes === 'object') {
    for (const name of Object.keys(
      step.intent_detector_routes as Record<string, string>
    )) {
      handles.push({ id: `intent-${name}`, label: name });
    }
  }

  return handles;
}

/**
 * Custom React Flow node component for call flow steps.
 *
 * Renders a color-coded card with:
 * - Step key as header
 * - Description text
 * - Info badges for key fields
 * - One target handle at top
 * - Dynamic source handles at bottom (matching edge sourceHandle IDs)
 */
export function StepNode({ id, data, selected }: NodeProps<StepNodeType>) {
  const step = data.step;
  const isFirstNode = data.isFirstNode ?? false;
  const role = classifyNodeRole(id, step, isFirstNode);
  const colors = ROLE_COLORS[role];
  const handles = buildOutputHandles(step);

  return (
    <div
      data-testid="step-node"
      className={cn(
        'rounded-lg border-2 shadow-md p-3 min-w-[200px] max-w-[280px] bg-white',
        colors.border,
        colors.bg,
        selected && 'ring-2 ring-blue-400 shadow-lg'
      )}
    >
      {/* Target handle - one per node */}
      <Handle type="target" position={Position.Top} id="target" />

      {/* Header: step key */}
      <div className="font-semibold text-sm truncate">{id}</div>

      {/* Description */}
      {step.description && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {step.description as string}
        </div>
      )}

      {/* Info badges */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {step.wait_for_response && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            wait_for_response
          </span>
        )}
        {step.action && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {step.action as string}
          </span>
        )}
        {step.disposition && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            disposition
          </span>
        )}
        {step.criticalstep && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            critical
          </span>
        )}
      </div>

      {/* Source handles with labels */}
      {handles.length > 0 && (
        <div className="relative mt-2 h-4">
          {handles.map((h, i) => (
            <div key={h.id}>
              <Handle
                type="source"
                position={Position.Bottom}
                id={h.id}
                style={{
                  left: `${((i + 1) / (handles.length + 1)) * 100}%`,
                }}
              />
              <span
                className="absolute text-[9px] text-muted-foreground whitespace-nowrap"
                style={{
                  left: `${((i + 1) / (handles.length + 1)) * 100}%`,
                  transform: 'translateX(-50%)',
                  top: 0,
                }}
              >
                {h.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
