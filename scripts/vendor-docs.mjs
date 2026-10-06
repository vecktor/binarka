// Vendor framework docs and pinned guideline files into .vendor-docs/ (ADR-0003).
//
// Next.js ships its docs inside the npm package; Vite and Vitest do not. This
// script copies the Markdown docs from the git tag that matches each installed
// version (read from package-lock.json), so agents read the docs for the exact
// versions in use instead of relying on memory. Sources that are not npm
// packages (Vercel's Web Interface Guidelines) are pinned to a git commit here.
//
//   node scripts/vendor-docs.mjs          copy everything for the installed versions and pinned commits
//   node scripts/vendor-docs.mjs --check  exit 1 if .vendor-docs/ does not match package-lock.json and the pins
//
// Needs git and network access to github.com (only for the copy, not for --check).
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

const OUT = ".vendor-docs";
const MANIFEST = join(OUT, "manifest.json");
// npm packages: docs come from the git tag v<installed version>.
const SOURCES = [
  { name: "vite", repo: "https://github.com/vitejs/vite.git", site: "https://vite.dev", dirs: ["guide", "config", "changes"] },
  { name: "vitest", repo: "https://github.com/vitest-dev/vitest.git", site: "https://vitest.dev", dirs: ["guide", "api", "config"] },
];
// Not npm packages: files come from a pinned commit. To update, change the commit and re-run.
const PINNED = [
  {
    name: "web-interface-guidelines",
    repo: "https://github.com/vercel-labs/web-interface-guidelines.git",
    commit: "434b7f91364665f2f733b310ec54809bf8f37937",
    site: "https://vercel.com/design/guidelines",
    files: ["AGENTS.md"],
  },
];

function fail(message) {
  console.error(`vendor-docs: ${message}`);
  process.exit(1);
}

function installedVersion(name) {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const version = lock.packages?.[`node_modules/${name}`]?.version;
  if (!version) fail(`${name} is not in package-lock.json; run npm install first.`);
  return version;
}

function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error) fail(`git is not available: ${result.error.message}`);
  if (result.status !== 0) fail(`git ${args.join(" ")} failed:\n${result.stderr.trim()}`);
  return result.stdout.trim();
}

function markdownFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(path));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

function check() {
  if (!existsSync(MANIFEST)) fail(`${MANIFEST} is missing; run npm run docs:vendor.`);
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const problems = [];
  for (const { name } of SOURCES) {
    const vendored = manifest.packages?.[name];
    const installed = installedVersion(name);
    if (!vendored) problems.push(`${name}: not vendored (installed ${installed})`);
    else if (vendored.version !== installed) problems.push(`${name}: docs are ${vendored.version}, installed is ${installed}`);
    else if (!existsSync(join(OUT, name)) || markdownFiles(join(OUT, name)).length !== vendored.files)
      problems.push(`${name}: ${OUT}/${name} does not hold the ${vendored.files} files the manifest lists`);
  }
  for (const { name, commit, files } of PINNED) {
    const vendored = manifest.pinned?.[name];
    if (!vendored) problems.push(`${name}: not vendored (pinned ${commit.slice(0, 7)})`);
    else if (vendored.commit !== commit) problems.push(`${name}: copy is ${vendored.commit.slice(0, 7)}, pin is ${commit.slice(0, 7)}`);
    else for (const file of files) if (!existsSync(join(OUT, name, file))) problems.push(`${name}: ${OUT}/${name}/${file} is missing`);
  }
  if (problems.length > 0) fail(`${problems.join("\n")}\nRun npm run docs:vendor to copy the docs for the installed versions and pins.`);
  const summary = [
    ...SOURCES.map(({ name }) => `${name} ${manifest.packages[name].version}`),
    ...PINNED.map(({ name, commit }) => `${name} ${commit.slice(0, 7)}`),
  ];
  console.log(`vendor-docs: OK (${summary.join(", ")})`);
}

