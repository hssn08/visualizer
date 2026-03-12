import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/** Fields always shown in the panel (even if absent from step data). */
const ALWAYS_SHOWN = new Set(['description', 'text']);

/** All structured field keys in display order. */
const FIELD_KEYS = [
  'description',
  'text',
  'audio_file',
  'wait_for_response',
  'pause_duration',
  'timeout',
] as const;

interface StructuredFieldsProps {
  nodeId: string;
  step: Record<string, unknown>;
}

export function StructuredFields({ nodeId, step }: StructuredFieldsProps) {
  const updateNodeData = useAppStore((s) => s.updateNodeData);

  const visibleFields = FIELD_KEYS.filter(
    (key) => ALWAYS_SHOWN.has(key) || key in step
  );

  return (
    <div className="space-y-3" data-testid="structured-fields">
      {visibleFields.map((key) => {
        const value = step[key];

        if (key === 'wait_for_response') {
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <Label htmlFor={`field-${key}`} className="text-xs">
                wait_for_response
              </Label>
              <Switch
                id={`field-${key}`}
                checked={!!value}
                onCheckedChange={(checked: boolean) =>
                  updateNodeData(nodeId, { [key]: checked })
                }
              />
            </div>
          );
        }

        if (key === 'pause_duration' || key === 'timeout') {
          return (
            <div key={key} className="space-y-1">
              <Label htmlFor={`field-${key}`} className="text-xs">
                {key}
              </Label>
              <Input
                id={`field-${key}`}
                type="number"
                value={value != null ? String(value) : ''}
                onChange={(e) => {
                  const num = e.target.value === '' ? undefined : Number(e.target.value);
                  updateNodeData(nodeId, { [key]: num });
                }}
                placeholder={key}
              />
            </div>
          );
        }

        if (key === 'text') {
          return (
            <div key={key} className="space-y-1">
              <Label htmlFor={`field-${key}`} className="text-xs">
                text
              </Label>
              <Textarea
                id={`field-${key}`}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => updateNodeData(nodeId, { [key]: e.target.value })}
                placeholder="Text content"
                rows={3}
              />
            </div>
          );
        }

        // description, audio_file -- plain text Input
        return (
          <div key={key} className="space-y-1">
            <Label htmlFor={`field-${key}`} className="text-xs">
              {key}
            </Label>
            <Input
              id={`field-${key}`}
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => updateNodeData(nodeId, { [key]: e.target.value })}
              placeholder={key}
            />
          </div>
        );
      })}
    </div>
  );
}
