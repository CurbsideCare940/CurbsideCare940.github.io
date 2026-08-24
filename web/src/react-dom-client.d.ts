// Ambient declarations for react-dom/client (react-dom@19 ships types in
// @types/react-dom, which isn't installed in this workspace). Keeps tsc happy
// without adding a dependency that the sandboxed npm install can't fetch.
declare module "react-dom/client" {
  import { type ReactNode, type Container } from "react";

  interface ClientHandle {
    unmount(): void;
    // minimal; the rest are optional for our usage
  }

  export interface createRootOptions {
    // React 19 hydration options subset; intentionally permissive.
    [key: string]: any;
  }

  export function createRoot(
    container: Container,
    options?: createRootOptions,
  ): { render(node: ReactNode): void; unmount(): void };

  export function hydrateRoot(
    container: Container,
    node: ReactNode,
    options?: createRootOptions,
  ): void;
}
