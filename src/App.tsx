import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Flow Editor</h1>
        <Button>Ready</Button>
      </div>
    </div>
  );
}
