// REFERENCE IMPLEMENTATION — deterministic trajectory validator.
//
// Sibling to check-traceability.mjs. Where check-traceability proves the
// REQUIREMENT chain, this proves the PROCESS each archived slice took — the
// part of "trajectory evaluation" that git/artifacts can prove, with exit
// codes (no LLM judgment):
//   - review evidence exists and is clean (review ran before archive);
//   - the slice's commits carry the `Slice:` trailer;
//   - module scope: which src/<module>/ each slice touched (cross-slice
//     overlaps flagged for drift review);
//   - the archived change folder has design.md + tasks.md.
//
// SIGNED DISPOSITIONS (PD-10, approved by the user 2026-10-12): a slice whose
// review file is not `clean: true` still passes when
// docs/qa/review-dispositions/<archive-folder>.json is valid and signed: every
// confirmed finding is `fixed` by a commit that exists and is an ancestor of
// HEAD, or `waived` with a reason; a product-code defect is never waivable;
// every top-level `confirmedTitles` entry of the review file is covered. The
// same file may carry a signed `designWaiver` for a missing design.md. What
// this script cannot verify (that the signature is the user's, that a commit
// really fixes its finding) is what the user signs; see
// docs/qa/review-dispositions/README.md.
//
// WHERE A REVIEW FILE BELONGS: openspec/changes/archive/<slice>/review-
// findings.json, with a boolean top-level `clean`. A file found at
// docs/qa/<slice-without-date>/review-findings.json is named (misplaced), and a
// file without a boolean `clean` reads `no-clean-field` (hand-written in
// another shape): both stay non-passing unless a signed disposition covers them.
//
// HONESTY BOUNDARY: it does NOT verify test-first ordering or "no test was
// weakened". Those are not derivable from one-commit-per-slice history — they
// are graded by the `trajectory-eval` workflow (a fresh LLM judge reading the
// diff). This script never claims what it cannot prove.
//
// Usage:
//   node scripts/check-trajectory.mjs                 # report + exit code
//   node scripts/check-trajectory.mjs --release       # missing evidence/trailer = FAIL
//   node scripts/check-trajectory.mjs --strict-scope  # cross-slice module overlap = FAIL
//   node scripts/check-trajectory.mjs --check-fresh   # committed report must match
//
// Outputs (deterministic, ASCII, no timestamps — safe to diff in CI):
//   docs/qa/trajectory-report.md   (generated — do not hand-edit)
//   trace/trajectory.json          (machine-readable)
//
// Wire as: "check:trajectory": "node scripts/check-trajectory.mjs"
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const flags = new Set(process.argv.slice(2));
const PATHS = {
  archiveDir: "openspec/changes/archive",
  reportOut: "docs/qa/trajectory-report.md",
  jsonOut: "trace/trajectory.json",
  dispositionsDir: "docs/qa/review-dispositions",
};
// src/<module>/ dirs that are conventionally shared — never flagged as a
// cross-slice overlap.
const SHARED_DOMAINS = new Set(["auth", "db", "shared", "ui", "utils", "common", "email"]);

const failures = [];
const warnings = [];
const fail = (check, msg) => failures.push({ check, msg });
const warn = (check, msg) => warnings.push({ check, msg });
// A finding that is a hard FAIL only under a strictness flag, else a warning.
const gated = (on, check, msg) => (on ? fail(check, msg) : warn(check, msg));

const read = (rel) => (existsSync(join(root, rel)) ? readFileSync(join(root, rel), "utf8") : null);
function git(args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "").trim() };
}
const isRepo = git(["rev-parse", "--is-inside-work-tree"]).ok;
if (!isRepo) warn("git", "not a git work tree — trailer/scope checks skipped");

const nonEmpty = (v) => typeof v === "string" && v.trim() !== "";
const readJson = (rel) => {
  const raw = read(rel);
  if (raw === null) return { missing: true };
  try {
    return { data: JSON.parse(raw) };
  } catch (e) {
    return { error: e.message };
  }
};

