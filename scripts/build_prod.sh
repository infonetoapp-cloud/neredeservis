#!/usr/bin/env bash
set -euo pipefail

mode="${1:-apk-debug}"
"$(dirname "$0")/build_flavor.sh" prod "$mode"
