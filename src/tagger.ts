// This file is a stub that re-exports from the tagger directory
// At build time, this will be replaced by a bundled version

export type {
  TaggerOptions,
  TagResult,
  VitePluginOptions,
  WebpackLoaderContext,
} from "./tagger/index.js";
export { shouldTagElement, threeFiberElems, transformComponentTags } from "./tagger/index.js";