// "on-head", "off-head" or "missing"; cached, since many findings share a fix commit.
const commitStates = new Map();
function commitState(sha) {
  if (!commitStates.has(sha)) {
    const state = !git(["cat-file", "-e", `${sha}^{commit}`]).ok ? "missing" : git(["merge-base", "--is-ancestor", sha, "HEAD"]).ok ? "on-head" : "off-head";
    commitStates.set(sha, state);
  }
  return commitStates.get(sha);
}

// A signed disposition (PD-10). Returns null when valid, else the first broken rule.
function dispositionProblem(slice, d) {
  if (d === null || typeof d !== "object" || Array.isArray(d)) return "is not a JSON object";
  if (d.slice !== slice) return `"slice" is ${JSON.stringify(d.slice)}, not "${slice}"`;
  const sig = d.signature;
  if (!sig || typeof sig !== "object") return "is not signed (signature is null)";
  for (const k of ["signedBy", "signedAt", "channel", "words"]) if (!nonEmpty(sig[k])) return `signature.${k} is empty`;
  if (d.designWaiver != null) {
    if (!nonEmpty(d.designWaiver.reason)) return "designWaiver.reason is empty";
    if (d.designWaiver.pointsAt != null && !existsSync(join(root, d.designWaiver.pointsAt))) return `designWaiver.pointsAt ${d.designWaiver.pointsAt} does not exist`;
  }
  if (d.findings === undefined && d.reviewFile === undefined) return null; // a design waiver only
  if (!nonEmpty(d.reviewFile) || !existsSync(join(root, d.reviewFile))) return `reviewFile ${JSON.stringify(d.reviewFile)} does not exist`;
  if (!Array.isArray(d.findings)) return '"findings" is not an array';
  for (const [i, f] of d.findings.entries()) {
    const at = `finding ${i + 1}${nonEmpty(f?.title) ? ` ("${f.title.slice(0, 60)}")` : ""}`;
    if (!nonEmpty(f?.title)) return `${at} has no title`;
    if (typeof f.productCodeDefect !== "boolean") return `${at}: productCodeDefect is not a boolean`;
    if (f.outcome === "fixed") {
      if (!/^[0-9a-f]{7,40}$/.test(f.fixCommit ?? "")) return `${at}: fixCommit ${JSON.stringify(f.fixCommit)} is not a commit id`;
      if (!isRepo) return `${at}: fixCommit cannot be verified outside a git work tree`;
      const state = commitState(f.fixCommit);
      if (state === "missing") return `${at}: fixCommit ${f.fixCommit} does not exist`;
      if (state === "off-head") return `${at}: fixCommit ${f.fixCommit} is not an ancestor of HEAD`;
    } else if (f.outcome === "waived") {
      if (f.productCodeDefect) return `${at}: a product-code defect cannot be waived (it needs a fix commit)`;
      if (!nonEmpty(f.waiver)) return `${at}: waived without a waiver reason`;
    } else return `${at}: outcome ${JSON.stringify(f.outcome)} is neither "fixed" nor "waived"`;
  }
  const review = readJson(d.reviewFile).data;
  if (Array.isArray(review?.confirmedTitles)) {
    const covered = new Set(d.findings.map((f) => f.title));
    const left = review.confirmedTitles.filter((t) => !covered.has(t));
    if (left.length) return `${left.length} confirmed title(s) of ${d.reviewFile} have no entry (first: "${String(left[0]).slice(0, 60)}")`;
  }
  return null;
}

// ---------- discover archived slices ----------
const archiveAbs = join(root, PATHS.archiveDir);
const slices = existsSync(archiveAbs)
  ? readdirSync(archiveAbs).filter((e) => statSync(join(archiveAbs, e)).isDirectory())
  : [];

// slice -> { reviewEvidence, trailerCommits, libDomains[], processComplete }
const rows = [];
const dispositioned = new Set(); // slices with a disposition file (valid or not)
const domainToSlices = new Map(); // lib domain -> [slices]

