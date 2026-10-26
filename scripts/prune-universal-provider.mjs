// Remove obsolete translations. --check also guards against feature code returning.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const check = process.argv.includes("--check");
const keys = [
  "universalProvider",
  "provider.tabUniversal",
  "providerPreset.group.universal",
  "providerPreset.groupHint.universal",
  "providerPreset.crossApp",
  "providerPreset.universalDetail",
  "providerPreset.manageUniversal",
  "appPage.installAndUpgrade",
  "appPage.hideFromSidebar",
];

for (const name of readdirSync(new URL("src/i18n/locales/", root))) {
  if (!name.endsWith(".json")) continue;
  const file = new URL(`src/i18n/locales/${name}`, root);
  const locale = JSON.parse(readFileSync(file, "utf8"));
  let removed = 0;
  for (const path of keys) {
    const parts = path.split(".");
    const key = parts.pop();
    const parent = parts.reduce((value, part) => value?.[part], locale);
    if (parent && Object.hasOwn(parent, key)) {
      delete parent[key];
      removed += 1;
    }
  }
  if (removed && check) {
    console.error(`${name} contains ${removed} obsolete translation keys`);
    process.exitCode = 1;
  } else if (removed) {
    writeFileSync(file, `${JSON.stringify(locale, null, 2)}\n`);
  }
}

if (check) {
  const obsolete =
    /UniversalProvider|universalProvider|universal_provider|universal-provider|appPage\.(installAndUpgrade|hideFromSidebar)/;
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = new URL(
        entry.name + (entry.isDirectory() ? "/" : ""),
        directory,
      );
      if (entry.isDirectory()) scan(file);
      else if (
        /\.(rs|tsx?|json)$/.test(entry.name) &&
        obsolete.test(readFileSync(file, "utf8"))
      ) {
        console.error(`Obsolete feature reference in ${fileURLToPath(file)}`);
        process.exitCode = 1;
      }
    }
  }
  scan(new URL("src/", root));
  scan(new URL("src-tauri/src/", root));
}
