# A Fake Dev Goes to Amsterdam

## Theme & overview

A hidden-role party game for frontend developers, adapted from *A Fake Artist Goes to New York* (Oink Games). Instead of drawing on a shared sheet of paper, players collaboratively build a UI component one code edit at a time. The TV is the canvas — a live render of the component beside a live inspector showing the code as it accumulates. Phones are private controllers. Everyone knows which component they're building except the **Chameleon**, who must bluff their way through two turns without ever learning the answer. The Devs face the original game's core tension, translated: prove you know the secret without making it so obvious that the Chameleon can name it.

## Player count

**4–10.** Seats are symmetric — no named roles, no asymmetric powers. Exactly one Chameleon per round regardless of table size.

**Deliberate deviation from the paper game: there is no Question Master.** In the physical version a rotating player picks the category and secret, sits out the drawing, and scores 2 points whenever the fake wins. Here the app draws both from decks and every player draws every round. This removes a human RNG that a deck does the job of, but it also deletes a scoring role — hence the rebalanced scoring below.

## Components

- **Category deck** — exactly four: `Form States`, `Design Eras`, `Web Annoyances`, `Everyday Components`.
- **Secret deck** — each Category holds **15** Secrets. **60 cards total.** Shape: `Category { id, label, secrets: Secret[] }`. Full content and screening rules in **`cards.md`**.
- **Style reference** — an optional visual thumbnail per Secret, shown only on Devs' phones. Needed most by `Design Eras`, where a player who can't picture "Neumorphic" can't signal it. Never shown on the TV and never to the Chameleon.
- **Base structure** — every round starts from the same blank slate:
  ```html
  <ComponentA id="outer">
    {label}
    <ComponentB id="inner">
      {text}
    </ComponentB>
  </ComponentA>
  ```
  **Two text slots, not one.** `{label}` sits in `outer` before `inner`; `{text}` sits inside `inner`. This is deliberate and load-bearing: most real UI is *a control plus a label* — body copy plus a button, a checkbox plus "I'm not a robot", a field plus its error. With a single text slot trapped inside `inner`, every such card could only ever render half of itself, and worse, they degraded toward each other until Devs could no longer signal which one they were on. See `structure-audit.md`. Slot order is fixed, though a `flex-direction` edit on `outer` inverts it — a deliberately discoverable trick.
- **Edit log** — append-only, ordered. `Edit { id, playerId, turnIndex, target: 'outer' | 'label' | 'inner' | 'text', kind: 'tag' | 'attribute' | 'style', key: string | null, value: string }`. The rendered component is a left fold over this log, last-write-wins per `(target, kind, key)`. **Superseded edits are never deleted** — the inspector needs them to draw strikethroughs, and the deferred replay feature needs the full history.
- **Key schema** — the authored content that drives the phone's editors. Per key: `{ key, kind, valueType: 'enum' | 'color' | 'length' | 'boolean' | 'freetext', options?: string[], units?: string[] }`. This is game content on par with the secret decks, not incidental config.
- **Color palette** — a fixed set of ~12 swatches. A direct port of the physical box's 12 color pens, and it keeps "who used the ugly green" a usable clue.
- **Votes** — `Vote { voterId, suspectId }`. Exactly one per player, including the Chameleon.
- **Scores** — points per player, persisting across rounds within a match.

## Setup (per round)

1. Server picks a Category and displays it on the TV. Everyone sees it.
2. Server picks one Secret from that Category. Never displayed on the TV until resolution.
3. Server assigns exactly one Chameleon at random.
4. Every phone shows the Secret. The Chameleon's phone shows `FAKE DEV` instead.
5. Server picks the starting player at random. Turn order follows seat order from there.

All randomness — Category, Secret, Chameleon, starting player — is **server-authoritative**. No client-side shuffling; every client must agree, and the Chameleon's own client must never hold the Secret.

## Turn / round flow

Exactly **two full trips around the table** — `2 × N` turns for `N` players. A 4-player round is 8 edits, a 10-player round is 20.

Each turn, the active player composes exactly one edit on their phone:

