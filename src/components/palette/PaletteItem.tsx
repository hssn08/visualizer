import { Square, GitBranch, CircleStop } from 'lucide-react';
import type { NodeTemplate } from './nodeTemplates';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square,
  GitBranch,
  CircleStop,
};

/** Shared state for pointer-event DnD: the template type being dragged. */
let _draggedTemplateType: string | null = null;

export function getDraggedTemplateType(): string | null {
  return _draggedTemplateType;
}

export function clearDraggedTemplateType(): void {
  _draggedTemplateType = null;
}

interface PaletteItemProps {
  template: NodeTemplate;
}

export function PaletteItem({ template }: PaletteItemProps) {
  const Icon = ICON_MAP[template.icon] ?? Square;

  return (
    <div
      className="flex items-start gap-2 rounded-md border bg-background p-2 cursor-grab hover:bg-accent hover:border-accent-foreground/20 transition-colors select-none"
      onPointerDown={(event) => {
        event.preventDefault();
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
        _draggedTemplateType = template.type;
      }}
      data-testid={`palette-item-${template.type}`}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight">{template.label}</div>
        <div className="text-xs text-muted-foreground leading-snug">
          {template.description}
        </div>
      </div>
    </div>
  );
}
