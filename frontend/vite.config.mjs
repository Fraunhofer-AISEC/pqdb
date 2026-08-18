import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

// sql.js loads its `.wasm` binary from the URL root (see locateFile in
// DatabaseProvider.jsx), so it must be reachable at `/` in both dev and build.
// Only sql-wasm-browser.wasm is fetched at runtime (the bundler's browser field
// resolves sql.js to sql-wasm-browser.js, which requests that name).
const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_WASM_FILE = 'sql-wasm-browser.wasm';

function sqlJsWasmPlugin() {
  const srcDir = resolve(__dirname, 'node_modules/sql.js/dist');
  return {
    name: 'sql-js-wasm',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url && req.url.split('?')[0].replace(/^\//, '');
        if (name === SQL_WASM_FILE) {
          const file = resolve(srcDir, name);
          if (existsSync(file)) {
            res.setHeader('Content-Type', 'application/wasm');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.end(readFileSync(file));
          }
        }
        next();
      });
    },
    closeBundle() {
      const outDir = resolve(__dirname, 'build');
      mkdirSync(outDir, { recursive: true });
      copyFileSync(resolve(srcDir, SQL_WASM_FILE), resolve(outDir, SQL_WASM_FILE));
    },
  };
}

export default defineConfig({
  plugins: [react(), sqlJsWasmPlugin()],
  base: './',
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
});
