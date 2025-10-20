import type { Plugin } from "vite";
import type { VitePluginOptions } from "./tagger.js";
import { transformComponentTags } from "./tagger.js";

/**
 * Vite plugin for automatic component tagging
 *
 * This plugin adds debugging attributes to JSX/TSX components during development.
 * By default, it only runs in development mode and processes .jsx and .tsx files.
 *
 * @param options - Plugin configuration options
 * @returns Vite plugin
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import componentTagger from '@moatless/component-tagger/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     componentTagger(), // Only runs in dev mode by default
 *   ],
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * import { defineConfig } from 'vite';
 * import componentTagger from '@moatless/component-tagger/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     componentTagger({
 *       devOnly: false, // Also run in production (not recommended)
 *       includeLegacyAttributes: false, // Only add data-component-id
 *       include: /\.(jsx|tsx)$/, // Custom file pattern
 *       exclude: /node_modules/, // Exclude pattern
 *     }),
 *   ],
 * });
 * ```
 */
export default function componentTagger(options: VitePluginOptions = {}): Plugin {
  const {
    devOnly = true,
    include = /\.(jsx|tsx)$/,
    exclude = /node_modules/,
    ...taggerOptions
  } = options;

  let isDev = true;
  let rootDir = process.cwd();

  return {
    name: "component-tagger",

    configResolved(config) {
      isDev = config.mode === "development";
      rootDir = config.root;
    },

    transform(code: string, id: string) {
      // Skip if not in dev mode and devOnly is true
      if (devOnly && !isDev) {
        return null;
      }

      // Check include/exclude patterns
      const shouldInclude = Array.isArray(include)
        ? include.some((pattern) =>
            pattern instanceof RegExp ? pattern.test(id) : id.includes(pattern),
          )
        : include instanceof RegExp
          ? include.test(id)
          : id.includes(include);

      if (!shouldInclude) {
        return null;
      }

      const shouldExclude = exclude
        ? Array.isArray(exclude)
          ? exclude.some((pattern) =>
              pattern instanceof RegExp ? pattern.test(id) : id.includes(pattern),
            )
          : exclude instanceof RegExp
            ? exclude.test(id)
            : id.includes(exclude)
        : false;

      if (shouldExclude) {
        return null;
      }

      // Transform the code
      const result = transformComponentTags(code, id, rootDir, taggerOptions);

      return {
        code: result.code,
        // biome-ignore lint: Source map type from magic-string is compatible with Vite's SourceMapInput
        map: result.map as any,
      };
    },
  };
}
