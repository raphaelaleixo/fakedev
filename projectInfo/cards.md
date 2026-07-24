# A Fake Dev Goes to Amsterdam — Card Deck

**4 Categories × 15 Secrets = 60 cards.**

## Screening rules

Every card in this deck must pass both tests. Apply them to anything added later.

**1. The structure test.** A Secret must be expressible as `outer → {label} + inner → {text}` — two elements and **two** text slots:

```html
<ComponentA id="outer">
  {label}
  <ComponentB id="inner">
    {text}
  </ComponentB>
</ComponentA>
```

Nothing with three or more meaningful children survives — no nav bars, card grids, data tables, star ratings, or multi-item menus. What works is *container plus one significant child*, optionally with copy alongside it: a track and a fill, a bar and a button, a checkbox and its label, body text and a CTA. The second text slot is what makes the "control plus label" shape — most of real UI — reachable at all; see `structure-audit.md` for why one slot wasn't enough.

**2. Shared silhouette, divergent detail.** Cards within a category should look alike at a glance and differ in color, text, or one telling attribute. This is the balancing lever for the whole game: it keeps the Chameleon's steal genuinely uncertain, and it lets them produce plausible edits while bluffing. A category whose cards render wildly differently makes the steal nearly free.

Each card below carries a one-line render sketch — roughly what the canvas should read as. These are guidance for screening and for authoring the key schema, not rules imposed on players.

---

## Form States

*Silhouette: a single form control. Divergence: what state it's in.* The tightest category in the deck — nearly every card is a wrapper around an `input` or `button`, so the steal stays hard.

1. **Disabled Button** — greyed `button`, reduced opacity, `disabled`, text "Submit"
2. **Validation Error** — `input` with red border, red helper text below
3. **Loading Button** — `button` with a spinner, text "Loading…"
4. **Focused Input** — `input` with a blue focus ring / outline
5. **Required Field** — `label` with a red asterisk beside the control
6. **Checked Checkbox** — `input type=checkbox`, `checked`, text label
7. **Placeholder Text** — empty `input`, grey italic `placeholder`
8. **Success Confirmation** — green border, checkmark, text "Saved"
9. **Read-only Input** — muted background, no border, `readonly`
10. **Character Counter** — `input` with "0/280" beneath, right-aligned
11. **Password Field** — `input type=password`, dots, monospace
12. **File Upload Field** — `button` "Choose File" beside muted "No file chosen"
13. **Autofilled Input** — the unmistakable Chrome autofill yellow background
14. **Search Input** — `input` with a magnifier, `placeholder` "Search"
15. **Toggle Switch (Off)** — pill track, knob left, muted grey

## Design Eras

*Silhouette: varies by card — each names its own component. Divergence: era aesthetic.* Deliberately the loosest category. Divergent silhouettes make narrowing easier for a caught Chameleon, but 15 cards absorbs most of that.

1. **Windows 95 Dialog** — grey box, hard black/white bevel edges, title bar
2. **Web 2.0 Glossy Button** — rounded, gradient, top highlight, drop shadow
3. **Brutalist Button** — raw black border, no radius, system font, harsh
4. **Skeuomorphic Toggle** — leather/metal texture, inset shadow, real switch
5. **Material FAB** — circular, bold accent color, elevation shadow, centered icon
6. **Neumorphic Button** — soft dual shadows, background-matched, barely there
7. **Glassmorphism Card** — translucent, `backdrop-filter: blur`, thin light border
8. **Bootstrap Alert** — pale blue box, subtle border radius, muted dark blue text
9. **DOS Terminal** — black background, green monospace, blocky cursor
10. **GeoCities Marquee** — clashing colors, scrolling text, tiled background
11. **Flat Design Badge** — solid fill, zero shadow, no gradient, sharp corners
12. **Metro Tile** — square, flat saturated color, white text bottom-left
13. **Y2K Chrome Button** — silver gradient, bevel, blue glow
14. **Vaporwave Banner** — magenta/cyan gradient, wide-spaced text
15. **Claymorphic Button** — puffy, high radius, pastel, soft inner shadow

## Web Annoyances

*Silhouette: an interrupt or overlay. Divergence: which dark pattern.* The funniest category, and the one most likely to produce recognizable renders from few edits.

