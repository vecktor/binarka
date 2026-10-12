// Full-page stills of the ten confirm shots for the vision judge (update-confirm-dialog task 8.1), through the gate's own adapter capture()
// (the same driver, device scale and settle as check:visual). The design side is the frozen reference PNG of review-set-14, not copied.
// Usage: npm run build && BINARKA_PORT_BASE=6373 node docs/qa/update-confirm-dialog/stills/capture-stills.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { capture, close } from '../../../../scripts/check-visual-parity-adapters.mjs';
const config = JSON.parse(readFileSync('quality/visual-parity.config.json', 'utf8'));
const shots = config.breakpoints.filter((b) => /-confirm$/.test(b.name));
try {
  for (const s of shots) {
    const { png } = await capture({ role: 'local', url: config.localUrl, name: s.name, width: s.width, height: s.height, settleMs: config.settleMs ?? 300 });
    writeFileSync(`docs/qa/update-confirm-dialog/stills/${s.name}.png`, png);
    console.log(`${s.name} ${s.width}x${s.height} -> docs/qa/update-confirm-dialog/stills/${s.name}.png (reference ${config.referenceDir}/${s.name}.png)`);
  }
} finally {
  await close();
}
