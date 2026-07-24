# Base Structure Audit

## Resolution

**Adopted: Fix 1, the second text slot.** The base structure is now:

```html
<ComponentA id="outer">
  {label}
  <ComponentB id="inner">
    {text}
  </ComponentB>
</ComponentA>
```

Four edit targets: `outer`, `label`, `inner`, `text`.

**Adopted: replace the two impossible cards.** `Indeterminate Checkbox` → **File Upload Field**. `Loading Spinner` → **Keyboard Shortcut Hint**. The CSS whitelist stays static — no `animation`, no `@keyframes` — and animation is deferred as a possible later expansion.

**Post-fix totals: 55 ✅ · 5 ⚠️ · 0 ❌.**

The second text slot upgraded 9 cards: Validation Error, Required Field, Character Counter, Cookie Consent Banner, CAPTCHA Box, Newsletter Signup Popup, Push Notification Prompt, "Open in App" Interstitial, and Location Permission Prompt. Two of those — CAPTCHA and Character Counter — want the control *before* the copy, so they need a `flex-direction: row-reverse` / `column-reverse` edit on `outer` to sit correctly. That's a fine thing for a Dev to know and a nice tell.

**The 5 remaining ⚠️ are all whitelist or canvas decisions, not structural ones**, and each has a known fix:

| Card | Needs |
|---|---|
| Glassmorphism Card | A non-flat canvas background for `backdrop-filter` to act on |
| GeoCities Marquee | `<marquee>` in the tag whitelist |
| Paywall Fade | `mask-image` in the CSS whitelist |
| Tooltip | Loses only its pointer arrow; reads fine without |
| Modal Dialog | Loses only its dimmed backdrop; reads fine without |

Nothing below is blocking any more. The audit is kept as the reasoning record.

---

## Original audit (against the single-text-slot structure)

Every card in `cards.md` checked against the *originally proposed* initial state:

```html
<ComponentA id="outer">
  <ComponentB id="inner">
    {text-node}
  </ComponentB>
</ComponentA>
```

Editable surface: `outer` tag/attrs/CSS, `inner` tag/attrs/CSS, and one text node **inside `inner`**.

**Verdicts:** ✅ renders cleanly · ⚠️ recognizable but loses a defining detail · ❌ structurally impossible

**Totals as audited: 44 ✅ · 14 ⚠️ · 2 ❌** — superseded by the resolution above.

---

## Four root causes

**1. There is only one text node, and it is trapped inside `inner`.**
The single biggest constraint. Any card that is "a control *plus* a label", or "body copy *plus* a button", can only have one of the two. This is what breaks most of Web Annoyances — a cookie banner is body text *and* an Accept button; drop either and it stops being a cookie banner.

**2. Void elements orphan the text node.**
`input`, `img`, `hr` cannot contain text. So the moment a player sets `inner` to `input` — which half of Form States wants — the text slot becomes unusable and the card loses its label.

**3. No pseudo-elements.**
No `::before` / `::after` means no icons, no tooltip arrow, no modal backdrop, no paywall fade, no glossy highlight. Every card whose sketch says "icon" or "overlay" degrades.

**4. No animation.**
Spinner rotation, skeleton shimmer, marquee scroll. Only two cards hard-depend on it, but they depend on it completely.

---

## Form States — 11 ✅ · 3 ⚠️ · 1 ❌

| Card | | Note |
|---|---|---|
| Disabled Button | ✅ | |
| Validation Error | ⚠️ | Red-bordered box *or* red message text, not both |
| Loading Button | ✅ | Text carries it; no spinner |
| Focused Input | ✅ | Static `outline`, no `:focus` needed |
| Required Field | ⚠️ | Label and asterisk share one text node, so both go red |
| Checked Checkbox | ✅ | Lone checkbox reads fine unlabelled |
| Placeholder Text | ✅ | |
| Success Confirmation | ✅ | |
| Read-only Input | ✅ | |
| Character Counter | ⚠️ | Counter text *or* the field, not both |
| Password Field | ✅ | |
| Indeterminate Checkbox | ❌ | `indeterminate` is a JS property, not an attribute. Unreachable |
| Autofilled Input | ✅ | Yellow background *is* the look; no pseudo-class needed |
| Search Input | ✅ | Placeholder carries it |
| Toggle Switch (Off) | ✅ | Track + knob maps perfectly |

## Design Eras — 13 ✅ · 2 ⚠️ · 0 ❌

**The most achievable category in the deck**, and a direct inversion of my earlier claim that it was the weakest. Eras are pure styling, and styling is exactly what a CSS property list does. Almost none of these need a third element or a second text slot.

