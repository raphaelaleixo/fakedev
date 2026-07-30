# A Fake Dev Goes to Amsterdam

*Revised spec. `decisions.md` holds the reasoning for each departure from the
original draft, and `cards.md` holds the two decks and the rules for adding to
them.*

## Theme & overview

A hidden-role party game for frontend developers, adapted from *A Fake Artist
Goes to New York* (Oink Games). Instead of drawing on a shared sheet of paper,
players build a UI component together, one code edit at a time. The TV shows the
DOM as it accumulates; each player's own device — phone or laptop — is a private
controller. Everyone knows what's being built except the **Chameleon**, who must
bluff through two turns without ever learning it.

**The goal is not to finish the component. It's to see who is working toward
it.** Rounds end half-built, and that is correct — the paper game's drawing is
usually a mess too. You are watching whether each move belongs.

## Player count

**4–10.** Seats are symmetric — no named roles, no asymmetric powers. Exactly one
Chameleon per round regardless of table size.

**There is no Question Master.** The app draws everything from decks and every
player plays every round. That removes a scoring role, hence the rebalanced
scoring below.

## The Secret is two things

A Secret is a **style** and a **component**:

> *Neumorphic* · *Toggle Switch*

Thirteen styles and fourteen components, so **182 Secrets from twenty-seven
authored items**. Both halves are hidden from the Chameleon; both are known to
every Dev.

This is the spine of the design and it earns three things at once:

- **Depth.** The style needs its own moves and the component needs its own, so
  no Secret is ever expressible in one declaration.
- **Variety.** *Brutalist Progress Bar* and *Neumorphic Progress Bar* are the
  same component and play nothing alike.
- **A real bluff.** The Chameleon has two things to be wrong about, and half a
  guess is worth something — see the steal.

**Nothing about the answer is public.** The big screen frames the round as
`style × component` so everyone knows the shape of what's being built, and
nothing more. This departs from the original draft, where a public Category
framed every round.

**No repeats within a match.** Styles and components are tracked separately, so
neither half ever recurs. Thirteen rounds are available before the styles run
out, which no match reaches.

## The base structure

Every round starts from the same blank slate:

```html
<div id="outer">
  <div id="inner"></div>
</div>
```

**Two divs, and nothing else is given.** No tags to pick, no attributes to set.
Everything on screen at the end was drawn with CSS.

That's deliberate. The moment a tag is a move, the *correct* answer at work
becomes the *worst* play here — the right way to build a radio button is
`<input type="radio">`, which would name the component out loud. Removing tags
removes the trap, and it leaves one vocabulary to think in.

**Text is a placement, not a sentence.** A text move drops a `<span>` holding a
fixed lorem ipsum — the same copy every time, so nobody can ever write their way
to a point or a giveaway. What the move buys is a *third element to style*:

```html
<div id="outer">
  <span id="outer-text">Lorem ipsum dolor sit</span>
  <div id="inner">
    <span id="inner-text">Lorem ipsum dolor sit</span>
  </div>
</div>
```

A span appears only once somebody has spent a turn on it, and from then on it's
a target like any other. Slot order is fixed, though a `flex-direction` edit
inverts it, which is a deliberately discoverable trick.

## A turn

Exactly **two full trips around the table** — `2 × N` turns.

Each turn does **one** of these, and never two:

| Move | |
|---|---|
| **name a property** | open it. Your turn ends here. |
| **give a value** | answer something open, or override something set |
| **add text** | bring this box's span into being |

**Naming a declaration is the whole turn.** `border-radius` says "this thing is
rounded" and commits to nothing else; somebody else decides what it becomes. So
the interesting decision each turn is whether to *answer another player's
opening* or *start your own* — the paper game's extend-a-stroke-or-start-fresh
tension, which a turn that did both would erase.

An open declaration shows on the inspector and stays out of the render until
somebody answers it. A declaration nobody ever answers is a fine way for a round
to end.

**Overrides** are unrestricted and cost one turn, since answering covers both.
Any player may override any value, including their own.

A **soft timer** runs on the TV each turn. Pure social pressure — nothing happens
when it expires.

## The canvas is code

The big screen shows the **DOM**, nested and indented. A blank round is two empty
divs; a played one is a component you can read.

```html
<div style={ display: flex; padding: 20px; border-radius: … }>
  <div style={ background-color: #1a73e8 /* #34a853 */ }>
    <span style={ color: #ffffff }>Lorem ipsum dolor sit</span>
  </div>
</div>
```

- Each edit is written **in its author's colour** — the name in the colour of
  whoever opened it, the value in the colour of whoever answered. `display: flex`
  is two people in six characters.
- An overridden value trails as a **comment** in its own author's colour. Nothing
  is ever removed.
- A colour value shows a **swatch**, so "who used the ugly green" stays a usable
  clue.
- An unanswered declaration shows the gap it left: `border-radius: …`.

**No render during the round.** Half the moves change nothing visually, and a
live render would make them look like no-ops while showing the least interesting
thing on screen. The render is the payoff, and it appears at resolution.

## Vote

After turn `2N` the TV counts down **3… 2… 1… Point!** Every controller shows the
player list. Everyone votes simultaneously, **including the Chameleon**, who
points to blend in exactly as the fake artist does. You cannot point at yourself.
Votes lock on submission and are revealed together.

The most-pointed player is **caught**. A tie for most-pointed means **nobody** is
caught and the Chameleon escapes.

## The steal, split across both axes

A caught Chameleon guesses **both halves** over the **full deck** — any of the
thirteen styles and any of the fourteen components, from a searchable dropdown.
One answer per axis, no second attempt.

