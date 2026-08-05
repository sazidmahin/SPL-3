#!/usr/bin/env bash
set -euo pipefail

base_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for i in $(seq 3 200); do
  folder="$(printf "p-%03d" "$i")"
  mkdir -p "$base_dir/$folder"
  for chunk in 1 2 3 4; do
    : > "$base_dir/$folder/chunk-${chunk}.json"
  done
done
