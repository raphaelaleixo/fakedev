# Implementation decisions

Settled during implementation kickoff. These extend `rules.md` — where they
contradict it, they win, and the reason is recorded here.

## Resolved from `rules.md`'s open list

**No private state.** This is a game played with friends in one room. Hidden
information is hidden by what each surface *renders*, not by what it receives:
one `game` node, every client subscribes to all of it. The TV holds the Secret
and never draws it before resolution; the Chameleon's client holds it too and
shows `FAKE DEV`. Devtools defeats it, and that's accepted.

Consequence: `RoundHidden` and `PlayerPrivate` don't exist. `secretId` and
`chameleonId` live on `Round`, and a player's role is derived
(`playerId === round.chameleonId`), not stored per seat.

**Boolean attributes take a value step.** `"true" | "false"`, two chips.
Overriding `disabled` back off is a legitimate play and it keeps last-write-wins
meaningful for those keys. Deviates from `rules.md`, which had them skip step 4.

**Devs, not Artists.** Following `rules.md` for theme consistency.

## The whitelist question — resolved as *suggestions*, not a gate

`rules.md` specified a curated whitelist as the only legal input, on the grounds
that "an invalid value must be unsubmittable, because a typo renders nothing and
is indistinguishable from a deliberately vague play". That premise is sound; the
conclusion doesn't follow, because the browser validates CSS natively.

**The design:**

- **Property step** — the curated set renders as browsable chips; typing falls
  through to the full property list. Browsable serves discovery (a player who
  doesn't know a concept exists can scan 30 chips); searchable serves recall (a
  fluent dev types `bord` and gets `border-*`). Both, in one control.
- **Value step** — typed editor for curated properties, free-form field gated on
  `CSS.supports(prop, value)` for everything else, and available as an escape
  hatch on curated ones. A typo still can't be submitted.
- **Stage isolation** — the Render Window is iframe-isolated, so `position:
  fixed`, `z-index: 9999` and `width: 99999px` are structurally trapped. This
  replaces a value blacklist entirely.
- **Inspector normalization** — each declaration is round-tripped through a
  throwaway `CSSStyleDeclaration` and read back as `cssText`, so `RGBA(0,0,0,.5)`
  and `rgba(0, 0, 0, 0.5)` render identically.

**The property list costs zero bundle bytes** — it comes from the browser, not a
package. For comparison, the packaged alternatives are `mdn-data` 733 KB,
`css-tree` 1.36 MB, `known-css-properties` 38 KB.

**Both sources are required, and this bit us.** Browsers disagree about where
the property list lives:

| Environment | `CSSStyleDeclaration.prototype` | computed style |
|---|---|---|
| Chrome | `["cssText", "cssFloat"]` — effectively nothing | the full list |
| jsdom | ~1600 accessors | 1 entry |

The first implementation read only the prototype. Every test passed, because
tests run in jsdom, and in Chrome the composer's search returned **two**
properties: `css-float` and `css-text`. The failure is silent — no error, no
warning, just an autocomplete that matches nothing — and it cost two wrong
fixes before an isolation panel found it.

`supportedCssProperties` therefore merges computed style *and* the style
object's own plus prototype names, and takes a `PropertySource` so both
environments are covered by tests rather than by luck. `src/game/css.test.ts`
holds a Chrome-shaped and a jsdom-shaped fake; deleting either source fails a
test.

**Lesson worth keeping:** "the browser already knows" is still the right call,
but a browser API that differs across engines needs verifying *in the target
browser*, not just in the test environment. jsdom passing is not evidence.

**Why not the curated-only whitelist.** The rate-limiting argument — that
unrestricted CSS lets one player finish the component in a single turn — inverts
the game's incentives. Completing the render hands the Chameleon the answer, so
nobody wants to go fast. `rules.md` already makes exactly this argument about
uncapped text content; the same logic applies to CSS.

**What this buys beyond expressiveness:** it dissolves the composite-value
problem. `box-shadow`, `linear-gradient()` and `mask-image` can't be expressed
as a single enum/color/length token, so a curated-only design needs *presets* —
which bake in colors that can't adapt to the canvas, and risk a chip sitting one
word away from naming a Design Eras card. Free-form values remove both.

**Known residuals**, to watch in the first playtest:

- *Input latency is a tell.* Tapping a chip and typing a declaration take
  different amounts of time, and time-to-commit is information. A Chameleon
  stalling to think of a property looks guilty for a reason unrelated to not
  knowing the Secret. The curated chips are the fast path that flattens this.
- *Skill gradient.* Free-form rewards CSS fluency, not deduction. The browsable
  curated set is what keeps the floor playable for the weakest player at the
  table.

**Consequence for content:** `KeySchemaEntry` is progressive polish rather than a
gate. Ten well-authored properties ship a playable game; the other ~600 already
work.

## Tags and attributes

