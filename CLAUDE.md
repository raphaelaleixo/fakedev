# A Fake Dev Goes to Amsterdam

A hidden-role party game adapted from *A Fake Artist Goes to New York*. Players
build one UI component together, one code edit per turn. The TV shows the DOM as
it accumulates; laptops are private controllers. Everyone knows what's being
built except the **Chameleon**, who bluffs through two turns without ever
learning it.

Full spec in `projectInfo/rules.md`, the two decks in `projectInfo/cards.md`, and
every decision that extends or overrides the spec in `projectInfo/decisions.md`.
This file covers only what shapes day-to-day work.

## The goal is not to finish the component

**It's to see who is working toward it.** Everything else follows from this, and
it is easy to reason your way past — I did, and built an argument for scaling
turns to table size before being corrected.

The paper game's drawing is usually a mess. Nobody is trying to complete a
picture; you're watching whether each stroke belongs. So the number that matters
is *turns per player* — two, always, unchanged by table size — not declarations
per component. A round that ends with a half-built thing and one unanswered
question is a round that worked.

Consequences:

- **A turn opens a declaration or answers one, never both.** Naming
  `border-radius` is intent with no execution and ends your turn; somebody else
  decides what it becomes. The interesting choice each turn is whether to answer
  another player's opening or start your own — the paper game's
  extend-a-stroke-or-start-fresh tension.
- **The canvas shows code, not the render.** Half the moves change nothing
  visually, and a live render would make them look like no-ops while displaying
  the least interesting thing on screen. The render is the payoff and lands at
  resolution, beside the Chameleon and the Secret.
- **Don't add anything that measures completion.** No progress meters, no
  "unset" counts, no nudges toward filling things in.

## The central design tension

**A good board makes sense but is not immediately recognizable.**

This is the constraint every content and UI decision answers to. A Dev has to
prove they know the Secret *without making it obvious enough for the Chameleon
to name it*. A render that reads instantly as one specific card is a board where
the Devs have already thrown the round — spelling out the answer wins you the
vote and loses you the game in both scoring branches.

Consequences that are easy to get wrong:

- **Fixtures and examples must model good play.** A mock whose label reads "We
  value your privacy" is a cartoon, not a game state, and it will teach you the
  wrong thing about whether the canvas works. Aim for a board that could
  honestly be many Secrets at once.
- **Never name a card in the UI.** Preset names, chip labels, placeholder copy —
  a control called `neumorphic` hands over half the answer. Describe shapes,
  never styles or components.
- **Ambiguity is the feature, not a gap.** If a render looks under-specified,
  check whether that's actually a Dev playing well before "fixing" it.

The sharpest example is the **text move**. The copy is always the same lorem
ipsum, so the move says nothing about *what* the component reads — only that it
has copy at all, and where.

That is a *bet*, not a hedge, and it's the part that's easy to get wrong.
Claiming "this component has copy here" is false for a good part of the deck:
Progress Bar's sketch ends "no copy at all", and Range Slider, Toggle Switch and
Notification Badge want none either. A span on any of those is one of the
loudest tells in the game.

So it cuts both ways. For a Dev it's a weak but real proof — it narrows the deck
to components that have copy. For a Chameleon it's a gamble on the Secret's shape
that can expose them outright.

The general form: **an absent span is information too.** Ten turns of nobody
adding text says something specific about the Secret, and Dev restraint is as
much a signal as Dev action. Don't build anything that nudges players to fill
the board.

## A Secret is two things

**A style and a component** — *Neumorphic · Toggle Switch*. Thirteen styles and
fourteen components, so 182 Secrets from twenty-seven authored items, and
**nothing about the answer is public**. The big screen names only the shape of it, `style × component`.

That pairing is load-bearing three times over. It guarantees **depth**, since
each half needs its own moves and no Secret is one declaration. It gives
**variety**, since the same component plays nothing alike in two styles. And it
makes the steal splittable, so a caught Chameleon can be **half right**.

Neither half repeats within a match — the two used pools are tracked separately.

