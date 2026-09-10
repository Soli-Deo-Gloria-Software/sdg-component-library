#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  echo "NODE_AUTH_TOKEN is required to publish to GitHub Packages." >&2
  echo "Create a classic PAT with write:packages (and read:packages) and export it:" >&2
  echo "  export NODE_AUTH_TOKEN=ghp_..." >&2
  exit 1
fi

CORE_PACKAGE="@soli-deo-gloria-software/sdg-components"
ANGULAR_PACKAGE="@soli-deo-gloria-software/sdg-components-angular"
ANGULAR_DIST="${ROOT_DIR}/packages/angular-workspace/dist/sdg-components-angular"

echo "Syncing ${ANGULAR_PACKAGE} version from ${CORE_PACKAGE}..."
npm run sync:angular-version

echo "Building ${CORE_PACKAGE} (required by Angular wrappers)..."
npm run build -w "${CORE_PACKAGE}"

echo "Building ${ANGULAR_PACKAGE}..."
npm run build -w angular-workspace -- sdg-components-angular

if [[ ! -f "${ANGULAR_DIST}/package.json" ]]; then
  echo "Angular package build output not found at ${ANGULAR_DIST}" >&2
  exit 1
fi

# Ensure GitHub registry settings are present in the publishable package.json
# (ng-packagr may omit publishConfig from the dist package.json).
node -e "
const fs = require('fs');
const pkgPath = require('path').join(process.argv[1], 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.publishConfig = {
  registry: 'https://npm.pkg.github.com',
  access: 'restricted',
};
if (!pkg.repository) {
  pkg.repository = {
    type: 'git',
    url: 'https://github.com/Soli-Deo-Gloria-Software/sdg-component-library.git',
  };
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
" "${ANGULAR_DIST}"

echo "Publishing ${ANGULAR_PACKAGE} to GitHub Packages..."
npm publish "${ANGULAR_DIST}" --registry=https://npm.pkg.github.com

echo "Published ${ANGULAR_PACKAGE}."
