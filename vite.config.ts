import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost", // Solo escucha en localhost
    port: 8080,
  },
  build: {
    outDir: "dist/spa",
  },
  publicDir: "public",
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Solo aplicar durante desarrollo (serve mode)
    configureServer(server) {
      const app = createServer();

      // Añadir Express app como middleware a Vite dev server
      server.middlewares.use(app);
    },
  };
}
