# Probe requirements file for the check:vision red run

The two held rows with the pending tag dropped, as they will read in `docs/requirements.md` after the move (signed wording, `docs/requirements-held.md`). Read only by `node scripts/check-vision.mjs --requirements docs/qa/vision-probe/requirements-probe.md`.

| ID | Phase | Area | Description | Verification |
|---|---|---|---|---|
| NFR-11 | MVP | Usability | A violation, a given, a player entry and the hinted cell each differ from the others by a cue that is not colour alone. | verify: vision-verify |
| NFR-15 | MVP | Usability | The logo is legible at 40 px. | verify: vision-verify |
