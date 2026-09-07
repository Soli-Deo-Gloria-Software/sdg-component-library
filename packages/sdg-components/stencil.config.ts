import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';

export const config: Config = {
  namespace: 'sdg-components',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    angularOutputTarget({
      componentCorePackage: '@soli-deo-gloria-software/sdg-components',
      outputType: 'component',
      directivesProxyFile: '../angular-workspace/projects/sdg-components-angular/src/lib/stencil-generated/components.ts',
      directivesArrayFile: '../angular-workspace/projects/sdg-components-angular/src/lib/stencil-generated/index.ts',
    }),
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
};