function vendorPackage({ name, repo, site, dirs }) {
  const version = installedVersion(name);
  const tag = `v${version}`;
  const clone = mkdtempSync(join(tmpdir(), `vendor-docs-${name}-`));
  try {
    git(["clone", "--quiet", "--depth", "1", "--branch", tag, "--filter=blob:none", "--sparse", repo, clone]);
    git(["sparse-checkout", "set", ...dirs.map((d) => `docs/${d}`)], clone);
    const commit = git(["rev-parse", "HEAD"], clone);
    const target = join(OUT, name);
    rmSync(target, { recursive: true, force: true });
    let files = 0;
    let bytes = 0;
    for (const dir of dirs) {
      const source = join(clone, "docs", dir);
      if (!existsSync(source)) fail(`${name} ${tag} has no docs/${dir}`);
      for (const file of markdownFiles(source)) {
        const dest = join(target, relative(join(clone, "docs"), file));
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(file, dest);
        files++;
        bytes += statSync(file).size;
      }
    }
    cpSync(join(clone, "LICENSE"), join(target, "LICENSE"));
    console.log(`vendor-docs: ${name} ${tag} (${commit.slice(0, 7)}): ${files} files, ${Math.round(bytes / 1024)} KB`);
    return { version, tag, commit, repo, site, dirs, files, bytes };
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
}

function vendorPinned({ name, repo, commit, site, files }) {
  const clone = mkdtempSync(join(tmpdir(), `vendor-docs-${name}-`));
  try {
    git(["init", "--quiet", clone]);
    git(["remote", "add", "origin", repo], clone);
    git(["fetch", "--quiet", "--depth", "1", "origin", commit], clone);
    git(["checkout", "--quiet", "FETCH_HEAD"], clone);
    if (git(["rev-parse", "HEAD"], clone) !== commit) fail(`${name}: fetched commit does not match the pin ${commit}`);
    const target = join(OUT, name);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    let bytes = 0;
    for (const file of files) {
      cpSync(join(clone, file), join(target, file));
      bytes += statSync(join(clone, file)).size;
    }
    cpSync(join(clone, "LICENSE"), join(target, "LICENSE"));
    console.log(`vendor-docs: ${name} @ ${commit.slice(0, 7)}: ${files.join(", ")}, ${Math.round(bytes / 1024)} KB`);
    return { commit, repo, site, files, bytes };
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
}

function vendor() {
  const packages = {};
  for (const source of SOURCES) packages[source.name] = vendorPackage(source);
  const pinned = {};
  for (const source of PINNED) pinned[source.name] = vendorPinned(source);
  writeFileSync(MANIFEST, `${JSON.stringify({ generatedBy: "scripts/vendor-docs.mjs", packages, pinned }, null, 2)}\n`);
  writeFileSync(join(OUT, "README.md"), readme(packages, pinned));
}

function readme(packages, pinned) {
  const rows = SOURCES.map(({ name }) => {
    const p = packages[name];
    return `| ${name} | ${p.version} | \`${p.tag}\` (\`${p.commit.slice(0, 7)}\`) | ${p.dirs.map((d) => `\`${d}/\``).join(", ")} | ${p.files} | ${p.site} |`;
  });
  const pinnedRows = PINNED.map(({ name }) => {
    const p = pinned[name];
    return `| ${name} | \`${p.commit.slice(0, 7)}\` | ${p.files.map((f) => `\`${f}\``).join(", ")} | ${p.site} |`;
  });
  return `# Vendored framework docs

Version-matched copies of the official docs, for agents and people to read instead of
relying on memory (ADR-0003). Generated by \`scripts/vendor-docs.mjs\`; do not edit by hand.

| Package | Version | Git tag | Folders | Files | Live site |
|---|---|---|---|---|---|
${rows.join("\n")}

Pinned sources (not npm packages; the commit is set in the script):

| Source | Commit | Files | Live site |
|---|---|---|---|
${pinnedRows.join("\n")}

- Paths mirror the live site: \`vite/guide/features.md\` is ${packages.vite.site}/guide/features.
- Some search tools skip dot-directories by default (ripgrep does), so search with an explicit path,
  for example \`rg -n restoreMocks .vendor-docs/vitest\`.
- Each folder keeps the project's \`LICENSE\` (MIT).
- After upgrading Vite or Vitest, or changing a pin, run \`npm run docs:vendor\`; \`npm run check:docs\` fails while the copy disagrees with \`package-lock.json\` or the pins.
`;
}

if (process.argv.includes("--check")) check();
else vendor();