The six screening rules any new card must pass are in `projectInfo/cards.md`.
The one that cut a whole category is the **lorem ipsum test**: if it doesn't read
with meaningless copy in it, it isn't a card — and since the copy *is* fixed
lorem, that's a constraint the engine enforces rather than a habit players keep.

## Domain model

**The append-only edit log is the only source of truth.** The render and the
inspector are both folds over it — last-write-wins per `(target, kind, key)`.
Superseded edits are never deleted; the inspector's strikethroughs and a
deferred replay feature both need the full history.

**The moves are CSS and nothing else.** The base structure is two divs, fixed;
there are no tags to choose and no attributes to set. That's a game decision
before it's a technical one — the *correct* answer at work is the *worst* play
here, since the right way to build a radio button is `<input type="radio">`,
which names the component out loud. One vocabulary, no trap.

Four edit targets: `outer` and `inner` (the boxes) and `outer-text` /
`inner-text` (the spans). Two edit kinds: `style` and `text`. `Edit` is a
discriminated union, so a keyless style edit or a text move on a span is
unrepresentable.

**A text move is a placement, not a sentence.** It drops a span holding the fixed
`LOREM`, which is why it carries no value. The composer asks for a box and maps
it through `TEXT_OF`; what the player buys is a *third element to style*, so a
span only becomes a target once somebody has spent a turn on it —
`availableTargets` is a fold over the log, not a constant.

The inspector draws **the actual DOM**, nested and indented — a blank round is
two empty divs, a played one is a component you can read top to bottom. Nesting
is real information and no list of edits shows it.

**Every edit is written in its author's colour.** That makes who-wrote-what the
thing you read first, which is the game-relevant question — only the punctuation
stays muted, so `property: value;` survives as a shape. Seat colours are tuned
to carry text against `ink`, which is possible because the app is dark
throughout and they never appear on a light surface.

**A declaration is one line carrying two people** — the name in the colour of
whoever opened it, the value in the colour of whoever answered. Nothing is ever
removed: an overridden value trails as a `/* comment */` in its own author's
colour, which costs no line and reads better than a strikethrough.

`outer-text` and `inner-text` are named for *position*, deliberately — not
`label` or `caption`. A semantic name would be a lie the engine can't back up,
since the copy is the same lorem in both.

Layout:

- `src/game/` — types, constants, and pure logic. No React.
  - `fold.ts` — log → render tree, log → inspector lines
  - `render.ts` — render tree → HTML for the sandboxed stage
  - `round.ts` — setup, turn loop, vote, steal, scoring
  - `match.ts` — match lifecycle and seat colors
  - `content/deck.ts` — the two decks: thirteen styles, fourteen components
  - `content/keySchema.ts` — composer suggestions, not a whitelist
- `src/components/canvas/` — the big screen during a round
- `src/mocks/fixtures.ts` — the board the canvas is developed against

## Vocabulary

Use these in code and UI; don't invent synonyms.

**Chameleon** (the hidden role; their controller reads `FAKE DEV`) ·
**Devs** (everyone else) · **Canvas** (the TV surface) · **Render Window** ·
**Live Inspector** · **Commit** (one player edit) · **Category** (public) ·
**Secret** (the component being built) · **Steal** (the caught Chameleon's guess)

## Things that will surprise you

- **No privacy.** One shared `game` node; every client holds the Secret and the
  Chameleon's identity. Hidden info is hidden by what each surface *renders*.
  Deliberate — see `decisions.md`.
- **CSS is not whitelisted.** The property list comes from the browser at
  runtime and values are gated on `CSS.supports`. `content/keySchema.ts` is
  *suggestions* for the composer's chips, not a gate.
- **The stage is an iframe with an empty `sandbox`.** That's what makes
  free-form values safe. There is no value blacklist and there shouldn't be one.
- **The big screen is the authority.** It draws Category, Secret, Chameleon and
  starting player, advances phases and resolves. Controllers write only their
  own edit, vote and steal.
- **Disconnects need no code.** The turn simply never advances.
