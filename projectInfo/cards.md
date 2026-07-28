# The two decks

**13 styles × 14 components = 182 Secrets, from 27 authored items.**

A round draws one of each. Both are hidden from the Chameleon. Neither repeats
within a match.

---

## Six screening rules

Every entry must pass all six. Apply them to anything added later.

### 1. Structure

Expressible as **a box plus one nested box**, each of which may hold a span:

```html
<div id="outer">
  <span id="outer-text">…</span>
  <div id="inner">
    <span id="inner-text">…</span>
  </div>
</div>
```

Nothing with three or more meaningful children survives — no nav bars, card
grids, data tables, star ratings, multi-item menus.

**The tags are fixed and there are no attributes**, so an entry must be
reachable by CSS alone. Anything whose identity is a tag — a `<table>`, an
`<input type="range">` — is out; what stays is its *silhouette*, which divs can
draw.

### 2. The lorem ipsum test

**Would this still read if every word on screen were the same meaningless
copy?** It will be: the text move drops a fixed lorem ipsum and nobody chooses
the words.

The game's medium is structure and style. Copy is not part of the medium, so a
card whose identity lives in its words has exactly two states: you type the words
and hand the Chameleon the answer, or you can't signal it at all. Rather than
police that, the game removes the choice — which turns this rule from a
guideline into a hard constraint on the deck.

This rule is why the original *Web Annoyances* category was cut. An
Age Verification Gate, an Ad Blocker Wall and an Exit-Intent Modal are all "a
panel with copy and a button" — they are *rhetorical acts*, and rhetoric is copy.

### 3. Depth

**A card must need several distinct moves.** If one declaration expresses it, it
isn't a card — it's a move.

Pairing a style with a component guarantees this at the Secret level, but each
half must carry its own weight: a style that's one shadow, or a component that's
one border-radius, leaves the round with nothing to do.

### 4. Distinct siblings

**No two entries in a list are built from the same moves.** This replaces the old
"shared silhouette, divergent detail" rule, which protected the steal by making
cards resemble each other.

It's no longer needed. **The steal is protected by the board being incomplete**,
not by the cards being similar — a round produces five or six declarations, so
nothing is ever fully expressed. That frees both lists to be genuinely varied.

### 5. A style is not a mode

**Dark Mode, High Contrast and print stylesheets are inversions you apply *to* a
style, not styles.** Material has a dark mode; Bootstrap has one. They're
orthogonal to the axis rather than points on it, so they'd combine with every
entry rather than sit beside them.

### 6. A card cannot be an absence

**The game is played by adding declarations, so a card whose identity is the
lack of them is contradicted by the first move anybody makes** — including the
moves you'd play to signal it. You cannot build *Unstyled HTML* by styling.

