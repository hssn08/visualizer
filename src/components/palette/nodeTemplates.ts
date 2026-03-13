import type { Node } from '@xyflow/react';

export interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  icon: string;
  defaultStep: Record<string, unknown>;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'basic',
    label: 'Basic Step',
    description: 'A step with a single "next" connection',
    icon: 'Square',
    defaultStep: {
      description: '',
      text: '',
      next: '',
    },
  },
  {
    type: 'decision',
    label: 'Decision Step',
    description: 'A step with conditional branches',
    icon: 'GitBranch',
    defaultStep: {
      description: '',
      text: '',
      wait_for_response: true,
      conditions: [],
    },
  },
  {
    type: 'terminal',
    label: 'Terminal Step',
    description: 'An endpoint (hangup/transfer)',
    icon: 'CircleStop',
    defaultStep: {
      description: '',
      text: '',
      action: 'hangup',
    },
  },
];

/**
 * Generate a unique node ID with a type prefix.
 * Increments a counter until it finds an ID not present in existingIds.
 */
export function generateNodeId(type: string, existingIds: Set<string>): string {
  let counter = 1;
  let id = `${type}_step_${counter}`;
  while (existingIds.has(id)) {
    counter++;
    id = `${type}_step_${counter}`;
  }
  return id;
}

/**
 * Create a complete React Flow Node from a template, position, and set of existing IDs.
 */
export function createNodeFromTemplate(
  template: NodeTemplate,
  position: { x: number; y: number },
  existingIds: Set<string>
): Node {
  const id = generateNodeId(template.type, existingIds);
  return {
    id,
    type: 'step',
    position,
    data: {
      label: template.label,
      step: { ...template.defaultStep },
      isFirstNode: false,
    },
  };
}
