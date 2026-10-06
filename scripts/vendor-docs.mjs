// Vendor version-matched framework docs into .vendor-docs/ (ADR-0003).
//
// Next.js ships its docs inside the npm package; Vite and Vitest do not. This
// script copies the Markdown docs from the git tag that matches each installed
// version (read from package-lock.json), so agents read the docs for the exact
// versions in use instead of relying on memory.
//
//   node scripts/vendor-docs.mjs          copy the docs for the installed versions
//   node scripts/vendor-docs.mjs --check  exit 1 if .vendor-docs/ does not match package-lock.json
//
// Needs git and network access to github.com (only for the copy, not for --check).
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

const OUT = ".vendor-docs";
const MANIFEST = join(OUT, "manifest.json");
const SOURCES = [
  { name: "vite", repo: "https://github.com/vitejs/vite.git", site: "https://vite.dev", dirs: ["guide", "config", "changes"] },
  { name: "vitest", repo: "https://github.com/vitest-dev/vitest.git", site: "https://vitest.dev", dirs: ["guide", "api", "config"] },
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
  if (problems.length > 0) fail(`${problems.join("\n")}\nRun npm run docs:vendor to copy the docs for the installed versions.`);
  console.log(`vendor-docs: OK (${SOURCES.map(({ name }) => `${name} ${manifest.packages[name].version}`).join(", ")})`);
}

function vendor() {
  const packages = {};
  for (const { name, repo, site, dirs } of SOURCES) {
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
      packages[name] = { version, tag, commit, repo, site, dirs, files, bytes };
      console.log(`vendor-docs: ${name} ${tag} (${commit.slice(0, 7)}): ${files} files, ${Math.round(bytes / 1024)} KB`);
    } finally {
      rmSync(clone, { recursive: true, force: true });
    }
  }
  writeFileSync(MANIFEST, `${JSON.stringify({ generatedBy: "scripts/vendor-docs.mjs", packages }, null, 2)}\n`);
  writeFileSync(join(OUT, "README.md"), readme(packages));
}

function readme(packages) {
  const rows = SOURCES.map(({ name }) => {
    const p = packages[name];
    return `| ${name} | ${p.version} | \`${p.tag}\` (\`${p.commit.slice(0, 7)}\`) | ${p.dirs.map((d) => `\`${d}/\``).join(", ")} | ${p.files} | ${p.site} |`;
  });
  return `# Vendored framework docs

Version-matched copies of the official docs, for agents and people to read instead of
relying on memory (ADR-0003). Generated by \`scripts/vendor-docs.mjs\`; do not edit by hand.

| Package | Version | Git tag | Folders | Files | Live site |
|---|---|---|---|---|---|
${rows.join("\n")}

- Paths mirror the live site: \`vite/guide/features.md\` is ${packages.vite.site}/guide/features.
- Some search tools skip dot-directories by default (ripgrep does), so search with an explicit path,
  for example \`rg -n restoreMocks .vendor-docs/vitest\`.
- Each folder keeps the project's \`LICENSE\` (MIT).
- After upgrading Vite or Vitest, run \`npm run docs:vendor\`; \`npm run check:docs\` fails while the copy and \`package-lock.json\` disagree.
`;
}

if (process.argv.includes("--check")) check();
else vendor();
