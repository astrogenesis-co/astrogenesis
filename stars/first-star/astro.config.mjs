import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://first.astrogenesis.co",
  publicDir: "./site",
  outDir: process.env.EXPLORE_PREVIEW === "1" ? "./preview-dist" : "./dist",
  output: "static",
  devToolbar: { enabled: false },
  vite: {
    plugins: [
      {
        name: "reload-catalog-content",
        configureServer(server) {
          const contentRoot = fileURLToPath(new URL(".", import.meta.url));
          const paths = [
            "songs",
            "albums",
            "stages",
            "essays",
            "explore.public.json",
          ].map((p) => contentRoot + p);
          server.watcher.add(paths);
          server.watcher.on("all", (event, path) => {
            if (
              ["change", "add", "unlink"].includes(event) &&
              paths.some((p) => path === p || path.startsWith(p + "/"))
            )
              server.ws.send({ type: "full-reload" });
          });
        },
      },
    ],
  },
});
