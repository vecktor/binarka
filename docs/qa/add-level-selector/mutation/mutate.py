import subprocess,sys,json,shutil
good='../play-page.good.ts'
muts={
 'hint ceiling 1': ("const h = hint(board, 4);","const h = hint(board);"),
 'no retry': ("if (error instanceof GenerationRunOutError) continue;","if (error instanceof GenerationRunOutError) return false;"),
 'retry any error': ("if (error instanceof GenerationRunOutError) continue;","continue;"),
 'retry wrong size too': ("      } catch {\n        return false;\n      }\n      size = requestedSize;","      } catch {\n        continue;\n      }\n      size = requestedSize;"),
 'unavail level closes sheet': ("if (button.getAttribute('aria-disabled') === 'true') return;","if (button.getAttribute('aria-disabled') === 'true') { closeSheet(); return; }"),
 'no focus after cancel': ("    pending = null;\n    dialog.close();\n    if (fromSheet) summary.focus();\n  });\n  dialog.addEventListener","    pending = null;\n    dialog.close();\n  });\n  dialog.addEventListener"),
 'sheet not closed before dialog': ("    if (fromSheet) sheet.hidePopover();\n    if (!dialog","    if (!dialog"),
 'level kept at 4x4': ("newPuzzle(n, n === 4 ? 1 : level)","newPuzzle(n, level)"),
 'level reset on size 8': ("newPuzzle(n, n === 4 ? 1 : level)","newPuzzle(n, n === 6 ? level : 1)"),
 'toggle always focus': ("if (dialog.hasAttribute('open') || isPopoverOpen(rulesPanel)) return;","if (dialog.hasAttribute('open')) return;"),
 'toggle ignores dialog': ("if (dialog.hasAttribute('open') || isPopoverOpen(rulesPanel)) return;","if (isPopoverOpen(rulesPanel)) return;"),
 'summary not synced on reset-free': ("    summaryText.textContent = `${size}×${size}${SETUP.sep}${LEVELS[level - 1]?.name ?? ''}`;","    summaryText.textContent = `${size}×${size}${SETUP.sep}${LEVELS[0]?.name ?? ''}`;"),
 'reason always shown': ("levelReason.hidden = size !== 4;","levelReason.hidden = false;"),
 'disabled attr instead': ("button.setAttribute('aria-disabled', 'true');","button.setAttribute('disabled', '');"),
 'shown level not closing': ("      if (l === level && board.length > 0) {\n        closeSheet();\n        return;\n      }","      if (l === level && board.length > 0) {\n        return;\n      }"),
 'seed per call twice': ("puzzle = makePuzzle(requestedSize, seedSource(), requestedLevel);","seedSource(); puzzle = makePuzzle(requestedSize, seedSource(), requestedLevel);"),
 'techniques have aria-hidden': ("techniques.append(el('h3', {}, TECHNIQUES.heading), techniquesList);","techniques.append(el('h3', {}, TECHNIQUES.heading), techniquesList); techniquesList.setAttribute('aria-hidden','true');"),
 'new puzzle resets level': ("if (newPuzzle(size, level)) {","if (newPuzzle(size, 1)) {"),
}
sel=sys.argv[1:] or list(muts)
for name in sel:
    old,new=muts[name]
    s=open(good,encoding='utf8').read()
    if old not in s:
        print('MUTATION NOT APPLICABLE',name); continue
    open('src/ui/play-page.ts','w',encoding='utf8').write(s.replace(old,new,1))
    subprocess.run(['npx','vitest','run','play-page-','ui-strings','--reporter=json','--outputFile=../mut.json'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    d=json.load(open('../mut.json'))
    fails=[(f['name'].split('/')[-1],t['title'][:70]) for f in d['testResults'] for t in f['assertionResults'] if t['status']=='failed']
    print(f'{name}: {len(fails)} failing', '' if fails else '  <<< SURVIVED')
    for f in fails[:4]: print('     ',f)
shutil.copy(good,'src/ui/play-page.ts')