1. **Cookie Consent Banner** — bottom bar, dense text, "Accept All" button
2. **Paywall Fade** — text with a gradient mask fading to white, button below
3. **CAPTCHA Box** — bordered box, checkbox, "I'm not a robot"
4. **Newsletter Signup Popup** — centered modal, email input, dim backdrop
5. **Push Notification Prompt** — small top-left card, "Allow" / "Block"
6. **"Open in App" Interstitial** — full-cover panel, app icon, big CTA
7. **Age Verification Gate** — dark full-screen block, "Are you 18 or older?"
8. **Live Chat Bubble** — bottom-right circle, avatar, "Hi! Need help?"
9. **Exit-Intent Modal** — "Wait! Don't go!", oversized close button
10. **Autoplay Video Player** — black rect, play overlay, mute icon
11. **Survey Invitation** — slide-in corner card, "Got 2 minutes?"
12. **Ad Blocker Detected Wall** — blocking panel, guilt copy, no dismiss
13. **Location Permission Prompt** — pin icon, "Know your location?"
14. **Fake Urgency Timer** — red countdown, "Only 2 left at this price!"
15. **Unsubscribe Guilt Trip** — tiny "No thanks, I hate saving money" link

## Everyday Components

*Silhouette: a bread-and-butter UI primitive. Divergence: which one.* The most familiar category, so Devs can signal fast — which makes the Chameleon's job hardest here.

1. **Progress Bar** — grey track, colored fill at ~60% width
2. **Tooltip** — small dark rounded box with a pointer arrow
3. **Notification Badge** — red circle, white number, top-right overlap
4. **Avatar** — circle, cropped image or initials, centered
5. **Keyboard Shortcut Hint** — muted "Press" beside a bordered `kbd` "⌘K"
6. **Range Slider** — thin track, round thumb, filled left portion
7. **Alert Banner** — full-width tinted strip, icon, message
8. **Skeleton Loader** — grey rounded bars, shimmer, no content
9. **Tag / Chip** — small pill, soft background, tiny text, optional ×
10. **Modal Dialog** — centered white panel, shadow, dimmed backdrop
11. **Accordion Header** — full-width row, label left, chevron right
12. **Search Bar** — rounded input, magnifier, wide
13. **Empty State** — centered illustration slot, muted "Nothing here yet"
14. **Dropdown Trigger** — bordered box, label left, caret right
15. **Breadcrumb Trail** — small muted text with a `/` separator

---

## Steal odds

**Resolved: the caught Chameleon sees a 5-card slate** — the true Secret plus 4 decoys drawn from the round's Category — not all 15. This decouples deck depth from steal difficulty: the deck can grow to any size while the blind floor stays at the 20% the scoring was balanced around, and the phone UI stays a single tappable screen. Paper had no way to do this.

For reference, the paper game requires *free recall* of the exact title with no options at all, so any multiple choice remains substantially more generous than the source.

## Open design decisions

- **Decoy selection.** Drawing 4 decoys uniformly at random will sometimes produce obviously-wrong options — Secret `Progress Bar` against a decoy `Empty State` is eliminated on sight, pushing effective odds well above 20%. Similarity-group tags would hold the floor but mean hand-tagging all 60 cards.
- **Style references.** Confirmed for `Design Eras`, and written into `rules.md` as **Devs-phone-only** rather than big-screen — a TV-side reference would leak either the era itself or the full candidate list to the Chameleon. Still open: whether the other three categories need thumbnails at all, given their labels are largely self-explanatory and 60 thumbnails is a real content cost.
- **Cross-category near-duplicates.** "Toggle Switch (Off)" (Form States) and "Skeuomorphic Toggle" (Eras) overlap, as do "Alert Banner" (Everyday) and "Bootstrap Alert" (Eras). Category is public so there's no in-round confusion, but it's repetitive across a match.
- **Render feasibility — audited, 55 ✅ / 5 ⚠️ / 0 ❌.** See `structure-audit.md`. All 60 cards now render; the 5 partial ones lose a cosmetic detail and each has a known whitelist fix. Four whitelist items were surfaced by that audit and still need a call: `mask-image`, `backdrop-filter`, `<marquee>`, and a non-flat canvas background for `backdrop-filter` to act on.
- **i18n.** Card *labels* need translating; the render sketches don't. Text-node suggestions like "Accept All" are English UI conventions and probably shouldn't be translated at all.
