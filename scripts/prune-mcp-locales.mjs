// Run with --check to verify the cleanup without changing files.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const localesDir = new URL("../src/i18n/locales/", import.meta.url);
const keep = (key) =>
  key === "mcp.loading" ||
  key === "mcp.unifiedPanel.searchAriaLabel" ||
  key === "mcp.wizard.urlRequired" ||
  key.startsWith("mcp.presets.") ||
  key.startsWith("mcp.error.");

function prune(tree, path = "mcp", removed = []) {
  for (const [key, value] of Object.entries(tree)) {
    const fullKey = `${path}.${key}`;
    if (typeof value === "object" && value !== null) {
      prune(value, fullKey, removed);
      if (Object.keys(value).length === 0) delete tree[key];
    } else if (!keep(fullKey)) {
      delete tree[key];
      removed.push(fullKey);
    }
  }
  return removed;
}

for (const name of readdirSync(localesDir).filter((name) =>
  name.endsWith(".json"),
)) {
  const file = new URL(name, localesDir);
  const locale = JSON.parse(readFileSync(file, "utf8"));
  if (!locale.mcp) continue;
  const removed = prune(locale.mcp);
  console.log(`${name}: ${removed.length} unused MCP keys`);
  if (process.argv.includes("--check")) {
    if (removed.length) process.exitCode = 1;
  } else if (removed.length) {
    writeFileSync(file, `${JSON.stringify(locale, null, 2)}\n`);
  }
}
