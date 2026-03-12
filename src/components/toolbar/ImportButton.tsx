import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importJson = useAppStore((s) => s.importJson);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text) as Record<string, unknown>;
      importJson(json);
    } catch (err) {
      console.error('Failed to import JSON:', err instanceof Error ? err.message : err);
    }

    // Reset so the same file can be re-imported
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
        data-testid="import-file-input"
      />
      <Button variant="outline" size="sm" onClick={handleClick}>
        <Upload data-icon="inline-start" />
        Import
      </Button>
    </>
  );
}
