import { readFileSync } from 'node:fs';
const parse = (t) => { const m = {}; for (const l of t.split('\n')) { let r = l.match(/^(PASS|FAIL)\s+\[([^\]]+)\]\s+(?:pixel )?score ([0-9.]+)/); if (r) { m[r[2]] = +r[3]; continue; } r = l.match(/^FAIL\s+\[([^\]]+)\]/); if (r) m[r[1]] = null; } return m; };
const a = parse(readFileSync('docs/qa/g2/check-visual-run-12.txt', 'utf8')), b = parse(readFileSync(process.argv[2], 'utf8'));
const ps = (n) => { const m = n.match(/^(\d+)-(light|dark)-(.+)$/); return m ? { scheme: m[2], state: m[3] } : null; };
const mode = process.argv[3];
const names = Object.keys(b).sort();
if (mode === 'table') {
  const g = {};
  for (const n of names) { const p = ps(n); if (!p) continue; const k = `${p.state}|${p.scheme}`; (g[k] ??= []).push(n); }
  console.log('| State | Scheme | Run 12 at 0.98 | Run 13 at 0.98 | Lowest run 13 | Highest run 13 | Mean change | Fell |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const k of Object.keys(g).sort()) { const [st, sc] = k.split('|'); const ns = g[k]; const x = ns.map((n) => a[n]), y = ns.map((n) => b[n]);
    const mc = y.reduce((s, v, i) => s + (v - x[i]), 0) / ns.length;
    console.log(`| ${st} | ${sc} | ${x.filter((v) => v >= 0.98).length} of ${ns.length} | ${y.filter((v) => v >= 0.98).length} of ${ns.length} | ${Math.min(...y).toFixed(4)} | ${Math.max(...y).toFixed(4)} | ${mc >= 0 ? '+' : ''}${mc.toFixed(4)} | ${y.filter((v, i) => v < x[i]).length} |`); }
} else {
  const conf = names.filter((n) => ps(n)?.state === 'confirm');
  console.log('The ten confirm shots (run 12 -> run 13):');
  for (const n of conf) console.log(`  ${n.padEnd(22)} ${a[n].toFixed(4)} -> ${b[n].toFixed(4)}  ${b[n] > a[n] ? 'ROSE' : 'DID NOT RISE'}  ${b[n] >= 0.98 ? 'at 0.98' : 'below 0.98'}`);
  const others = names.filter((n) => ps(n)?.state !== 'confirm');
  const fell = others.filter((n) => typeof a[n] === 'number' && b[n] < a[n]), rose = others.filter((n) => typeof a[n] === 'number' && b[n] > a[n]);
  const unscored = others.filter((n) => a[n] === null || b[n] === null);
  console.log(`Every other shot: ${others.length} (${others.length - unscored.length} scored): fell ${fell.length}${fell.length ? ' ' + fell.join(', ') : ''}; rose ${rose.length}${rose.length ? ' ' + rose.join(', ') : ''}; equal ${others.length - unscored.length - fell.length - rose.length}; unscored in both runs ${unscored.length} (${unscored.join(', ')}, no state driver, Known gaps 2).`);
  console.log(`At 0.98: run 12 ${Object.values(a).filter((v) => v >= 0.98).length} of 170, run 13 ${Object.values(b).filter((v) => v >= 0.98).length} of 170.`);
}
