import type { StepContainerResult } from './types';

/** Linking fields that indicate an object is a call flow step */
const LINKING_FIELDS = [
  'next',
  'conditions',
  'timeout_next',
  'no_match_next',
  'intent_detector_routes',
] as const;

/**
 * Check whether a value is a plain object (not null, not an array).
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Detect which top-level key in the JSON contains call flow steps.
 *
 * Strategy: iterate top-level keys, for each value that is a plain object,
 * count child objects that have linking fields. Pick the key with the
 * highest total linking field count. Require at least 2 step objects
 * to avoid false positives.
 *
 * @throws {Error} if no suitable steps container is found
 */
export function detectStepsContainer(json: Record<string, unknown>): StepContainerResult {
  let bestKey = '';
  let bestScore = 0;
  let bestSteps: Record<string, Record<string, unknown>> = {};

  for (const [key, value] of Object.entries(json)) {
    if (!isPlainObject(value)) continue;

    const candidateSteps = value as Record<string, unknown>;
    let stepCount = 0;
    let linkingFieldCount = 0;

    for (const stepValue of Object.values(candidateSteps)) {
      if (!isPlainObject(stepValue)) continue;
      stepCount++;
      const step = stepValue as Record<string, unknown>;
      for (const field of LINKING_FIELDS) {
        if (field in step) linkingFieldCount++;
      }
    }

    // Require at least 2 step objects to avoid false positives
    if (stepCount >= 2 && linkingFieldCount > bestScore) {
      bestScore = linkingFieldCount;
      bestKey = key;
      bestSteps = candidateSteps as Record<string, Record<string, unknown>>;
    }
  }

  if (!bestKey) {
    throw new Error(
      'Could not detect steps container in JSON. Expected an object containing ' +
        'step objects with linking fields (next, conditions, timeout_next, ' +
        'no_match_next, intent_detector_routes).'
    );
  }

  return { stepsKey: bestKey, steps: bestSteps };
}
