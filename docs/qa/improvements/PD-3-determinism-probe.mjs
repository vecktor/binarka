const root = process.argv[2]; process.chdir(root);
import { createHash } from 'node:crypto';
const a = await import(`${root}/scripts/check-visual-parity-adapters.mjs`);
const shots = [['320-light-eight', 320, 700], ['375-dark-hint', 375, 812], ['375-light-setup-marked-four', 375, 812], ['768-light-rules', 768, 1024], ['1024-dark-confirm', 1024, 768], ['1366-dark-settings-focus', 1366, 650], ['1440-light-win', 1440, 900]];
let same = 0;
for (const [name, width, height] of shots) {
  const h = [];
  for (let i = 0; i < 2; i++) h.push(createHash('sha1').update((await a.capture({ role: 'local', url: 'http://localhost:4174/', name, width, height, settleMs: 300 })).png).digest('hex').slice(0, 12));
  if (h[0] === h[1]) same++;
  console.log(name.padEnd(30), h.join(' '), h[0] === h[1] ? 'identical' : 'DIFFERENT');
}
await a.close();
console.log(`${same} of ${shots.length} byte-identical`);
