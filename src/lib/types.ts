import type { Node, Edge } from '@xyflow/react';

export interface JsonMetadata {
  /** The key path to the steps container (e.g., "steps") */
  stepsKey: string;
  /** All top-level fields that are NOT the steps container, preserved verbatim */
  wrapperFields: Record<string, unknown>;
}

export interface StepContainerResult {
  stepsKey: string;
  steps: Record<string, Record<string, unknown>>;
}

export interface FlowTransformResult {
  nodes: Node[];
  edges: Edge[];
  metadata: JsonMetadata;
}
