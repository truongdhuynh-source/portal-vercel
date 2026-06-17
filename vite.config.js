import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "process";
import fs from "fs";
import path from "path";
import svgr from "vite-plugin-svgr";
const appDirectory = fs.realpathSync(process.cwd());

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(appDirectory, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 4000,
    "Cache-Control": "no-store",
    headers: {
      // "Cross-Origin-Embedder-Policy": "require-corp",
      // "Cross-Origin-Embedder-Policy": "credentialless",
      // "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4000,
    "Cache-Control": "no-store",
  },
  plugins: [react(), svgr()],
  base: "/",
});
