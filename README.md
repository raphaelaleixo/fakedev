# A Fake Dev Goes to Amsterdam

**Build a component together. One of you has no idea what it is.**

A hidden-role party game for people who write CSS, adapted from *A Fake Artist
Goes to New York* (Oink Games). Everyone at the table is building the same UI
component, one CSS declaration per turn, on a shared screen. Everyone knows what
it is — except the **Chameleon**, who has to bluff through two turns without ever
finding out.

▶︎ **[fakedev.ludoratory.com](https://fakedev.ludoratory.com/)** — 4 to 10 players,
one big screen plus a phone or laptop each.

## How a round goes

Every round starts from the same blank slate, and nothing else is given:

```html
<div id="outer">
  <div id="inner"></div>
</div>
```

The Secret is a **style** and a **component** — *Neumorphic · Toggle Switch*.
Thirteen styles, fourteen components, so 182 Secrets, and the big screen names
only the shape of it: `style × component`.

Play goes twice around the table. Each turn does exactly one thing:

| Move | |
|---|---|
| **name a property** | open it — `border-radius: …` — and your turn is over |
| **give a value** | answer somebody's open declaration, or override a set one |
| **add text** | drop a `<span>` of lorem into a box, buying a third thing to style |

Naming a property is the *whole* turn. `border-radius` says "this thing is
rounded" and commits to nothing else; somebody else decides what it becomes. So
the real choice each turn is whether to answer another player's opening or start
your own.

The big screen shows the **DOM as it accumulates** — nested, indented, and every
edit written in its author's colour, so `display: flex` is two people in six
characters. There is no live render: half the moves change nothing visually, and
the render is the payoff. It lands at resolution, next to the Chameleon and the
Secret.

Then everyone points at once. The most-pointed player is caught; a tie and the
Chameleon walks. A caught Chameleon gets one guess at each half of the Secret —
over the full deck, looking at the render, the way the fake artist guesses with
the drawing on the table. First to 5 points wins the match.

Full rules are at [`/how-to-play`](https://fakedev.ludoratory.com/how-to-play),
and in [`projectInfo/rules.md`](projectInfo/rules.md).

## The goal is not to finish the component

It's to see who is working toward it. Rounds end half-built with one unanswered
question hanging, and that is a round that worked — the paper game's drawing is
usually a mess too. Nothing in here measures completion, on purpose.

The constraint every design decision answers to: **a good board makes sense but
is not immediately recognizable.** A Dev has to prove they know the Secret
without making it obvious enough for the Chameleon to steal it. A render that
reads instantly as one specific card is a round the Devs already threw.

## Run it locally

```sh
git clone git@github.com:raphaelaleixo/fakedev.git
cd fakedev
npm install
cp .env.example .env   # then fill in your Firebase Realtime Database values
npm run dev
```

`dev` runs `vite --host` — you need the LAN address to open a controller on
another device on the same Wi-Fi.

| | |
|---|---|
| `npm run dev` | Vite, exposed on the network |
| `npm test` | Vitest once · `npm run test:watch` to stay in it |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint |
| `npm run icons` | rebuild the PNG favicons from `favicon.svg` |
| `npm run og` | regenerate the share card from the cover |

**Developing without four devices.** Three routes exist only in dev:
`/mock/big-screen/:id` drives the canvas off a fixture board, `/mock/controller`
gives you the composer with no room, and `/mock/diag` is the diagnostics page.

## The code

`src/game/` is the whole game as pure functions — no React, all of it tested.

| | |
|---|---|
| `types.ts` · `constants.ts` | the domain, and every tunable number |
| `fold.ts` | the edit log → the render tree, and → the inspector's lines |
| `render.ts` | render tree → HTML for the sandboxed stage |
| `round.ts` · `match.ts` | setup, turn loop, vote, steal, scoring, seat colours |
| `composer.ts` · `css.ts` · `suggest.ts` | the move composer, and CSS validation |
| `content/deck.ts` | the two decks — thirteen styles, fourteen components |

Around it: `src/components/canvas/` is the big screen during a round,
`src/components/controller/` is a player's own device, `src/pages/` holds one file
per route, and `src/mocks/fixtures.ts` is the board the canvas is developed
against.

Four things explain most of the rest:

- **The append-only edit log is the only source of truth.** The render and the
  inspector are both folds over it, last-write-wins per `(target, kind, key)`.
  Superseded edits are never deleted — the inspector trails them as comments in
  their own author's colour, and a replay feature will want the history.
- **The moves are CSS and nothing else.** No tags, no attributes. That's a game
  decision before a technical one: the moment a tag is a move, the *correct*
  answer at work becomes the *worst* play here, because the right way to build a
  radio button is `<input type="radio">`, which names the component out loud.
- **CSS is not whitelisted.** The property list comes from the browser at
  runtime and values are gated on `CSS.supports`. What makes free-form values
  safe is that the render stage is an iframe with an empty `sandbox` — so there
  is no value blacklist, and there shouldn't be one.
- **There is no private state.** One shared `game` node; every client holds the
  Secret and the Chameleon's identity. Hidden information is hidden by what each
  surface *renders*. Devtools defeats it, and that's accepted — you're in the
  same room as these people.

Deployed on Vercel as a static SPA (`vercel.json` rewrites everything to
`index.html`). Realtime state is Firebase Realtime Database via
[`react-gameroom`](https://www.npmjs.com/package/react-gameroom).

## Docs

- [`projectInfo/rules.md`](projectInfo/rules.md) — the spec
- [`projectInfo/decisions.md`](projectInfo/decisions.md) — every decision that
  extends or overrides it, with the reasoning. Where the two disagree, this wins
- [`projectInfo/cards.md`](projectInfo/cards.md) — both decks, and the six
  screening rules a new card has to pass
- [`CLAUDE.md`](CLAUDE.md) — the same ground, written for whoever picks this up
  next
