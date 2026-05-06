import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const stripTrailingSlash = (u: string) => u.replace(/\/$/, "");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicSiteUrl = stripTrailingSlash(env.VITE_PUBLIC_SITE_URL || "https://keddmat.com");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "inject-public-site-url",
        transformIndexHtml(html) {
          return html.replace(/__PUBLIC_SITE_URL__/g, publicSiteUrl);
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
