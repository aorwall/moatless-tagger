import { describe, expect, it } from "vitest";
import { transformComponentTags } from "../tagger.js";

describe("transformComponentTags", () => {
  const filePath = "/project/src/components/Button.tsx";
  const cwd = "/project";

  describe("basic JSX transformation", () => {
    it("should add data attributes to simple HTML elements", () => {
      const source = `
export function App() {
  return <div>Hello World</div>
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-id="src/components/Button.tsx:3:9"');
      expect(result.code).toContain('data-component-name="div"');
      expect(result.code).toContain(
        '<div data-component-id="src/components/Button.tsx:3:9" data-component-name="div">Hello World</div>',
      );
    });

    it("should add data attributes to custom React components", () => {
      const source = `
export function App() {
  return <Button>Click me</Button>
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-id="src/components/Button.tsx:3:9"');
      expect(result.code).toContain('data-component-name="Button"');
      expect(result.code).toContain(
        '<Button data-component-id="src/components/Button.tsx:3:9" data-component-name="Button">Click me</Button>',
      );
    });

    it("should handle self-closing tags", () => {
      const source = `
export function App() {
  return <Input />
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-id="src/components/Button.tsx:3:9"');
      expect(result.code).toContain('data-component-name="Input"');
      expect(result.code).toContain(
        '<Input data-component-id="src/components/Button.tsx:3:9" data-component-name="Input" />',
      );
    });

    it("should handle multiple elements", () => {
      const source = `
export function App() {
  return (
    <div>
      <Button>Click</Button>
      <span>Text</span>
    </div>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-name="div"');
      expect(result.code).toContain('data-component-name="Button"');
      expect(result.code).toContain('data-component-name="span"');
    });

    it("should preserve existing attributes", () => {
      const source = `
export function App() {
  return <button className="btn" onClick={handleClick}>Click</button>
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('className="btn"');
      expect(result.code).toContain("onClick={handleClick}");
      expect(result.code).toContain('data-component-name="button"');
    });
  });

  describe("React Fragments", () => {
    it("should NOT tag Fragment elements", () => {
      const source = `
export function App() {
  return (
    <Fragment>
      <div>Content</div>
    </Fragment>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).not.toContain("<Fragment data-component");
      expect(result.code).toContain('data-component-name="div"');
    });

    it("should NOT tag React.Fragment elements", () => {
      const source = `
export function App() {
  return (
    <React.Fragment>
      <div>Content</div>
    </React.Fragment>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).not.toContain("<React.Fragment data-component");
      expect(result.code).toContain('data-component-name="div"');
    });
  });

  describe("Three.js/Fiber elements", () => {
    it("should NOT tag Three.js mesh elements", () => {
      const source = `
export function Scene() {
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).not.toContain("<mesh data-component");
      expect(result.code).not.toContain('data-component-name="mesh"');
      expect(result.code).not.toContain('data-component-name="boxGeometry"');
      expect(result.code).not.toContain('data-component-name="meshStandardMaterial"');
    });

    it("should NOT tag Three.js light elements", () => {
      const source = `
export function Lights() {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
    </group>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).not.toContain('data-component-name="group"');
      expect(result.code).not.toContain('data-component-name="ambientLight"');
      expect(result.code).not.toContain('data-component-name="directionalLight"');
    });
  });

  describe("@react-three/drei imports", () => {
    it("should NOT tag imported drei components", () => {
      const source = `
import { OrbitControls, Environment } from '@react-three/drei'

export function Scene() {
  return (
    <>
      <OrbitControls />
      <Environment preset="sunset" />
    </>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).not.toContain('data-component-name="OrbitControls"');
      expect(result.code).not.toContain('data-component-name="Environment"');
    });

    it("should NOT tag namespace imported drei components", () => {
      const source = `
import * as drei from '@react-three/drei'

export function Scene() {
  return (
    <>
      <drei.OrbitControls />
      <drei.Environment preset="sunset" />
    </>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).not.toContain('data-component-name="drei.OrbitControls"');
      expect(result.code).not.toContain('data-component-name="drei.Environment"');
    });

    it("should tag regular components when drei is imported", () => {
      const source = `
import { OrbitControls } from '@react-three/drei'

export function Scene() {
  return (
    <div>
      <MyComponent />
      <OrbitControls />
    </div>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-name="div"');
      expect(result.code).toContain('data-component-name="MyComponent"');
      expect(result.code).not.toContain('data-component-name="OrbitControls"');
    });
  });

  describe("JSX member expressions", () => {
    it("should handle member expression components", () => {
      const source = `
export function App() {
  return <UI.Button>Click</UI.Button>
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-name="UI.Button"');
    });

    it("should NOT tag drei namespace member expressions", () => {
      const source = `
import * as drei from '@react-three/drei'

export function Scene() {
  return <drei.PerspectiveCamera position={[0, 0, 5]} />
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).not.toContain('data-component-name="drei.PerspectiveCamera"');
    });

    it("should tag non-drei namespace member expressions", () => {
      const source = `
export function App() {
  return (
    <>
      <UI.Button />
      <Components.Header />
    </>
  )
}
`;
      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-name="UI.Button"');
      expect(result.code).toContain('data-component-name="Components.Header"');
    });
  });

  describe("custom shouldTag function", () => {
    it("should use custom shouldTag function when provided", () => {
      const source = `
export function App() {
  return (
    <div>
      <InternalComponent />
      <PublicComponent />
    </div>
  )
}
`;
      const customShouldTag = (elementName: string) => {
        return !elementName.startsWith("Internal");
      };

      const result = transformComponentTags(source, filePath, cwd, { shouldTag: customShouldTag });

      expect(result.code).toContain('data-component-name="div"');
      expect(result.code).toContain('data-component-name="PublicComponent"');
      expect(result.code).not.toContain('data-component-name="InternalComponent"');
    });

    it("should allow custom filtering logic", () => {
      const source = `
export function App() {
  return (
    <div>
      <AllowedComponent />
      <BlockedComponent />
    </div>
  )
}
`;
      const customShouldTag = (elementName: string) => {
        return elementName !== "BlockedComponent";
      };

      const result = transformComponentTags(source, filePath, cwd, { shouldTag: customShouldTag });

      expect(result.code).toContain('data-component-name="AllowedComponent"');
      expect(result.code).not.toContain('data-component-name="BlockedComponent"');
    });
  });

  describe("relative path calculation", () => {
    it("should calculate correct relative path from cwd", () => {
      const absolutePath = "/home/user/project/src/components/ui/Button.tsx";
      const projectRoot = "/home/user/project";
      const source = `export const Button = () => <button>Click</button>`;

      const result = transformComponentTags(source, absolutePath, projectRoot);

      expect(result.code).toContain('data-component-id="src/components/ui/Button.tsx:1:28"');
    });

    it("should handle nested directory structures", () => {
      const absolutePath = "/project/src/app/dashboard/components/Chart.tsx";
      const projectRoot = "/project";
      const source = `export const Chart = () => <div>Chart</div>`;

      const result = transformComponentTags(source, absolutePath, projectRoot);

      expect(result.code).toContain(
        'data-component-id="src/app/dashboard/components/Chart.tsx:1:27"',
      );
    });
  });

  describe("line and column numbers", () => {
    it("should include correct line and column in data-component-id", () => {
      const source = `export function App() {
  return (
    <div>
      <Button />
    </div>
  )
}`;

      const result = transformComponentTags(source, filePath, cwd);

      // Line 3, column 4 for div
      expect(result.code).toContain('data-component-id="src/components/Button.tsx:3:4"');
      // Line 4, column 6 for Button
      expect(result.code).toContain('data-component-id="src/components/Button.tsx:4:6"');
    });
  });

  describe("source maps", () => {
    it("should generate source map", () => {
      const source = `export const App = () => <div>Hello</div>`;

      const result = transformComponentTags(source, filePath, cwd);

      expect(result.map).toBeDefined();
      expect(result.map).not.toBeNull();
    });
  });

  describe("error handling", () => {
    it("should return original source on parse error", () => {
      const invalidSource = `export function App() {
  return <div>Unclosed div
}`;

      const result = transformComponentTags(invalidSource, filePath, cwd);

      expect(result.code).toBe(invalidSource);
      expect(result.map).toBeNull();
    });

    it("should handle empty source", () => {
      const source = "";

      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toBe("");
    });

    it("should handle source without JSX", () => {
      const source = `
export function add(a: number, b: number) {
  return a + b
}
`;

      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toBe(source);
    });
  });

  describe("custom parser plugins", () => {
    it("should support custom parser plugins", () => {
      const source = `
export function App() {
  return <div>Hello</div>
}
`;
      const customPlugins = ["jsx", "typescript"] as const;

      const result = transformComponentTags(source, filePath, cwd, {
        parserPlugins: customPlugins,
      });

      expect(result.code).toContain('data-component-name="div"');
    });
  });

  describe("real-world component examples", () => {
    it("should handle a typical React component", () => {
      const source = `
import React from 'react'

export function UserProfile({ name, email }: { name: string; email: string }) {
  return (
    <div className="profile">
      <h1>{name}</h1>
      <p>{email}</p>
      <button onClick={() => alert('Edit')}>Edit Profile</button>
    </div>
  )
}
`;

      const result = transformComponentTags(source, filePath, cwd);

      expect(result.code).toContain('data-component-name="div"');
      expect(result.code).toContain('data-component-name="h1"');
      expect(result.code).toContain('data-component-name="p"');
      expect(result.code).toContain('data-component-name="button"');
    });

    it("should handle a component with nested elements", () => {
      const source = `
export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}
`;

      const result = transformComponentTags(source, filePath, cwd);

      // All div elements should be tagged
      expect((result.code.match(/data-component-name="div"/g) || []).length).toBe(3);
      expect(result.code).toContain('data-component-name="h2"');
    });

    it("should handle mixed Three.js and regular React components", () => {
      const source = `
import { Canvas } from '@react-three/fiber'

export function App() {
  return (
    <div className="container">
      <Canvas>
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial />
        </mesh>
      </Canvas>
    </div>
  )
}
`;

      const result = transformComponentTags(source, filePath, cwd);

      // Should tag div and Canvas (React components)
      expect(result.code).toContain('data-component-name="div"');
      expect(result.code).toContain('data-component-name="Canvas"');

      // Should NOT tag Three.js elements
      expect(result.code).not.toContain('data-component-name="ambientLight"');
      expect(result.code).not.toContain('data-component-name="mesh"');
      expect(result.code).not.toContain('data-component-name="boxGeometry"');
      expect(result.code).not.toContain('data-component-name="meshStandardMaterial"');
    });
  });
});
