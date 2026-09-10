#!/usr/bin/env node
/**
 * Keep the Angular wrapper version (and its sdg-components peer/dependency)
 * aligned with @soli-deo-gloria-software/sdg-components.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corePkgPath = path.join(rootDir, 'packages/sdg-components/package.json');
const angularLibPkgPath = path.join(
  rootDir,
  'packages/angular-workspace/projects/sdg-components-angular/package.json',
);
const angularWorkspacePkgPath = path.join(rootDir, 'packages/angular-workspace/package.json');

const corePackageName = '@soli-deo-gloria-software/sdg-components';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const corePkg = readJson(corePkgPath);
const version = corePkg.version;

if (!version) {
  console.error(`Missing version in ${corePkgPath}`);
  process.exit(1);
}

const range = `^${version}`;
let changed = false;

const angularLibPkg = readJson(angularLibPkgPath);
if (angularLibPkg.version !== version) {
  angularLibPkg.version = version;
  changed = true;
}
angularLibPkg.peerDependencies = {
  ...(angularLibPkg.peerDependencies ?? {}),
  [corePackageName]: range,
};
writeJson(angularLibPkgPath, angularLibPkg);

const angularWorkspacePkg = readJson(angularWorkspacePkgPath);
if (angularWorkspacePkg.version !== version) {
  angularWorkspacePkg.version = version;
  changed = true;
}
angularWorkspacePkg.dependencies = {
  ...(angularWorkspacePkg.dependencies ?? {}),
  [corePackageName]: range,
};
writeJson(angularWorkspacePkgPath, angularWorkspacePkg);

console.log(
  changed
    ? `Synced Angular packages to ${version} (peer/dep ${range}).`
    : `Angular packages already at ${version}; refreshed peer/dep to ${range}.`,
);
