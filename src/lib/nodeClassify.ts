/**
 * Classify a call flow step's role and map to visual styling colors.
 *
 * Roles:
 * - start: First node in the flow (green)
 * - terminal: Step with action=hangup or action=transfer (red)
 * - error: Step whose description mentions retry/error/recovery (orange)
 * - normal: All other steps (blue)
 */

export type NodeRole = 'start' | 'terminal' | 'error' | 'normal';

/**
 * Determine the visual role of a node based on its step data.
 *
 * Priority: start > terminal > error > normal
 */
export function classifyNodeRole(
  _nodeId: string,
  step: Record<string, unknown>,
  isFirstNode: boolean
): NodeRole {
  if (isFirstNode) return 'start';

  const action = step.action as string | undefined;
  if (action === 'hangup' || action === 'transfer') return 'terminal';

  const desc = ((step.description as string) || '').toLowerCase();
  if (desc.includes('retry') || desc.includes('error') || desc.includes('recovery'))
    return 'error';

  return 'normal';
}

/** Tailwind classes and hex colors for each node role. */
export const ROLE_COLORS: Record<
  NodeRole,
  { border: string; bg: string; minimap: string }
> = {
  start: { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-950', minimap: '#22c55e' },
  terminal: { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-950', minimap: '#ef4444' },
  error: { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', minimap: '#f97316' },
  normal: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', minimap: '#3b82f6' },
};