This one cost two entries before it was written down: Flat Design ("no shadow,
no gradient") and Unstyled HTML. If a sketch reads as a list of things you
*don't* do, it isn't a card.

---

## Styles

*What it looks like. Each is a distinct combination of surface moves — fill,
border, radius, shadow, type.*

| Style | Reads as |
|---|---|
| **Windows 95** | grey face, hard outset bevel — white top-left, black bottom-right |
| **Web 2.0 Glossy** | raised: vertical light-to-dark gradient, bright top highlight, drop shadow |
| **Brutalist** | thick black border, zero radius, hard offset shadow with no blur |
| **Skeuomorphic** | pressed: inset shadow, ridged gradient, darker rim |
| **Material** | bold accent fill, layered elevation shadow, uppercase medium type |
| **Neumorphic** | fill identical to the page, twin shadows — light top-left, dark bottom-right |
| **Glassmorphism** | translucent fill, `backdrop-filter: blur`, hairline light border |
| **Bootstrap** | one hue in three tints — pale fill, mid border, dark text — small radius |
| **DOS Terminal** | black fill, phosphor-green monospace, zero radius, no border |
| **Vaporwave** | magenta-to-cyan gradient, very wide letter-spacing, coloured glow |
| **Claymorphic** | puffy pastel, very high radius, soft outer shadow plus a light inner one |
| **Wireframe** | no fill, grey dashed border, comic lettering, everything low-contrast |
| **Newspaper** | serif, black on cream, hairline rules, small caps, no colour |

**Skeuomorphic is defined against Web 2.0 Glossy** — pressed *in* versus raised
*out*, inset shadow versus top highlight. Without that opposition the two are the
same gradient-and-shadow move.

**Wireframe's font is the point.** Balsamiq's mockups use Comic Sans deliberately,
so nobody mistakes a wireframe for a finished design. The name is the artefact;
the font is the move.

**Three were cut and each failed a different rule.** *Metro Tile* defined
geometry — "perfect square, text bottom-left" — so *Metro Tile Avatar* was a
contradiction rather than a combination. *Swiss* failed nameability: at the steal
you have to produce the name from a slate, and it isn't a word this audience
reaches for. *Y2K Chrome* was gradient-plus-bevel-plus-glow, competing with
Glossy and Skeuomorphic for the same declarations.

Two known compromises: **Glassmorphism** needs the stage's non-flat background to
read at all, which it has. **Skeuomorphic** has no real texture without an image
and leans on gradient plus inset shadow.

---

## Components

*What it is. Each is a distinct silhouette built from container plus child.*

| Component | Reads as |
|---|---|
| **Progress Bar** | wide flat track, one fill stopping partway, no copy at all |
| **Range Slider** | thin track, one round thumb sitting on it |
| **Toggle Switch** | short pill track, circular knob pushed to one end |
| **Avatar** | circle, copy centred and clipped inside it |
| **Notification Badge** | small disc pinned over the top-right corner of a larger box |
| **Tooltip** | small dark rounded box, pale small copy, tight padding |
| **Search Bar** | wide rounded field, thin border, copy in placeholder grey |
| **Backdrop** | dimmed full-bleed scrim, a pale panel floating centred in it |
| **Primary Button** | solid accent fill, bold label, generous horizontal padding |
| **Blockquote** | thick coloured left border, italic serif, no fill |
| **Checkbox** | small square with a heavy border, copy alongside on one line |
| **Radio (Selected)** | outer ring, smaller filled dot centred inside it |
| **App Header** | full-width bar, one line of copy at the left, hairline rule beneath |
| **Hero Banner** | tall full-bleed block, oversized centred type, deep vertical padding |

**Scale is the axis that keeps them apart.** Three entries are a box with a line
of copy in it — App Header, Hero Banner, Primary Button — and they are only
distinct because one is wide and thin, one is tall and deep, and one is
shrink-to-fit. That's a real distinction in CSS terms (each is a different
padding-and-width argument) but it's the deck's thinnest, and the first thing to
revisit after a playtest.

**Three were cut and one recast when the moves narrowed to CSS.** *Tag / Chip*
and *Keyboard Key* were both "a small rounded box with a word in it" —
indistinguishable from each other, and from a shrunken button, once the copy is
fixed. *Alert Banner* lost its glyph to the same rule and became a tinted App
Header. *Modal Dialog* was recast as **Backdrop**: the same centred panel, but
with the scrim — the outer div's natural job — as the identity rather than an
afterthought.

**Two were added**, both because the deck had no entry whose identity was its
proportions: **App Header** (wide and thin, pinned copy, a rule beneath) and
**Hero Banner** (tall and deep, oversized centred type).

**Three were cut earlier.** *Segmented Control* joined Progress Bar and Range Slider as a
third way to say "a wide track with one child" — the biggest cluster in either
list; **Blockquote** replaced it, since a border on one side only is a move
nothing else makes. *Icon Button* leaned on a glyph, which is a text slot doing a
shape's job and renders differently on every machine; **Primary Button** replaced
it. *Skeleton Loader* is several *stacked* bars, but our structure nests rather
than stacks, so it read as one bar inside another; **Radio (Selected)** replaced
it — a circle inside a circle is the most literal container-and-child here, and
it pairs against Checkbox as round-versus-square, dot-versus-tick.

---

## Why the combination works

A Secret is a style *and* a component, so:

- **Depth is structural.** *Wireframe Toggle Switch* needs the pill track and the
  knob **and** the dashed grey outline and the mono type. No single declaration
  gets close.
- **The Chameleon can be half right.** They guess both halves at the steal and
  score one point per axis, so a good read on one is worth something.
- **Nothing repeats.** Tracked separately across a match; the shorter deck sets
  a ceiling of thirteen rounds, far past any real match.
- **Two Devs can converge without either finishing.** One plays the shape, one
  plays the surface, and neither has said the answer out loud.
