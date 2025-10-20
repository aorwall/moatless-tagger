import type { TaggerOptions, WebpackLoaderContext } from "./tagger.js";
import { transformComponentTags } from "./tagger.js";

/**
 * Webpack loader for automatic component tagging
 *
 * This loader adds debugging attributes to JSX/TSX components during development.
 * It should be configured to run only in development mode.
 *
 * @example
 * ```javascript
 * // webpack.config.js
 * module.exports = {
 *   module: {
 *     rules: [
 *       {
 *         test: /\.(jsx|tsx)$/,
 *         exclude: /node_modules/,
 *         use: [
 *           {
 *             loader: '@moatless/component-tagger/webpack',
 *           },
 *         ],
 *       },
 *     ],
 *   },
 * };
 * ```
 *
 * @example
 * ```javascript
 * // Next.js next.config.js
 * module.exports = {
 *   webpack: (config, { dev }) => {
 *     if (dev) {
 *       config.module.rules.push({
 *         test: /\.(jsx|tsx)$/,
 *         exclude: /node_modules/,
 *         use: [
 *           {
 *             loader: require.resolve('@moatless/component-tagger/webpack'),
 *           },
 *         ],
 *       });
 *     }
 *     return config;
 *   },
 * };
 * ```
 */
export default function componentTaggerLoader(this: WebpackLoaderContext, source: string): void {
  const callback = this.async();
  const filePath = this.resourcePath;
  const cwd = this.rootContext || process.cwd();

  // Get options from webpack loader query/options
  const options: TaggerOptions = {};

  const result = transformComponentTags(source, filePath, cwd, options);

  callback(null, result.code, result.map);
}
