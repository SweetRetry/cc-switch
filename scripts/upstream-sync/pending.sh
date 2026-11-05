#!/bin/bash
# List upstream commits newer than the last reviewed one in docs/upstream-sync.md,
# and for each one whether it touches files this fork still has and whether that
# part applies cleanly to HEAD.
#
#   scripts/upstream-sync/pending.sh            # since the recorded "Last reviewed"
#   scripts/upstream-sync/pending.sh <commit>   # since another commit
#
# Output columns: CLEAN | CONFLICT(n bad/live files) | SKIP (no live files), then
# live/total touched files, hash and subject.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git fetch -q upstream
since="${1:-$(sed -n 's/^Last reviewed: `\([0-9a-f]*\)`.*/\1/p' docs/upstream-sync.md)}"
[ -n "$since" ] || { echo "no 'Last reviewed' line in docs/upstream-sync.md" >&2; exit 1; }
patch=$(mktemp); trap 'rm -f "$patch"' EXIT
for c in $(git rev-list --no-merges --reverse "$since"..upstream/main); do
  args=(); live=0; total=0
  while read -r f; do
    total=$((total + 1))
    if git cat-file -e HEAD:"$f" 2>/dev/null; then args+=("--include=$f"); live=$((live + 1)); fi
  done < <(git diff-tree --no-commit-id --name-only -r "$c")
  if [ "$live" -eq 0 ]; then
    result=SKIP
  else
    git format-patch -1 --stdout "$c" > "$patch"
    if git apply --check "${args[@]}" "$patch" 2>/dev/null; then
      result=CLEAN
    else
      bad=$(git apply --check "${args[@]}" "$patch" 2>&1 | grep -c 'does not apply' || true)
      result="CONFLICT($bad)"
    fi
  fi
  echo "$result $live/$total $(git log -1 --format='%h %s' "$c")"
done
