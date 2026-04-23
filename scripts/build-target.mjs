import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

const [, , target, outDir, configPath] = process.argv;

if (!target || !outDir || !configPath) {
  console.error("Usage: node scripts/build-target.mjs <target> <outDir> <configPath>");
  process.exit(1);
}

const profiles = {
  "ai-enterprise": {
    html: "index.html",
    css: "styles.css",
    extra: []
  },
  "babyray-classic": {
    html: "public/index.html",
    css: "public/styles.css",
    extra: []
  },
  "lobby-react": {
    html: "lobby.html",
    css: "",
    extra: ["src", "rooms/assets/assets:assets"]
  },
  "gift-shelf": {
    html: "gift-shelf.html",
    css: "gift-shelf.css",
    extra: []
  },
  "lobby-redirect": {
    html: "lobby/index.html",
    css: "",
    extra: []
  },
  "clone-stage": {
    html: "rooms/assets/rooms/clone-stage-2fb13/clone-stage.html",
    css: "",
    extra: []
  }
};

const targetDefaults = {
  studio: { profile: "ai-enterprise" },
  mainstage: { profile: "babyray-classic" },
  videochat: { profile: "lobby-react" }
};

const upper = target.toUpperCase();
const profileName = process.env[`BUILD_${upper}_PROFILE`] || targetDefaults[target]?.profile;
const profile = (profileName && profiles[profileName]) || { html: "", css: "", extra: [] };

const sourceHtml = process.env[`BUILD_${upper}_SOURCE_HTML`] || profile.html;
const sourceCss = process.env[`BUILD_${upper}_SOURCE_CSS`] || profile.css;
const extraRaw = process.env[`BUILD_${upper}_EXTRA`];
const extraEntries = extraRaw
  ? extraRaw.split(",").map((part) => part.trim()).filter(Boolean)
  : profile.extra;

if (!sourceHtml) {
  console.error(`No HTML source configured for target '${target}'.`);
  process.exit(1);
}

function resolveInput(relPath) {
  return path.resolve(cwd, relPath);
}

function ensureExists(absPath, label) {
  if (!fs.existsSync(absPath)) {
    console.error(`${label} not found: ${absPath}`);
    process.exit(1);
  }
}

function copyFileTo(absSource, absDest) {
  fs.mkdirSync(path.dirname(absDest), { recursive: true });
  fs.copyFileSync(absSource, absDest);
}

function copyDirTo(absSource, absDest) {
  fs.mkdirSync(path.dirname(absDest), { recursive: true });
  fs.cpSync(absSource, absDest, { recursive: true });
}

const outAbs = path.resolve(cwd, outDir);
fs.rmSync(outAbs, { recursive: true, force: true });
fs.mkdirSync(outAbs, { recursive: true });

const htmlAbs = resolveInput(sourceHtml);
ensureExists(htmlAbs, "HTML source");
copyFileTo(htmlAbs, path.join(outAbs, "index.html"));

if (sourceCss) {
  const cssAbs = resolveInput(sourceCss);
  ensureExists(cssAbs, "CSS source");
  copyFileTo(cssAbs, path.join(outAbs, "styles.css"));
}

const configAbs = resolveInput(configPath);
ensureExists(configAbs, "Config source");
copyFileTo(configAbs, path.join(outAbs, "config.js"));

for (const entry of extraEntries) {
  const [sourceRel, destRel] = entry.includes(":") ? entry.split(":") : [entry, entry];
  const sourceAbs = resolveInput(sourceRel);
  if (!fs.existsSync(sourceAbs)) {
    console.warn(`Skipping missing extra path: ${sourceRel}`);
    continue;
  }

  const destAbs = path.join(outAbs, destRel);
  const stat = fs.statSync(sourceAbs);
  if (stat.isDirectory()) {
    copyDirTo(sourceAbs, destAbs);
  } else {
    copyFileTo(sourceAbs, destAbs);
  }
}

console.log(`Built ${target} -> ${outDir}`);
console.log(`  profile: ${profileName || "custom"}`);
console.log(`  html: ${sourceHtml}`);
console.log(`  css: ${sourceCss || "(none)"}`);
if (extraEntries.length) {
  console.log(`  extra: ${extraEntries.join(", ")}`);
}
