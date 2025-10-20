import { mkdir } from "node:fs/promises";
import { build } from "esbuild";

// Ensure dist directory exists
await mkdir("dist", { recursive: true });

// Bundle the tagger directory into a single file
// This creates dist/tagger.js with all the core logic bundled
await build({
  entryPoints: ["src/tagger/index.ts"],
  outfile: "dist/tagger.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node18",
  external: ["@babel/parser", "estree-walker", "magic-string", "node:path"],
  sourcemap: true,
});

// Build webpack loader as CommonJS for compatibility
// Webpack loaders traditionally use CommonJS (require/module.exports)
// Bundle estree-walker and magic-string to avoid ESM resolution issues
await build({
  entryPoints: ["src/webpack.ts"],
  outfile: "dist/webpack.cjs",
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node18",
  external: ["@babel/parser"],
  sourcemap: true,
});

// The tagger directory will have both JS and .d.ts files from TypeScript
// We keep the .d.ts files but the bundled tagger.js is what gets imported at runtime

console.log("✅ Build complete");