1. **Target** — Outer / Label / Inner / Text.
2. **Type** — Tag / Attribute / CSS. (The two text targets, `Label` and `Text`, skip straight to a value.)
3. **Key** — must-match autocomplete over the whitelist for that type. Type to filter, tap a suggestion to commit; nothing invalid can be submitted. Boolean attributes (`disabled`, `checked`, `required`) skip step 4.
4. **Value** — the key's declared `valueType` picks the editor: chips for enums, swatches for colors, stepper + unit toggle for lengths, a capped text field for free text.

On commit the TV updates the render and the inspector immediately.

**Overrides** are unrestricted: any player may overwrite any key, including one they set themselves. The superseded line stays in the inspector with a strikethrough. An override consumes your turn like any other edit.

A **soft timer** runs on the TV each turn. It is pure social pressure — nothing happens when it expires, no auto-play, no forfeit.

## Vote

After turn `2N` the TV counts down **3… 2… 1… Point!** Every phone shows the player list. Everyone votes simultaneously, **including the Chameleon** (who votes to blend in, exactly as the fake artist points in the paper game). Votes lock on submission and are revealed together on the TV.

The most-pointed player is **caught**. A tie for most-pointed means **nobody** is caught.

## End-game trigger

A **round** ends after the vote and any steal attempt. A **match** ends the instant any player reaches **5 points**, evaluated at end of round. If two or more players cross 5 in the same round, the highest total wins; if still tied, they share the win.

## Scoring