**Tags (11):** `div, span, p, button, input, label, a, section, form, kbd, code`

Dropped `progress`, `meter`, `dialog` — near-unstyleable, and `dialog` renders
nothing without `open`. The structure audit already found div-plus-div is the
better Progress Bar. Dropped `hr`, `img`, `marquee` by call.

*Known cost:* without `marquee`, the GeoCities card loses its scroll and falls
back to clashing colors plus a tiled background. It was already ⚠️ in the audit.

*Deliberate trap:* `input` is void, so setting `inner` to `input` kills the
`{text}` slot mid-round. That is exactly what the second text slot exists to
survive, and it's a good tell.

**Attributes (9):** `type, placeholder, value, disabled, checked, required,
readonly, aria-label, role`

Dropped `href` (a styled `a` looks identical either way), `src`/`alt` (only the
Avatar card wants them, and initials-in-a-circle covers it), and `aria-hidden`
(no render change *and* no signal value — a strictly wasted turn).

**`aria-label` is effectively a third text slot** — invisible on the render,
fully visible on the inspector, and free text. `aria-label="Accept all cookies"`
is a louder signal than any style edit in the game. Kept because it's a good
dev-flavored move and a good tell, but **capped at the same 24 characters** as
`{label}` and `{text}`, or the two-text-slot design is quietly three with one
uncapped.

## Any device — reversing "everyone is on laptops"

This section used to assume a laptop with a keyboard, not a thumb: type-to-filter
was the *primary* input, chips the secondary affordance, and free-form values
were justified on the grounds that typing
`linear-gradient(135deg, #ff71ce, #01cdfe)` on a phone is miserable while on a
keyboard it's nothing. **That assumption is withdrawn — a phone is a first-class
controller.**

What changed is that typing stopped being the primary path. The value step is
**chosen by the key's `valueType`**, so the common moves never need a keyboard at
all: an enum is a row of chips, a colour is the twelve-swatch palette, a length
is a number field beside a unit select. The property step opens its list on
focus, so the curated set is browsable by tapping and typing only widens the
search to everything the browser supports. Free text is what an unauthored key
falls through to — the escape hatch, not the road.

The premise was sound and the conclusion outlived it. "Typing a gradient on a
phone is miserable" is still true; it just stopped being the thing a turn asks
you to do.

Consequences already in the code, recorded here so they don't read as accidents:
the Secret bar sits along the *bottom* of the controller, where a thumb is and
where a neighbour glancing over doesn't see it first, and it pads to
`env(safe-area-inset-bottom)`. Type-to-filter remains — it's still the fastest
input for anyone who knows the property they want, which on a laptop is most
turns. It is no longer the input the design is *built around*.

Routes and the two-surface split are unchanged.

## The caught Chameleon sees the render before guessing

`rules.md` lists the render under "Never shown" on a controller, and that holds
everywhere except one screen: the steal.

In the paper game the fake artist guesses **while looking at the finished
drawing** — it's on the table in front of everyone. The render is that drawing.
Now that it only appears at resolution, withholding it until after the guess
would make our steal strictly harder than the source, and both the blind odds
and the payout for a perfect steal were balanced against the source.

So the caught Chameleon's controller shows the render above the guess. The Devs
still don't see it — the TV holds it for resolution — so the reveal beat
survives intact, and the asymmetry is deliberate: the person guessing gets what
the paper game gives them, and nobody else gets an early look.

## The steal is over the full deck, not a slate of five

`rules.md` gives the caught Chameleon "two slates of five drawn at random, each
including the true answer". The slates are gone: they name any of the thirteen
styles and any of the fourteen components, from a searchable dropdown.

**The slate was never hiding anything.** Both decks are already public on the
Chameleon's own controller, behind the `?` on their role bar — that is the whole
point of showing them, so the Chameleon can pick a hypothesis early and play
toward it. A slate does not conceal the deck; it *narrows* the guess. And what
it narrows it to is luck: five options with the answer guaranteed among them is
a one-in-five lottery that pays a Chameleon who read nothing the same as one who
read the board.

The cost is real and worth stating. Blind odds per axis fall from 20% to 7.7%
for the style and 7.1% for the component, and both halves from 4% to 0.55%. So
being caught hurts more than it did, and a Chameleon who has genuinely lost the
thread will usually get nothing back.

That is the trade: the steal stops being a consolation roll and becomes the last
place in the round where paying attention pays. It also fits how the halves
already score — half right is worth something, so a Chameleon who read the style
off the board and never worked out the component still leaves with a point,
which is exactly the outcome the slate was blurring.

**What this touched:** `STEAL_SLATE_SIZE`, `buildStealSlate`, the `stealSlate`
field on `Round` and its serialization are all gone, and `resolveRound` no
longer needs an `Rng`. The big screen's guarantee got stronger rather than
weaker — it used to be "never show the five", and it is now "never name a card".
