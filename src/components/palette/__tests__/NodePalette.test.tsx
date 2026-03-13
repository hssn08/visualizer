import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  NODE_TEMPLATES,
  generateNodeId,
  createNodeFromTemplate,
} from '../nodeTemplates';
import { NodePalette } from '../NodePalette';

describe('NODE_TEMPLATES', () => {
  it('has exactly 3 entries with types basic, decision, terminal', () => {
    expect(NODE_TEMPLATES).toHaveLength(3);
    const types = NODE_TEMPLATES.map((t) => t.type);
    expect(types).toEqual(['basic', 'decision', 'terminal']);
  });

  it('each template has label, description, icon, and defaultStep fields', () => {
    for (const template of NODE_TEMPLATES) {
      expect(template.label).toBeDefined();
      expect(typeof template.label).toBe('string');
      expect(template.description).toBeDefined();
      expect(typeof template.description).toBe('string');
      expect(template.icon).toBeDefined();
      expect(typeof template.icon).toBe('string');
      expect(template.defaultStep).toBeDefined();
      expect(typeof template.defaultStep).toBe('object');
    }
  });

  it('Basic template defaultStep has next empty string', () => {
    const basic = NODE_TEMPLATES.find((t) => t.type === 'basic')!;
    expect(basic.defaultStep.next).toBe('');
  });

  it('Decision template defaultStep has conditions array and wait_for_response', () => {
    const decision = NODE_TEMPLATES.find((t) => t.type === 'decision')!;
    expect(Array.isArray(decision.defaultStep.conditions)).toBe(true);
    expect(decision.defaultStep.wait_for_response).toBe(true);
  });

  it('Terminal template defaultStep has action hangup', () => {
    const terminal = NODE_TEMPLATES.find((t) => t.type === 'terminal')!;
    expect(terminal.defaultStep.action).toBe('hangup');
  });
});

describe('generateNodeId', () => {
  it('returns unique ID not present in existing node ID set', () => {
    const existingIds = new Set(['basic_step_1', 'basic_step_2']);
    const newId = generateNodeId('basic', existingIds);
    expect(existingIds.has(newId)).toBe(false);
  });

  it('prefixes with template type (e.g., basic_step_1)', () => {
    const newId = generateNodeId('basic', new Set());
    expect(newId).toMatch(/^basic_step_\d+$/);
  });

  it('increments counter until finding unique ID', () => {
    const existingIds = new Set(['decision_step_1', 'decision_step_2']);
    const newId = generateNodeId('decision', existingIds);
    expect(newId).toBe('decision_step_3');
  });
});

describe('createNodeFromTemplate', () => {
  it('returns a Node with correct type, generated ID, data, and position', () => {
    const template = NODE_TEMPLATES[0]; // Basic
    const position = { x: 150, y: 250 };
    const existingIds = new Set<string>();
    const node = createNodeFromTemplate(template, position, existingIds);

    expect(node.type).toBe('step');
    expect(node.id).toMatch(/^basic_step_\d+$/);
    expect(node.position).toEqual({ x: 150, y: 250 });
    expect((node.data as { label: string }).label).toBe('Basic Step');
    expect(
      (node.data as { step: Record<string, unknown> }).step
    ).toEqual({ description: '', text: '', next: '' });
    expect(
      (node.data as { isFirstNode: boolean }).isFirstNode
    ).toBe(false);
  });

  it('generates ID unique among existing IDs', () => {
    const template = NODE_TEMPLATES[0]; // Basic
    const existingIds = new Set(['basic_step_1']);
    const node = createNodeFromTemplate(template, { x: 0, y: 0 }, existingIds);
    expect(node.id).not.toBe('basic_step_1');
    expect(node.id).toBe('basic_step_2');
  });
});

describe('NodePalette', () => {
  it('renders three palette items', () => {
    render(<NodePalette />);
    // Each template should render its label
    expect(screen.getByText('Basic Step')).toBeDefined();
    expect(screen.getByText('Decision Step')).toBeDefined();
    expect(screen.getByText('Terminal Step')).toBeDefined();
  });
});
