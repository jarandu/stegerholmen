/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType;
  export default component;
}

interface ImagesManifest {
  images: string[];
}

declare module './generated/images-manifest.json' {
  const value: ImagesManifest;
  export default value;
}
