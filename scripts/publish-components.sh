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

PACKAGE_NAME="@soli-deo-gloria-software/sdg-components"

echo "Building ${PACKAGE_NAME}..."
npm run build -w "${PACKAGE_NAME}"

echo "Publishing ${PACKAGE_NAME} to GitHub Packages..."
npm publish -w "${PACKAGE_NAME}"

echo "Published ${PACKAGE_NAME}."
