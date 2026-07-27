# The two decks

**15 styles × 15 components = 225 Secrets, from 30 authored items.**

A round draws one of each. Both are hidden from the Chameleon. Neither repeats
within a match.

---

## Four screening rules

Every entry must pass all four. Apply them to anything added later.

### 1. Structure

Expressible as **a container plus one child**, with optional text in each:

```html
<ComponentA id="outer">
  {label}
  <ComponentB id="inner">
    {text}
  </ComponentB>
</ComponentA>
```

Nothing with three or more meaningful children survives — no nav bars, card
grids, data tables, star ratings, multi-item menus.

### 2. The lorem ipsum test

**Could a Dev signal this meaningfully while writing lorem ipsum in every text
slot?** If not, it's a copy card, not a component card.

The game's medium is structure and style. Copy is not part of the medium, so a
card whose identity lives in its words has exactly two states: you type the words
and hand the Chameleon the answer, or you can't signal it at all.

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

---

## Styles

*What it looks like. Each is a distinct combination of surface moves — fill,
border, radius, shadow, type.*

| Style | Reads as |
|---|---|
| **Windows 95** | grey fill, hard outset bevel, black title strip, system font |
| **Web 2.0 Glossy** | rounded, vertical gradient, top highlight, drop shadow |
| **Brutalist** | thick black border, zero radius, system font, hard offset shadow |
| **Skeuomorphic** | textured gradient, inset shadow, bevelled edge |
| **Material** | bold accent fill, elevation shadow, uppercase medium type |
| **Neumorphic** | fill matching the background, dual light and dark shadows, soft radius |
| **Glassmorphism** | translucent fill, `backdrop-filter: blur`, thin light border |
| **Bootstrap** | pale tinted fill, thin border, small radius, muted darker text |
| **DOS Terminal** | black fill, green monospace, zero radius |
| **Flat Design** | solid saturated fill, no shadow, no gradient, small radius |
| **Metro Tile** | perfect square, flat saturated fill, white type bottom-left |
| **Y2K Chrome** | silver gradient, bevel, blue glow, heavy weight |
| **Vaporwave** | magenta-to-cyan gradient, wide letter-spacing, glow |
| **Claymorphic** | puffy, very high radius, pastel, soft inner and outer shadow |
| **Wireframe** | no fill, grey dashed border, monospace, low contrast |

Two known compromises: **Glassmorphism** needs the stage's non-flat background to
read at all, which it has. **Skeuomorphic** loses real texture without an image,
and leans on gradient plus inset shadow.

---

## Components

*What it is. Each is a distinct silhouette built from container plus child.*

| Component | Reads as |
|---|---|
| **Progress Bar** | wide track, colored fill at part width |
| **Range Slider** | thin track, round thumb |
| **Toggle Switch** | pill track, circular knob at one end |
| **Avatar** | circle, centred initials |
| **Notification Badge** | small circle, number, offset to a corner |
| **Tag / Chip** | small pill, soft fill, tiny text |
| **Tooltip** | small dark rounded box, small text |
| **Search Bar** | wide rounded input, placeholder |
| **Alert Banner** | full-width strip, tinted, glyph beside text |
| **Modal Dialog** | centred panel, shadow, a button inside |
| **Icon Button** | square, one glyph centred, no label |
| **Segmented Control** | wide bordered track, one filled active segment |
| **Checkbox** | small square, check glyph, label beside |
| **Skeleton Loader** | grey rounded bars, deliberately no content |
| **Keyboard Key** | small bordered `kbd`, monospace glyph, subtle depth |

**Skeleton Loader** is the one that only works because the canvas is code: its
whole identity is *having no content*, which was unplayable when a live render
made an empty screen indistinguishable from a broken turn.

---

## Why the combination works

A Secret is a style *and* a component, so:

- **Depth is structural.** *Wireframe Toggle Switch* needs the pill track and the
  knob **and** the dashed grey outline and the mono type. No single declaration
  gets close.
- **The Chameleon can be half right.** They guess both halves at the steal and
  score one point per axis, so a good read on one is worth something.
- **Nothing repeats.** Fifteen of each, tracked separately across a match.
- **Two Devs can converge without either finishing.** One plays the shape, one
  plays the surface, and neither has said the answer out loud.
