// Wave-2 prep, 2026-10-12: WCAG 2 contrast (the formula of tests/helpers/css.ts) for the dialog's and the segmented options' pairs,
// from the A-57 literals, and the OQ-1 B candidate frame colours. Run: node docs/qa/prep-g2-wave2/contrast.mjs > docs/qa/prep-g2-wave2/contrast.txt
const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]};
const r=(a,b)=>{const x=L(a),y=L(b);return ((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)).toFixed(2)};
const T={light:{ink:'#8f1d17',vbg:'#fbe4e1',vb:'#b3261e',sr:'#fffdf8',focus:'#1e2126',prim:'#b4460d',soft:'#f6e3d4',cbg:'#fffdf8',text:'#1e2126',muted:'#5f5549',cb:'#8c8374',ptext:'#fffdf8',given:'#ddd3be'},
dark:{ink:'#ffb4ab',vbg:'#3f2320',vb:'#ff8a7d',sr:'#2c2620',focus:'#f1ede4',prim:'#f39a5b',soft:'#3d2b1e',cbg:'#24201b',text:'#f1ede4',muted:'#b8b0a4',cb:'#8a7f71',ptext:'#1a1007',given:'#4d4438'}};
for(const [k,t] of Object.entries(T)){console.log(k,
'violink/vbg',r(t.ink,t.vbg),'violink/sr',r(t.ink,t.sr),'vborder/sr',r(t.vb,t.sr),'vborder/vbg',r(t.vb,t.vbg),'focus/vbg',r(t.focus,t.vbg),
'| focus/prim',r(t.focus,t.prim),'focus/cbg',r(t.focus,t.cbg),'focus/soft',r(t.focus,t.soft),'focus/sr',r(t.focus,t.sr),
'| muted/cbg',r(t.muted,t.cbg),'muted/sr',r(t.muted,t.sr),'text/soft',r(t.text,t.soft),'prim/soft',r(t.prim,t.soft),'prim/cbg',r(t.prim,t.cbg),'prim/sr',r(t.prim,t.sr),'cb/cbg',r(t.cb,t.cbg),'cb/sr',r(t.cb,t.sr),'ptext/prim',r(t.ptext,t.prim),'focus/given',r(t.focus,t.given))}
// candidate frame: needs >=3 vs focus and >=3 vs soft fill and card
for (const c of ['#c75a1c','#cf6420','#d06a28','#c4581a']) console.log('light cand',c,'vs focus',r(c,'#1e2126'),'vs soft',r(c,'#f6e3d4'),'vs card',r(c,'#fffdf8'));
for (const c of ['#b0632c','#a85a24','#9c5222','#b86a30']) console.log('dark cand',c,'vs focus',r(c,'#f1ede4'),'vs soft',r(c,'#3d2b1e'),'vs card',r(c,'#24201b'));