| Card | | Note |
|---|---|---|
| Windows 95 Dialog | ✅ | Outer body + inner title bar |
| Web 2.0 Glossy Button | ✅ | Gradient carries it without a highlight overlay |
| Brutalist Button | ✅ | |
| Skeuomorphic Toggle | ✅ | |
| Material FAB | ✅ | Icon as a text character |
| Neumorphic Button | ✅ | Dual `box-shadow` |
| Glassmorphism Card | ⚠️ | `backdrop-filter` needs something behind it — the canvas background must not be flat |
| Bootstrap Alert | ✅ | |
| DOS Terminal | ✅ | |
| GeoCities Marquee | ⚠️ | Needs `<marquee>` whitelisted (deprecated but still works) or CSS animation |
| Flat Design Badge | ✅ | |
| Metro Tile | ✅ | |
| Y2K Chrome Button | ✅ | |
| Vaporwave Banner | ✅ | |
| Claymorphic Button | ✅ | |

## Web Annoyances — 8 ✅ · 7 ⚠️ · 0 ❌

**The category that suffers most, and the damage is worse than the count suggests.** Seven cards degrade to "a box with some text" — and they degrade *toward each other*. A Cookie Banner stripped of its Accept button and an Age Verification Gate become nearly the same render, which destroys the Devs' ability to signal *which* one they know. That's a bigger problem than any single card being imperfect.

| Card | | Note |
|---|---|---|
| Cookie Consent Banner | ⚠️ | Body text *or* Accept button |
| Paywall Fade | ⚠️ | Needs `mask-image` whitelisted, else no fade |
| CAPTCHA Box | ⚠️ | Checkbox orphans "I'm not a robot" |
| Newsletter Signup Popup | ⚠️ | Headline *or* email input |
| Push Notification Prompt | ⚠️ | Message *or* Allow button |
| "Open in App" Interstitial | ⚠️ | Copy *or* CTA |
| Age Verification Gate | ✅ | Pure text card |
| Live Chat Bubble | ✅ | |
| Exit-Intent Modal | ✅ | |
| Autoplay Video Player | ✅ | Play triangle as a text glyph |
| Survey Invitation | ✅ | |
| Ad Blocker Detected Wall | ✅ | |
| Location Permission Prompt | ⚠️ | Pin icon needs `::before` |
| Fake Urgency Timer | ✅ | |
| Unsubscribe Guilt Trip | ✅ | |

## Everyday Components — 12 ✅ · 2 ⚠️ · 1 ❌

| Card | | Note |
|---|---|---|
| Progress Bar | ✅ | Track + fill is the ideal fit |
| Tooltip | ⚠️ | No pointer arrow without `::after` |
| Notification Badge | ✅ | |
| Avatar | ✅ | |
| Loading Spinner | ❌ | Static, it's a circle with one border missing. Needs animation |
| Range Slider | ✅ | Track + thumb |
| Alert Banner | ✅ | |
| Skeleton Loader | ✅ | Static grey bars read fine; shimmer is a bonus |
| Tag / Chip | ✅ | |
| Modal Dialog | ⚠️ | No dimmed backdrop without a third layer |
| Accordion Header | ✅ | Chevron as a text glyph |
| Search Bar | ✅ | |
| Empty State | ✅ | |
| Dropdown Trigger | ✅ | Caret as a text glyph |
| Breadcrumb Trail | ✅ | Separator inside one string |

---

## Proposed fixes

### Fix 1 — a second text slot in `outer` (highest leverage)

```html
<ComponentA id="outer">
  {label}
  <ComponentB id="inner">
    {text}
  </ComponentB>
</ComponentA>
```

Resolves roughly 10 of the 14 ⚠️ outright, and nearly all of the Web Annoyances damage: `{label}` becomes the body copy while `inner` becomes the button, the input, or the checkbox. Cookie Banner, CAPTCHA, Newsletter Popup, Push Prompt, Open-in-App, Required Field, Validation Error and Character Counter all become clean.

Secondary benefit: a fourth edit target. At a 10-player table that's 20 edits across what is currently only three targets, and more surface means less forced overriding.

Cost: one more option in the turn composer's first step. Slot order is fixed (`{label}` before `inner`), though a `flex-direction` edit can invert it — which is a nicely dev-flavored trick to leave discoverable.

### Fix 2 — pseudo-element targets

Add `outer::before` and `inner::after` as targets, with `content` as a free-text key. Unlocks the tooltip arrow, modal backdrop, paywall fade, glossy highlight, and every icon in the deck. Six targets total.

Thematically strong — `::before` is exactly the kind of thing this audience finds funny — but it roughly doubles the conceptual surface of a turn, and `content` is effectively a third text node, which is a lot of expressive power to hand a bluffing Chameleon.

### Fix 3 — the two broken cards

`Indeterminate Checkbox` and `Loading Spinner` are unreachable without JS and animation respectively. Either whitelist `animation` plus a small `@keyframes` set, or replace both cards. Replacement is cheaper and there are 13 other strong cards in each category.

### Also needs deciding

- **Canvas background.** Glassmorphism needs a non-flat backdrop to read at all. A subtle patterned canvas would fix it and make every translucent effect more legible.
- **Whitelist specifics surfaced by this audit:** `mask-image` (Paywall Fade), `backdrop-filter` (Glassmorphism), `<marquee>` (GeoCities), `animation` (Spinner, Skeleton shimmer).
