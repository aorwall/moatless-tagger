/**
 * @moatless/component-tagger
 *
 * Automatic JSX/TSX component tagging for debugging in both Vite and Webpack builds.
 *
 * This package provides build-time transformation that adds data attributes to JSX components
 * to help with debugging, component inspection, and automated testing.
 *
 * @example Vite usage
 * ```typescript
 * import componentTagger from '@moatless/component-tagger/vite';
 * export default defineConfig({
 *   plugins: [componentTagger()],
 * });
 * ```
 *
 * @example Webpack usage
 * ```javascript
 * module.exports = {
 *   module: {
 *     rules: [
 *       {
 *         test: /\.(jsx|tsx)$/,
 *         exclude: /node_modules/,
 *         use: ['@moatless/component-tagger/webpack'],
 *       },
 *     ],
 *   },
 * };
 * ```
 *
 * @packageDocumentation
 */

// Export types
export type {
  TaggerOptions,
  TagResult,
  VitePluginOptions,
  WebpackLoaderContext,
} from "./tagger.js";
// Export core functionality from bundled tagger.js
export { shouldTagElement, threeFiberElems, transformComponentTags } from "./tagger.js";
