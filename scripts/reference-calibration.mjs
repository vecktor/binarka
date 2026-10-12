// The calibration that lets the design build stand in for the NFR-14 reference set, shared by scripts/freeze-design-geometry.mjs and
// scripts/freeze-design-paint.mjs (their provenance `standIn`). Side-effect free apart from reading the named file.
// Review gate of the design stream DS (run wf_b4f0e083-6e6): `standIn` was a hard-coded string while `reference` came from the config, and a
// refreeze once wrote the set-14 calibration under a set-15 reference. A reference set with no calibration here now fails the freeze.

import { existsSync, readFileSync } from 'node:fs';

/** Reference set id -> the calibration that shows the design build reproduces all 170 shots of that set at 1.0000 (gate capture method). */
export const CALIBRATIONS = {
  'review-set-14': 'docs/qa/g2/harness-calibration.txt',
  'review-set-15': 'docs/qa/design-stream/harness-calibration-set15.txt',
  'review-set-16': 'docs/qa/design-stream/harness-calibration-set16.txt',
};

/** The provenance `standIn` for a config's referenceDir; throws when no calibration exists for that set or its file does not name the set. */
export function standInFor(referenceDir) {
  const set = referenceDir.split('/').filter(Boolean).pop();
  const file = CALIBRATIONS[set];
  if (file === undefined) throw new Error(`no harness calibration for ${set}: run docs/qa/g2/calibrate-harness.mjs against it and add it to scripts/reference-calibration.mjs`);
  if (!existsSync(file)) throw new Error(`the harness calibration ${file} for ${set} is missing`);
  if (!readFileSync(file, 'utf8').split('\n', 1)[0].includes(set)) throw new Error(`${file} does not name ${set} in its first line`);
  return `${file} (the design build reproduces all 170 reference shots at 1.0000)`;
}
