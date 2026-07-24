# Implementation kickoff — A Fake Dev Goes to Amsterdam

You're starting implementation of **A Fake Dev Goes to Amsterdam**. Read `projectInfo/rules.md` first — it's the full spec and this prompt does not repeat it. `projectInfo/cards.md` holds the 60-card deck and the two screening rules any new card must pass.

The parent `Projects/CLAUDE.md` is auto-loaded and applies in full: big screen + phones, the standard route shape, Vite + React 19 + TS, MUI, i18next, Vercel static SPA. One rule bears restating because it will be tempting to break here: **`react-gameroom` is the user's library — never work around it.** This game needs server-authoritative randomness, per-player private state (each phone holds the Secret, one holds `FAKE DEV`), simultaneous locked voting, and a pause-on-disconnect turn loop. If any of those can't be met cleanly by the current API, **stop and propose a library change** — shape, rationale, call sites — and wait. Do not build a consumer-side workaround.

## Non-obvious decisions already made

These were settled during brainstorming and are contractual — don't re-litigate them:

- **No Question Master.** The paper game's QM is fully automated away. This is why the scoring is rebalanced (Chameleon +3, and only *correct voters* score +1) rather than paper-faithful.
- **The base structure has two text slots, not one** — `{label}` in `outer` and `{text}` in `inner`, giving four edit targets. This was audited card-by-card (`projectInfo/structure-audit.md`); with a single slot, 16 of 60 cards were degraded or impossible and the Web Annoyances cards collapsed into each other. Don't "simplify" back to one.
- **The edit log is append-only.** The render is a fold over it, last-write-wins per `(target, kind, key)`. Superseded edits are never deleted — the inspector's strikethroughs and a deferred replay feature both depend on the full history.
- **Phones never mirror the render or the inspector.** Pure controllers. This is deliberate party-game design, not an unfinished feature.
- **Key input is must-match autocomplete; values use a typed editor per key** (enum → chips, color → fixed ~12 swatches, length → stepper + units, boolean → no value step, freetext → capped field). An invalid value must be unsubmittable, because a typo renders nothing and is indistinguishable from a deliberately vague play.
- **The text node is free text, uncapped in content and capped only at ~24 chars for layout.** No word filter. Spelling out the Secret is self-defeating and the game polices itself.
- **A tie vote means the Chameleon escapes.** Line authorship is shown live on the inspector, not just at resolution.
- **The steal shows a 5-card slate, not the whole category.** Categories hold 15 cards; the caught Chameleon sees the true Secret plus 4 decoys, drawn server-side at steal time. Deck depth and steal difficulty are deliberately decoupled — don't "simplify" this by showing the full category.
- **Style references live on Devs' phones, never the TV.** Any big-screen reference leaks either the answer or the candidate list to the Chameleon.

## Suggested starting order

1. **Domain types** — `src/game/types.ts` from the Components section: `Category`, `Secret`, `Edit`, `Vote`, `KeySchema`, round and match state. Get the edit-log-fold model right before anything else; everything downstream is a projection of it.
2. **Lobby** — wire `RoomPage`'s lobby with `react-gameroom` before any game logic. Join, seats, colors, start at 4+.
3. **State machine + big screen** — round setup, turn loop, vote, resolution, scoring. Build the split canvas (Render Window + Live Inspector) against `MockBigScreen` so it can be developed without two devices.
4. **Phone controller** — `PlayerPage` last. It's just a controller over state that already works.

The key schema and the secret decks are real content, not config — budget for them like you would the decks.

**Stop and confirm the domain types with me before writing any UI.**
