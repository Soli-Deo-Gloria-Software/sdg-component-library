#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

"${ROOT_DIR}/scripts/publish-components.sh"
"${ROOT_DIR}/scripts/publish-angular.sh"

echo "Published @soli-deo-gloria-software/sdg-components and @soli-deo-gloria-software/sdg-components-angular."