*This replaces the slates of five this spec originally called for; the reasoning
is in `decisions.md`, along with the odds it costs.*

**They see the render while they guess.** This is the one place a controller
shows it, and it's what keeps the steal as fair as the paper game's, where the
fake guesses while looking at the finished drawing. The Devs still don't see it;
the TV holds the render for resolution.

## Scoring

| Outcome | Chameleon | Each correct voter |
|---|---|---|
| **escapes** — not caught, or the vote tied | **+2** | 0 |
| caught, **both axes** right | **+2** | 0 |
| caught, **one axis** right | **+1** | **+1** |
| caught, **neither** right | 0 | **+1** |

**Escaping and a perfect steal pay the same**, as they do in the paper game.
Both are simply "the Chameleon won this round" — the steal is a real second
chance rather than a discounted one, and being caught costs nothing so long as
you were paying attention.

**The gradient lives on the Chameleon's side** — 2, 2, 1, 0. Devs get a flat +1
whenever they catch a Chameleon who doesn't fully recover, which is exactly the
paper game's rule and needs no gradient of its own: the Devs can't influence the
steal, so paying them differently for its outcome would reward luck.

The middle rung is the point of splitting the steal: a Chameleon who read the
style off the board but never worked out the component gets *something*, and the
Devs who caught them still get their point. Nobody's round is wasted.

Only correct voters score, which is our one real departure from the paper game's
scoring — it pays every true artist equally. The app knows each individual vote,
so this rewards deduction rather than attendance; without it, nine of ten players
would gain a point most rounds and the race to 5 would be a formality.

The Chameleon's own vote never earns them anything.

## End of match

A **round** ends after the vote and any steal. A **match** ends the instant any
player reaches **5 points**, evaluated at end of round. If two or more cross
together the highest total wins; if still tied, they share it.

## Big screen (`/room/:id`)

**Lobby** — room code, join QR, players as a live DOM node, start at 4.

**During a round** — the turn rail with the active player and the soft timer, and
the DOM filling the rest of the screen.

**Vote** — the countdown, then who has locked in (never who they picked), then
every vote at once.

**Steal** — that the Chameleon is guessing. Never the guess itself.

**Resolution** — the Chameleon revealed **always**, both halves of the Secret
revealed, the render shown for the first time, points and the scoreboard.

**Match end** — not a screen of its own. The resolution holds, the winner is
named where the next-round button was, and a **New game** beside it opens a
fresh room. The scoreboard already on that screen is the final standings.
Nothing carries over: a new match is a new room, and everybody rejoins.

## Controller (`/room/:id/player/:playerId`)

`/room/:id/player` handles join and resume.

- **Persistent header** — the Secret's two halves, or `FAKE DEV` for the
  Chameleon. The only surface in the game where the Secret appears.
- **The Chameleon also sees both decks** — all thirteen styles and all fourteen
  components. That leaks nothing (the decks are public knowledge in any game
  you've played twice) and lets them pick a private hypothesis and play toward
  it consistently, instead of flailing.
- **Not your turn** — whose turn it is, and nothing else. No DOM mirror.
- **Your turn** — the move composer above.
- **Vote** — tap a player, confirm, locked.
- **Caught Chameleon only** — the render, and the two guesses.
- **Never shown** — other players' roles, other players' pending edits, or the
  DOM.

## Edge cases

- **Disconnect** — the seat is held by `playerId` in the URL. The round simply
  waits; the turn never advances. Needs no code.
- **Rejoin** — the same URL restores seat, role and Secret. The masthead's room
  code opens the QR and seat links from any screen.
- **Tie vote** — nobody is caught; the Chameleon escapes with +2.
- **Illegal moves** — a move can't be malformed: the target and move steps are
  closed sets, and a value has to pass `CSS.supports` before it can be
  committed. What is *not* constrained is the vocabulary — the property list
  comes from the browser and values can be free-form. See `decisions.md` on the
  whitelist question.
- **Writing the answer down** — impossible. Copy is fixed lorem ipsum; the only
  thing a text move decides is *where* a span exists.
- **Player leaves in lobby** — fine. Below 4, the match can't start.

## Vocabulary

**Chameleon** in the code, **Impostor** in the UI — the one place these
deliberately differ. Players get the word every table already knows; the domain
keeps `chameleonId` and `isChameleon`, because renaming a field that appears in
Firebase documents isn't worth the churn. Their controller reads `FAKE DEV`
either way. ·
**Devs** (everyone else) · **Contributors** (everyone taking turns, as the big
screen's sidebar labels them — *including* the Chameleon, so not a synonym for
Devs) · **Canvas** (the TV surface) · **Live Inspector** (the DOM pane) ·
**Render Window** (the resolution reveal) · **Commit** (one player edit) ·
**Style** and **Component** (the two halves of a Secret) · **Steal** (the caught
Chameleon's guess) · **Open** and **Answer** (the two halves of a declaration)

## Still open

- **Soft timer duration.** 30s, untested.
- **A third axis.** *States* could later become a second public modifier —
  "disabled" alongside the style — giving the Chameleon another safe channel.
  Held until a table has played the two-axis version.
- **Chameleon disconnects permanently.** The round is unwinnable. A host control
  to abort with no points is proposed, undecided.
- **i18n scope.** Styles, components and UI chrome need locales. HTML and CSS
  keys and values are English by nature and shouldn't be translated.
- **Digital-only extras** — round replay scrub, component export, haptics,
  end-of-match awards. Deferred until the loop has been played.