- **Chameleon not caught** (most-pointed player isn't them, *or* the vote tied) → **Chameleon +3**. Nobody else scores.
- **Chameleon caught** → their phone shows a **5-card slate** drawn from this round's Category — the true Secret plus 4 decoys — as multiple choice. One answer, no second attempt. The slate is drawn server-side at steal time, not at round setup, and the true Secret's position is randomized.
  - **Correct** → **Chameleon +3**. Nobody else scores.
  - **Wrong** → **+1 to every player who voted for the Chameleon**. Everyone else, including Devs who voted wrong, scores 0.

Notes on the deviations from paper scoring, both consequences of removing the QM:

- The Chameleon earns **3**, not the paper's 2. They no longer split a payout with a partner, and with up to 10 players you're only the Chameleon about one round in N — a successful bluff should be a real leap toward 5.
- **Only correct voters score**, where the paper game pays every artist equally. The app knows each individual vote, so this rewards deduction instead of attendance. Without it, 9 of 10 players would gain a point most rounds and the race to 5 would be a formality.
- The Chameleon's own vote never earns them anything.

## Big-screen view contract (`/room/:id`)

**Lobby** — room code, join QR, player list with colors, start control (enabled at 4 players).

**During a round**
- The **Category**, always. The Secret, never.
- Turn order rail with the active player highlighted, and the soft countdown.
- **Split canvas**, the heart of the screen:
  - **Render Window** — the live visual output of the component.
  - **Live Inspector** — stylized code editor, updating in real time, each line tinted with its author's color, superseded lines struck through.
- Line authorship is shown **live**, not just at resolution. This is faithful: at a physical table you watch who picks up which pen.

**Vote phase** — the 3-2-1 countdown, then all votes revealed at once as arrows or tallies.

**Resolution** — the Chameleon revealed (**always**, caught or not), the Secret revealed, the steal guess if one happened, points awarded, running scoreboard.

**Match end** — winner, final standings.

## Phone view contract (`/room/:id/player/:playerId`)

`/room/:id/player` handles join and resume; it detects state and redirects to the seat.

- **Persistent header** — the Secret, or `FAKE DEV` for the Chameleon. This is the only surface in the entire game where the Secret appears.
- **Style reference** — Devs only, beside the Secret: a thumbnail of what the card should read as. Deliberately *not* on the big screen. A TV-side reference would either show this round's era outright or expose the full candidate list, and either way the Chameleon spends the round narrowing among known options — information the paper game never grants the fake.
- **Not your turn** — whose turn it is, and nothing else. **No render mirror, no inspector.** The phone is a pure controller; heads stay up and the TV stays the social center.
- **Your turn** — the four-step composer above.
- **Vote phase** — tap a player, confirm, locked.
- **Caught Chameleon only** — the multiple-choice steal.
- **Never shown** — other players' roles, the render, the inspector, other players' pending edits.

**Hidden-info reveal moments:** the Secret and the Chameleon's identity both become public on the TV at resolution, and nowhere earlier.

## Edge cases

- **Disconnect** — the seat is held, keyed by `playerId` in the URL. Play continues normally; if it reaches the missing player's turn, the TV shows "Waiting for {name}" and the round pauses indefinitely. The soft timer keeps animating but still does nothing. In practice a "disconnect" here is a locked screen and the player is standing right there.
- **Rejoin** — returning to the same `/player/:playerId` URL restores the seat, role, and Secret.
- **Tie vote** — Chameleon escapes and scores 3.
- **Illegal moves** — impossible by construction. Every step of the composer is constrained to a valid set.
- **Text length** — both `{label}` and `{text}` capped at ~24 characters. This is a *layout* constraint so a long string doesn't blow up the render, not an anti-cheat measure. Spelling out the Secret is self-defeating: it proves you're not the Chameleon while handing them the win in both branches, so the incentive structure polices itself exactly as it does on paper.
- **Player leaves in lobby** — fine. Below 4, the match can't start.
- **Secret repeats** — within a match, exclude already-used Secrets from selection.

## Naming / vocabulary

Public-facing labels, so they aren't re-invented in code:

- **Chameleon** — the hidden role. The phone's role card reads **`FAKE DEV`**.
- **Devs** — everyone else. *(The pitch called them "Artists", inherited from the source game; "Devs" fits the theme. Flagged below.)*
- **Canvas** — the TV surface as a whole.
- **Render Window** — the live visual output pane.
- **Live Inspector** — the live code pane.
- **Commit** — a single player edit.
- **Category** — the public grouping shown on the TV.
- **Secret** — the specific component being built.
- **Steal** — the caught Chameleon's multiple-choice guess.

## Open design decisions

- **"Devs" vs. "Artists"** for the non-Chameleon players. `rules.md` uses Devs for theme consistency; the pitch said Artists. Needs a call.
- **CSS property whitelist scope.** Must-match autocomplete makes a broad list viable in a way a dropdown wouldn't — but how broad? ~25 curated high-impact properties, or ~60 covering most of what a dev would reach for?
- **Key schema content.** The full authored set of tags, attributes, and CSS properties with their value types. Sizeable content task; treat it like the secret decks.
- **Soft timer duration.** Suggested 30s, untested.
- **Palette** — exact count and the 12 colors. They need to be distinguishable both as UI accents in the inspector and as actual CSS values in the render.
- **Chameleon disconnects permanently.** The round is unwinnable as specified. Proposal: a host control on the TV to abort the round with no points awarded. Not decided.
- **i18n scope.** HTML/CSS keys and values are English by nature and shouldn't be translated. Only Categories, Secrets, and UI chrome need locale files. Worth stating explicitly so nobody tries to localize `display: flex`.
- **Does the starting player rotate** between rounds, or is it re-randomized each time?
- **Decoy selection for the steal slate.** Four decoys drawn uniformly at random will sometimes be obviously wrong given the canvas — if the Secret is `Progress Bar` and a decoy is `Empty State`, the Chameleon eliminates it instantly and the effective odds climb well above the intended 20%. Tagging cards with similarity groups and drawing decoys from the same group would hold the floor, at the cost of hand-tagging 60 cards. Not decided.
- **Style-reference placement.** Written above as Devs-phone-only, which is a change from the "big screen" framing it was chosen under. The reasoning is in the phone view contract; overrule if the TV placement was the point.
- **Style-reference scope.** Needed for all 60 cards, or only `Design Eras`? The other three categories are mostly self-explanatory from the label, and authoring 60 thumbnails is a real content cost.
- **Digital-only extras** — round replay scrub, component export/share, haptics + sound, end-of-match awards. All deliberately deferred until the core loop is playable; recorded outside this doc so they aren't lost.
