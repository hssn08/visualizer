import { describe, it, expect } from 'vitest';
import { classifyNodeRole, ROLE_COLORS, type NodeRole } from '../nodeClassify';

describe('classifyNodeRole', () => {
  it('returns "start" when isFirstNode=true', () => {
    const step = { description: 'Initial greeting', next: 'step2' };
    expect(classifyNodeRole('greeting', step, true)).toBe('start');
  });

  it('returns "terminal" when step.action is "hangup"', () => {
    const step = { description: 'End call', action: 'hangup' };
    expect(classifyNodeRole('farewell', step, false)).toBe('terminal');
  });

  it('returns "terminal" when step.action is "transfer"', () => {
    const step = { description: 'Transfer to live agent', action: 'transfer' };
    expect(classifyNodeRole('transfer_agent', step, false)).toBe('terminal');
  });

  it('returns "error" when description contains "retry"', () => {
    const step = { description: 'Retry greeting after timeout' };
    expect(classifyNodeRole('greeting_retry', step, false)).toBe('error');
  });

  it('returns "error" when description contains "error"', () => {
    const step = { description: 'Handle error case' };
    expect(classifyNodeRole('error_handler', step, false)).toBe('error');
  });

  it('returns "error" when description contains "recovery"', () => {
    const step = { description: 'System recovery procedure' };
    expect(classifyNodeRole('recover', step, false)).toBe('error');
  });

  it('returns "normal" for a basic step with no special markers', () => {
    const step = { description: 'Present plan options', next: 'enrollment_confirm' };
    expect(classifyNodeRole('plan_options', step, false)).toBe('normal');
  });

  it('prioritizes "start" over "terminal" when isFirstNode=true and action=hangup', () => {
    const step = { description: 'End call', action: 'hangup' };
    expect(classifyNodeRole('farewell', step, true)).toBe('start');
  });

  it('prioritizes "terminal" over "error" when action=transfer and description has retry', () => {
    const step = { description: 'Retry transfer', action: 'transfer' };
    expect(classifyNodeRole('retry_transfer', step, false)).toBe('terminal');
  });
});

describe('ROLE_COLORS', () => {
  const roles: NodeRole[] = ['start', 'terminal', 'error', 'normal'];

  it('maps all 4 roles to color objects with border, bg, and minimap', () => {
    for (const role of roles) {
      expect(ROLE_COLORS[role]).toHaveProperty('border');
      expect(ROLE_COLORS[role]).toHaveProperty('bg');
      expect(ROLE_COLORS[role]).toHaveProperty('minimap');
      expect(typeof ROLE_COLORS[role].border).toBe('string');
      expect(typeof ROLE_COLORS[role].bg).toBe('string');
      expect(typeof ROLE_COLORS[role].minimap).toBe('string');
    }
  });

  it('start role has green colors', () => {
    expect(ROLE_COLORS.start.border).toContain('green');
    expect(ROLE_COLORS.start.bg).toContain('green');
    expect(ROLE_COLORS.start.minimap).toBe('#22c55e');
  });

  it('terminal role has red colors', () => {
    expect(ROLE_COLORS.terminal.border).toContain('red');
    expect(ROLE_COLORS.terminal.bg).toContain('red');
    expect(ROLE_COLORS.terminal.minimap).toBe('#ef4444');
  });

  it('error role has orange colors', () => {
    expect(ROLE_COLORS.error.border).toContain('orange');
    expect(ROLE_COLORS.error.bg).toContain('orange');
    expect(ROLE_COLORS.error.minimap).toBe('#f97316');
  });

  it('normal role has blue colors', () => {
    expect(ROLE_COLORS.normal.border).toContain('blue');
    expect(ROLE_COLORS.normal.bg).toContain('blue');
    expect(ROLE_COLORS.normal.minimap).toBe('#3b82f6');
  });
});
