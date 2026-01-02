import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read version from package.json
  const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8"));
  const version = packageJson.version || "0.0.0";
  const buildDate = new Date().toISOString();

  return {
    server: {
      host: "::",
      port: 5173,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
      // Plugin to inject build info
      {
        name: 'inject-build-info',
        transformIndexHtml(html) {
          return html.replace(
            '</head>',
            `<script>window.__BUILD_INFO__ = ${JSON.stringify({ version, buildDate })};</script></head>`
          );
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          }
        }
      }
    }
  };
});
