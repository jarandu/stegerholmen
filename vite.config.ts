import { defineConfig, type Plugin } from 'vite';
import { readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const GENERATED_DIR = join(process.cwd(), 'src', 'generated');
const MANIFEST_PATH = join(GENERATED_DIR, 'images-manifest.json');

function generateImagesManifest(): void {
  const imagesDir = join(process.cwd(), 'public', 'images');

  try {
    const files = readdirSync(imagesDir);
    const images = files
      .filter((file) => IMAGE_EXTENSIONS.has(file.slice(file.lastIndexOf('.')).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'nb'));

    mkdirSync(GENERATED_DIR, { recursive: true });
    writeFileSync(MANIFEST_PATH, JSON.stringify({ images }, null, 2) + '\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Could not generate images manifest:', message);
  }
}

function imagesManifestPlugin(): Plugin {
  return {
    name: 'images-manifest',
    buildStart() {
      generateImagesManifest();
    },
    configureServer() {
      generateImagesManifest();
    },
  };
}

export default defineConfig({
  plugins: [imagesManifestPlugin(), svelte()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
