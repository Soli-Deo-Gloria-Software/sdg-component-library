import type { StorybookConfig } from '@storybook/web-components-vite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Resolve an absolute package path (needed in npm workspaces / monorepos).
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: getAbsolutePath('@storybook/web-components-vite'),
  staticDirs: [
    // Stencil lazy-loads chunks from dist/; serve them for Storybook.
    { from: '../dist', to: '/dist' },
    { from: '../loader', to: '/loader' },
  ],
  async viteFinal(config, { configType }) {
    if (configType !== 'DEVELOPMENT') {
      return config;
    }

    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
      build: {
        // Avoid Vite watching `dist`, which breaks Stencil HMR.
        outDir: 'dist-vite',
      },
      plugins: [
        {
          name: 'stencil-force-full-reload',
          handleHotUpdate({ file, server }) {
            if (file.includes('/dist/') || file.includes('/loader/')) {
              server.ws.send({ type: 'full-reload' });
              return [];
            }
          },
        },
      ],
    });
  },
};

export default config;