for (const slice of slices) {
  const dir = join(PATHS.archiveDir, slice);
  // OpenSpec archives as `YYYY-MM-DD-add-<cap>`, but the commit trailer is the
  // bare `Slice: add-<cap>` — strip the date prefix so trailer matching works.
  const trailerName = slice.replace(/^\d{4}-\d{2}-\d{2}-/, "");

  // 1. review evidence
  let reviewEvidence = "missing";
  let hint = "";
  const rf = readJson(join(dir, "review-findings.json"));
  if (rf.error) reviewEvidence = "unparseable";
  else if (rf.data) {
    if (rf.data.clean === true) reviewEvidence = "clean";
    else if (typeof rf.data.clean !== "boolean") {
      reviewEvidence = "no-clean-field";
      hint = " — it has no boolean top-level `clean` (hand-written in another shape?): write `clean` as the run says, or cover it with a signed disposition";
    } else reviewEvidence = "unclean";
  } else {
    const elsewhere = `docs/qa/${trailerName}/review-findings.json`;
    if (existsSync(join(root, elsewhere))) hint = ` — found at ${elsewhere}: a review file belongs in the archive folder, or is referenced from a signed disposition`;
  }
  // A signed disposition (PD-10) stands for a review that is not clean, and for a missing design.md.
  const dispRel = `${PATHS.dispositionsDir}/${slice}.json`;
  const disp = readJson(dispRel);
  let dispProblem = null;
  if (!disp.missing) {
    dispProblem = disp.error ? `is not valid JSON (${disp.error})` : dispositionProblem(slice, disp.data);
    dispositioned.add(slice);
  }
  const dispOk = !disp.missing && dispProblem === null;
  if (reviewEvidence !== "clean") {
    if (dispOk && disp.data.findings !== undefined) reviewEvidence = "dispositioned";
    else {
      const why = !disp.missing ? `; ${dispRel} ${dispProblem ?? "has no findings (design waiver only)"}` : "";
      gated(flags.has("--release"), "review-evidence", `${slice}: review-findings.json is ${reviewEvidence}${hint}${why} (review must have run clean before archive, or its findings be dispositioned and signed)`);
    }
  }

  // 2. process completeness
  const hasTasks = existsSync(join(root, dir, "tasks.md"));
  const hasDesign = existsSync(join(root, dir, "design.md"));
  const designWaived = !hasDesign && dispOk && disp.data.designWaiver != null;
  const processComplete = hasTasks && (hasDesign || designWaived);
  if (!processComplete) {
    const why = !hasDesign && !disp.missing && dispProblem ? `; ${dispRel} ${dispProblem}` : "";
    gated(flags.has("--release"), "process", `${slice}: archived change is missing design.md and/or tasks.md${why}`);
  }

  // 3 + 4. trailer presence + module scope (git)
  let trailerCommits = 0;
  let libDomains = [];
  if (isRepo) {
    // HEAD's history, not --all (PD-12): the count must not depend on the local branches (backups, rebased copies), or a
    // report written on one machine is never fresh in a clean clone (CI).
    const { ok, out } = git(["log", "HEAD", `--grep=Slice: ${trailerName}`, "--name-only", "--pretty=format:commit %H"]);
    if (ok) {
      const files = new Set();
      for (const line of out.split("\n")) {
        if (line.startsWith("commit ")) trailerCommits += 1;
        else if (line.trim()) files.add(line.trim());
      }
      for (const f of files) {
        const m = f.match(/^src\/([^/]+)\//);
        if (m) {
          libDomains.push(m[1]);
        }
      }
      libDomains = [...new Set(libDomains)];
      for (const d of libDomains) {
        if (!domainToSlices.has(d)) domainToSlices.set(d, []);
        domainToSlices.get(d).push(slice);
      }
    }
    if (trailerCommits === 0) gated(flags.has("--release"), "trailer", `${slice}: no commit carries a "Slice: ${trailerName}" trailer`);
  }

  rows.push({ slice, reviewEvidence, trailerCommits, libDomains, processComplete, designWaived });
}

// A disposition file that names no archived slice is reported, never silently ignored.
if (existsSync(join(root, PATHS.dispositionsDir))) {
  for (const f of readdirSync(join(root, PATHS.dispositionsDir)).filter((n) => n.endsWith(".json")).sort()) {
    if (!dispositioned.has(f.replace(/\.json$/, ""))) warn("review-evidence", `${PATHS.dispositionsDir}/${f} names no archived slice`);
  }
}

// cross-slice module overlap (after all slices seen)
const overlaps = [];
for (const [domain, owners] of domainToSlices) {
  const uniq = [...new Set(owners)];
  if (uniq.length > 1 && !SHARED_DOMAINS.has(domain)) {
    overlaps.push({ domain, slices: uniq });
    gated(flags.has("--strict-scope"), "in-scope", `src/${domain}/ modified by ${uniq.length} slices (${uniq.join(", ")}) — review for scope drift`);
  }
}

if (slices.length === 0) warn("slices", "no archived slices found under openspec/changes/archive/ (nothing to audit yet)");

// ---------- outputs ----------
const ok = (b) => (b ? "yes" : "**no**");
const report = `# Trajectory Report (generated - do not hand-edit)

Generated by \`node scripts/check-trajectory.mjs\`. Audits the PROCESS each
archived slice took: review evidence, \`Slice:\` trailers, and module scope.
"dispositioned" = the review was not clean, and every confirmed finding is fixed
or waived in a signed docs/qa/review-dispositions/<slice>.json; "waived" = a
signed waiver stands for a missing design.md (PD-10).
It does NOT verify test-first ordering or test integrity (not derivable from
one-commit-per-slice history) — those are graded by the trajectory-eval workflow.

Scope: ${slices.length} archived slice(s).
Result: ${failures.length === 0 ? "PASS" : `FAIL (${failures.length} failure${failures.length === 1 ? "" : "s"})`}${warnings.length ? `, ${warnings.length} warning(s)` : ""}

| Slice | Review evidence | Trailer commits | design+tasks | lib domains touched |
|---|---|---|---|---|
${rows
  .map((r) => `| ${r.slice} | ${["clean", "dispositioned"].includes(r.reviewEvidence) ? r.reviewEvidence : `**${r.reviewEvidence}**`} | ${r.trailerCommits || "**0**"} | ${r.designWaived ? "waived" : ok(r.processComplete)} | ${r.libDomains.join(", ") || "-"} |`)
  .join("\n")}

## Cross-slice module overlap

${overlaps.length ? overlaps.map((o) => `- \`src/${o.domain}/\` touched by: ${o.slices.join(", ")}`).join("\n") : "None."}

