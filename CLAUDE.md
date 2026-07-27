# A Fake Dev Goes to Amsterdam

A hidden-role party game adapted from *A Fake Artist Goes to New York*. Players
build one UI component together, one code edit per turn. The TV is the canvas —
a live render beside a live inspector. Everyone knows which component they're
building except the **Chameleon**, who bluffs through two turns without ever
learning the answer.

Full spec in `projectInfo/rules.md`, the 60-card deck in `projectInfo/cards.md`,
and every decision that extends or overrides the spec in
`projectInfo/decisions.md`. This file covers only what shapes day-to-day work.

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
  honestly be any card in its similarity group.
- **Never name a card in the UI.** Preset names, chip labels, placeholder copy —
  a control called `neumorphic` hands over a Design Eras card. Describe shapes,
  never eras or components.
- **Ambiguity is the feature, not a gap.** If a render looks under-specified,
  check whether that's actually a Dev playing well before "fixing" it.

The sharpest example is a text slot set to **lorem ipsum**. It commits to body
copy of a certain length without committing to what the copy says — structural
signal, no semantic leak.

But it is a *bet*, not a hedge, and this is the part that's easy to get wrong:
filling a text slot claims "this card has copy here," and for a good part of the
deck that claim is false. Skeleton Loader's whole sketch is "grey rounded bars,
**no content**". Progress Bar, Range Slider, Toggle Switch (Off), Focused Input,
Autofilled Input and Read-only Input want no text either. Lorem ipsum on any of
those is one of the loudest tells in the game.

So it cuts both ways. For a Dev it's a weak but real proof — it narrows the
category to cards that have copy. For a Chameleon it's a gamble on the Secret's
shape that can expose them outright.

The general form: **an empty slot is information too.** Ten turns of nobody
touching `{label}` says something specific about the Secret, and Dev restraint
is as much a signal as Dev action. Don't build anything that nudges players to
fill every slot.

## Domain model

**The append-only edit log is the only source of truth.** The render and the
inspector are both folds over it — last-write-wins per `(target, kind, key)`.
Superseded edits are never deleted; the inspector's strikethroughs and a
deferred replay feature both need the full history.

Four edit targets on a fixed base structure: `outer` and `inner` (elements),
`label` and `text` (text slots). Four edit kinds: `tag`, `attribute`, `style`,
`text`. `Edit` is a discriminated union so invalid combinations — a keyless
style edit, a tag on a text slot — are unrepresentable.

**Choosing the component is a turn.** Setting `inner` to `<button>` is a `tag`
edit that costs a player their whole turn, exactly like a CSS declaration.
Nothing about the structure is free.

Layout:

- `src/game/` — types, constants, and pure logic. No React.
  - `fold.ts` — log → render tree, log → inspector lines
  - `render.ts` — render tree → HTML for the sandboxed stage
  - `round.ts` — setup, turn loop, vote, steal, scoring
  - `match.ts` — match lifecycle and seat colors
  - `content/` — the deck and the key schema, authored content
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
