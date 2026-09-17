// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Phase 1 Cloudflare preview: pin Nitro to Workers module output.
  // Confirmed against @lovable.dev/vite-tanstack-config@2.15.0 (defaultPreset /
  // LOVABLE_NITRO_PRESETS) and nitro@3.0.260603-beta PresetName = "cloudflare-module".
  // deployConfig generates wrangler.json; nodeCompat enables nodejs_compat for Start/h3.
  // Production Render (master) still uses node-server — this branch is preview-only.
  nitro: {
    preset: "cloudflare-module",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
});
