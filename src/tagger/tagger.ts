import * as path from "node:path";
import type { ParserPlugin } from "@babel/parser";
import { parse } from "@babel/parser";
import { walk } from "estree-walker";
import MagicString from "magic-string";
import { shouldTagElement } from "./should-tag.js";
import type { TaggerOptions, TagResult } from "./types.js";

// biome-ignore lint: Using any for AST nodes is acceptable
type ASTNode = any;

/**
 * Transform JSX/TSX source code to add component debugging attributes
 *
 * @param source - Source code to transform
 * @param filePath - Absolute path to the file being transformed
 * @param cwd - Current working directory (project root)
 * @param options - Tagger configuration options
 * @returns Transformed code and source map
 */
export function transformComponentTags(
  source: string,
  filePath: string,
  cwd: string,
  options: TaggerOptions = {},
): TagResult {
  const { parserPlugins = ["jsx", "typescript"] as ParserPlugin[], shouldTag: customShouldTag } =
    options;

  try {
    const relativePath = path.relative(cwd, filePath);

    // Parse the source code into an AST
    const parserOptions = {
      sourceType: "module" as const,
      plugins: parserPlugins,
    };
    const ast = parse(source, parserOptions);

    const magicString = new MagicString(source);
    const threeDreiImportedElements = new Set<string>();
    const threeDreiNamespaces = new Set<string>();

    // First pass: collect drei imports
    walk(ast as ASTNode, {
      enter(node: ASTNode) {
        if (node.type === "ImportDeclaration") {
          const sourceValue = node.source?.value;
          if (typeof sourceValue === "string" && sourceValue.includes("@react-three/drei")) {
            const specifiers = node.specifiers;
            for (const spec of specifiers || []) {
              if (spec.type === "ImportSpecifier") {
                const local = spec.local;
                if (local?.name) {
                  threeDreiImportedElements.add(local.name);
                }
              } else if (spec.type === "ImportNamespaceSpecifier") {
                const local = spec.local;
                if (local?.name) {
                  threeDreiNamespaces.add(local.name);
                }
              }
            }
          }
        }
      },
    });

    // Second pass: tag JSX elements
    walk(ast as ASTNode, {
      enter(node: ASTNode) {
        if (node.type === "JSXOpeningElement") {
          const jsxNode = node;
          let elementName: string;

          const name = jsxNode.name;
          if (name.type === "JSXIdentifier") {
            elementName = name.name;
          } else if (name.type === "JSXMemberExpression") {
            const memberExpr = name;
            const obj = memberExpr.object;
            const prop = memberExpr.property;
            elementName = `${obj.name}.${prop.name}`;
          } else {
            return;
          }

          // Skip React Fragments
          if (elementName === "Fragment" || elementName === "React.Fragment") {
            return;
          }

          // Get location for component ID
          const loc = jsxNode.loc;
          const line = loc?.start?.line ?? 0;
          const col = loc?.start?.column ?? 0;
          const dataComponentId = `${relativePath}:${line}:${col}`;

          // Determine if we should tag this element
          const shouldTag = customShouldTag
            ? customShouldTag(elementName)
            : shouldTagElement(elementName, threeDreiImportedElements, threeDreiNamespaces);

          if (shouldTag) {
            const attributeString = ` data-component-id="${dataComponentId}" data-component-name="${elementName}"`;

            const nameNode = jsxNode.name;
            const insertPosition = nameNode.end ?? 0;
            magicString.appendLeft(insertPosition, attributeString);
          }
        }
      },
    });

    const result = magicString.toString();
    const map = magicString.generateMap({ hires: true });

    return { code: result, map };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    // Return original source on error
    return { code: source, map: null };
  }
}
