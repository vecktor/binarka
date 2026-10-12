import fs from 'node:fs';
const [base, delta, out] = process.argv.slice(2);
const split = (txt) => { // returns blocks keyed by requirement name with ranges
  const lines = txt.split('\n'); const blocks = []; let cur = null;
  lines.forEach((l, i) => {
    if (l.startsWith('### Requirement: ')) { if (cur) { cur.end = i; blocks.push(cur); } cur = { name: l.slice(17).trim(), start: i }; }
    else if (/^## /.test(l) && cur) { cur.end = i; blocks.push(cur); cur = null; }
  });
  if (cur) { cur.end = lines.length; blocks.push(cur); }
  return { lines, blocks };
};
const B = split(fs.readFileSync(base, 'utf8'));
const Dtxt = fs.readFileSync(delta, 'utf8');
const D = split(Dtxt);
const addedStart = D.lines.findIndex((l) => l.startsWith('## ADDED'));
const mod = D.blocks.filter((b) => b.start < addedStart), add = D.blocks.filter((b) => b.start > addedStart);
let lines = [...B.lines];
for (const m of mod.sort((a, b) => 0)) {
  const tgt = split(lines.join('\n')).blocks.find((b) => b.name === m.name);
  if (!tgt) { console.log('MISSING baseline', m.name); continue; }
  lines.splice(tgt.start, tgt.end - tgt.start, ...D.lines.slice(m.start, m.end));
  console.log('replaced', m.name);
}
const excl = lines.findIndex((l) => l.startsWith('## Exclusions'));
for (const a of add) { if (split(lines.join('\n')).blocks.some(b=>b.name===a.name)) console.log('ADDED already exists', a.name); lines.splice(excl, 0, ...D.lines.slice(a.start, a.end)); console.log('added', a.name); }
fs.writeFileSync(out, lines.join('\n'));
