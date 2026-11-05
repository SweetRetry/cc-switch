#!/bin/bash
# Apply upstream commits that pending.sh reports as CLEAN, one commit each.
# Only files this fork still has are applied; the original author and message
# are kept, and the message records the upstream hash and any skipped files.
#
#   scripts/upstream-sync/port.sh <commit>...
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
for c in "$@"; do
  args=(); skipped=()
  while read -r f; do
    if git cat-file -e HEAD:"$f" 2>/dev/null || [ -e "$f" ]; then args+=("--include=$f"); else skipped+=("$f"); fi
  done < <(git diff-tree --no-commit-id --name-only -r "$c")
  git format-patch -1 --stdout "$c" | git apply --index "${args[@]}"
  note="(cherry picked from upstream commit $(git rev-parse "$c"))"
  if [ ${#skipped[@]} -gt 0 ]; then
    note="$note
Skipped files that do not exist in this fork: ${skipped[*]}"
  fi
  GIT_AUTHOR_NAME="$(git log -1 --format=%an "$c")" \
  GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae "$c")" \
  GIT_AUTHOR_DATE="$(git log -1 --format=%aI "$c")" \
    git commit -q -m "$(git log -1 --format=%B "$c")" -m "$note"
  echo "OK $(git log -1 --format='%h %s')"
done
