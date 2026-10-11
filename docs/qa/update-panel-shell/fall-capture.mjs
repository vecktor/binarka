// Capture the product side of some shots with the gate's own adapter (scripts/check-visual-parity-adapters.mjs capture()), from the
// tree this script is run in (its dist/). Used for the run-10 fall explanation (task 6.3). Run from a tree root, after npm run build,
// under the capture lock: node <path>/fall-capture.mjs <out-dir> <shot> [<shot> …]
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { capture, close } = await import(pathToFileURL(resolve('scripts/check-visual-parity-adapters.mjs')).href);
const [out, ...shots] = process.argv.slice(2);
const SIZES = { 320: 700, 375: 812, 768: 1024, 1024: 768, 1366: 650, 1440: 900 };
for (const name of shots) {
  const w = Number(name.split('-')[0]);
  const r = await capture({ role: 'local', url: 'http://localhost:4174/', name, width: w, height: SIZES[w], settleMs: 300 });
  writeFileSync(`${out}/${name}.png`, r.png);
  console.log('captured', name);
}
await close();