## Failures

${failures.length ? failures.map((f) => `- **${f.check}**: ${f.msg}`).join("\n") : "None."}

## Warnings

${warnings.length ? warnings.map((w) => `- **${w.check}**: ${w.msg}`).join("\n") : "None."}
`;

const trajectory = {
  generatedBy: "scripts/check-trajectory.mjs",
  slices: rows,
  overlaps,
  failures,
  warnings,
};

if (flags.has("--check-fresh")) {
  const committed = read(PATHS.reportOut);
  if (committed === null) fail("freshness", `${PATHS.reportOut} does not exist — run the validator and commit it`);
  else if (committed.replace(/\r\n/g, "\n") !== report.replace(/\r\n/g, "\n")) fail("freshness", `${PATHS.reportOut} is stale — regenerate and commit`);
} else {
  mkdirSync(join(root, "trace"), { recursive: true });
  mkdirSync(join(root, "docs", "qa"), { recursive: true });
  writeFileSync(join(root, PATHS.reportOut), report);
  writeFileSync(join(root, PATHS.jsonOut), `${JSON.stringify(trajectory, null, 2)}\n`);
}

for (const w of warnings) console.warn(`WARN  [${w.check}] ${w.msg}`);
for (const f of failures) console.error(`FAIL  [${f.check}] ${f.msg}`);
console.log(`\nScope: ${slices.length} archived slice(s)`);
if (!flags.has("--check-fresh")) console.log(`wrote ${PATHS.reportOut} and ${PATHS.jsonOut}`);
console.log(`Result: ${failures.length ? "FAIL" : "PASS"}${warnings.length ? `, ${warnings.length} warning(s)` : ""}`);
process.exit(failures.length ? 1 : 0);
