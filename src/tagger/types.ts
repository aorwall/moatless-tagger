import type { ParserPlugin } from "@babel/parser";

/**
 * Configuration options for the component tagger
 */
export interface TaggerOptions {
  /** Custom parser plugins to enable (default: ['jsx', 'typescript']) */
  parserPlugins?: ParserPlugin[];
  /** Custom function to determine if an element should be tagged */
  shouldTag?: (elementName: string) => boolean;
}

/**
 * Result of the tagging transformation
 */
export interface TagResult {
  /** Transformed source code */
  code: string;
  /** Source map */
  map: unknown;
}

/**
 * Webpack loader context interface (minimal required fields)
 */
export interface WebpackLoaderContext {
  /** Async callback function */
  async: () => (error: Error | null, content?: string, sourceMap?: unknown) => void;
  /** Path to the resource being loaded */
  resourcePath: string;
  /** Root context (project root) */
  rootContext?: string;
}

/**
 * Vite plugin options
 */
export interface VitePluginOptions extends TaggerOptions {
  /** Only apply in development mode (default: true) */
  devOnly?: boolean;
  /** Include/exclude patterns for files to transform */
  include?: string | RegExp | (string | RegExp)[];
  /** Exclude patterns for files to skip */
  exclude?: string | RegExp | (string | RegExp)[];
}
