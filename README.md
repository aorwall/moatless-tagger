# @moatless/tagger

Automatic JSX/TSX component tagging for AI-assisted coding platforms.

## Overview

The component tagger automatically adds data attributes to JSX/TSX components during development to enable **visual component selection for AI coding assistants**. Click on any element in your running application to specify exactly which component the AI should modify - bridging the gap between what you see and what code needs to change.

Perfect for AI coding platforms where you want to point at a UI element and say "change this component".

These attributes are **only added in development mode** and can be configured to exclude production builds.

## Installation

### From npm (when published)

```bash
npm install @moatless/tagger
# or
yarn add @moatless/tagger
# or
pnpm add @moatless/tagger
# or
bun add @moatless/tagger
```

### From GitHub

Install directly from the GitHub repository without publishing to npm:

```bash
# From latest main branch
npm install github:aorwall/moatless-tagger
# or
bun add github:aorwall/moatless-tagger

# From specific version/tag
npm install github:aorwall/moatless-tagger#v0.1.0

# From specific branch
npm install github:aorwall/moatless-tagger#develop

# Using full git URL
npm install https://github.com/aorwall/moatless-tagger.git

# Using SSH (requires GitHub authentication)
npm install git+ssh://git@github.com:aorwall/moatless-tagger.git
```

The package will automatically build itself during installation via the `prepare` script.

## Usage

### Vite

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import componentTagger from '@moatless/tagger/vite';

export default defineConfig({
  plugins: [
    react(),
    componentTagger(), // Only runs in dev mode by default
  ],
});
```

#### Vite Options

```typescript
componentTagger({
  // Only apply in development mode (default: true)
  devOnly: true,

  // Include/exclude patterns (default: /\.(jsx|tsx)$/)
  include: /\.(jsx|tsx)$/,
  exclude: /node_modules/,

  // Custom parser plugins
  parserPlugins: ['jsx', 'typescript'],

  // Custom filter function
  shouldTag: (elementName: string) => {
    return !elementName.startsWith('Internal');
  },
});
```

### Webpack / Next.js

#### Standard Webpack

Add the loader to your webpack config:

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: '@moatless/tagger/webpack',
          },
        ],
      },
    ],
  },
};
```

#### Next.js

Add the loader in your `next.config.js` or `next.config.ts`:

```javascript
module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('@moatless/tagger/webpack'),
          },
        ],
      });
    }
    return config;
  },
};
```

## What It Does

For each JSX component in your codebase, the tagger adds these data attributes:

```html
<Button
  data-component-id="src/components/ui/button.tsx:15:3"
  data-component-name="Button"
>
  Click me
</Button>
```

- **`data-component-id`**: Unique identifier in format `path:line:column` (e.g., `src/app/page.tsx:42:5`)
- **`data-component-name`**: Component or element name (e.g., `Button`, `div`, `MyComponent`)

## Use Case: AI-Assisted Coding Platforms

Enable visual component selection in AI coding platforms. Users can click on any UI element in their running application, and the platform extracts the exact file path and location to tell the AI which component to modify.

**Workflow:**
1. User sees a button they want to change in the running app
2. User clicks on the button in "inspector mode"
3. System extracts: `src/components/ui/button.tsx:15:3`
4. User tells AI: "Make this button larger"
5. AI knows exactly which file and component to modify

### Example Implementation

Here's how to extract component source information from tagged elements:

```javascript
// Extract source information from element's data attributes
function extractSourceFromElement(element) {
  const componentId = element.getAttribute('data-component-id');
  const componentName = element.getAttribute('data-component-name');

  if (!componentId || !componentName) {
    return null;
  }

  // Parse componentId format: "path:line:column"
  const lastColonIndex = componentId.lastIndexOf(':');
  const secondLastColonIndex = componentId.lastIndexOf(':', lastColonIndex - 1);

  const path = componentId.substring(0, secondLastColonIndex);
  const line = parseInt(componentId.substring(secondLastColonIndex + 1, lastColonIndex), 10);
  const column = parseInt(componentId.substring(lastColonIndex + 1), 10);

  return {
    componentId,
    path,           // "src/components/ui/button.tsx"
    line,           // 15
    column,         // 3
    componentName   // "Button"
  };
}

// Find element with source data (walks up parent chain if needed)
function findElementWithSource(element) {
  let currentElement = element;
  let attempts = 0;
  const maxSearchAttempts = 10;

  while (currentElement && attempts < maxSearchAttempts) {
    const sourceInfo = extractSourceFromElement(currentElement);
    if (sourceInfo) {
      return sourceInfo;
    }
    currentElement = currentElement.parentElement;
    attempts++;
  }

  return null;
}

// Click handler to send component info to AI platform
document.addEventListener('click', (e) => {
  const sourceInfo = findElementWithSource(e.target);

  if (sourceInfo) {
    // Send to AI platform with exact file location
    sendToAIPlatform({
      componentName: sourceInfo.componentName,
      filePath: sourceInfo.path,
      line: sourceInfo.line,
      column: sourceInfo.column,
      // AI can now modify the exact component the user clicked on
    });
  }
});
```

## Configuration

### What Gets Tagged

- ✅ All JSX/TSX components in your source directory
- ✅ Custom React components (`<Button>`, `<MyComponent>`)
- ✅ HTML elements (`<div>`, `<span>`, `<button>`)

### What Gets Excluded

- ❌ Files in `node_modules`
- ❌ React Fragments (`<Fragment>`, `<React.Fragment>`)
- ❌ Three.js/Fiber elements (mesh, camera, light, geometry, material, etc.)
- ❌ `@react-three/drei` components (OrbitControls, Environment, etc.)
- ❌ Production builds (when `devOnly: true`)

### Custom Filtering

You can provide a custom `shouldTag` function to control which elements get tagged:

```typescript
componentTagger({
  shouldTag: (elementName: string) => {
    // Skip all internal components
    if (elementName.startsWith('Internal')) {
      return false;
    }
    // Skip specific component
    if (elementName === 'NoTagComponent') {
      return false;
    }
    return true;
  },
});
```

## Credits

This package is based on [lovable-tagger](https://www.npmjs.com/package/lovable-tagger), extended to support both Vite and Webpack build systems.
