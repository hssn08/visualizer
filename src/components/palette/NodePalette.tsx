import { Plus } from 'lucide-react';
import { NODE_TEMPLATES } from './nodeTemplates';
import { PaletteItem } from './PaletteItem';

export function NodePalette() {
  return (
    <div className="w-52 border-r bg-muted/30 p-3 overflow-y-auto">
      <div className="flex items-center gap-1.5 mb-3">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Add Step</span>
      </div>
      <div className="flex flex-col gap-2">
        {NODE_TEMPLATES.map((template) => (
          <PaletteItem key={template.type} template={template} />
        ))}
      </div>
    </div>
  );
}
