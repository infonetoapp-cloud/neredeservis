#!/usr/bin/env bash
set -euo pipefail

./.fvm/flutter_sdk/bin/dart run build_runner watch -d
