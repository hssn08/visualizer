import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-flow': ['@xyflow/react'],
          'json-editor': ['json-edit-react'],
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },
});
