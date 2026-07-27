/**
 * The 60-card deck: 4 categories × 15 Secrets.
 *
 * Every card passes the two screening rules in `projectInfo/cards.md` — it must
 * be expressible as `outer → {label} + inner → {text}`, and it must share a
 * silhouette with the rest of its category.
 *
 * Groups hold exactly 5 cards, which makes 15 per category exactly 3 groups.
 * The steal slate *is* the caught Chameleon's group, shuffled — so cards in a
 * group must be genuinely confusable from the canvas alone. Grouping is by
 * *silhouette*, not by theme: what the render looks like decides the group.
 *
 * `sketch` is authoring guidance for the key schema and for screening. It is
 * never shown in game.
 */

import type { Category, CategoryId, Secret } from "../types";

/** Builds one similarity group. Enforces the 5-card rule at module load. */
function group(
  categoryId: CategoryId,
  groupId: string,
  entries: ReadonlyArray<readonly [slug: string, sketch: string]>,
): Secret[] {
  if (entries.length !== 5) {
    throw new Error(
      `Group ${categoryId}/${groupId} has ${entries.length} cards; groups must hold exactly 5.`,
    );
  }
  return entries.map(([slug, sketch]) => ({
    id: `${categoryId}/${slug}`,
    categoryId,
    labelKey: `deck.${categoryId}.${slug}`,
    sketch,
    group: groupId,
  }));
}

// ---------------------------------------------------------------------------
// Form States — silhouette: a single form control. Divergence: what state.
// The tightest category in the deck, so the steal stays hard.
// ---------------------------------------------------------------------------

const formStates: Secret[] = [
  // A field with something in it or behind it. Divergence is content and color.
  ...group("form-states", "text-field", [
    ["placeholder-text", "empty input, grey italic placeholder"],
    ["password-field", "input type=password, dots, monospace"],
    ["search-input", "input with a magnifier, placeholder 'Search'"],
    ["autofilled-input", "the unmistakable Chrome autofill yellow background"],
    ["read-only-input", "muted background, no border, readonly"],
  ]),
  // A field plus a colored state signal. Several differ only in hue.
  ...group("form-states", "field-state", [
    ["validation-error", "input with red border, red helper text below"],
    ["required-field", "label with a red asterisk beside the control"],
    ["character-counter", "input with '0/280' beneath, right-aligned"],
    ["success-confirmation", "green border, checkmark, text 'Saved'"],
    ["focused-input", "input with a blue focus ring / outline"],
  ]),
  // Something you press. Muted/greyed styling is shared across most of them.
  ...group("form-states", "pressable", [
    ["disabled-button", "greyed button, reduced opacity, disabled, text 'Submit'"],
    ["loading-button", "button with a spinner, text 'Loading…'"],
    ["file-upload-field", "button 'Choose File' beside muted 'No file chosen'"],
    ["checked-checkbox", "input type=checkbox, checked, text label"],
    ["toggle-switch-off", "pill track, knob left, muted grey"],
  ]),
];

// ---------------------------------------------------------------------------
// Design Eras — silhouette varies by card. Divergence: era aesthetic.
// Deliberately the loosest category; grouped by form factor to compensate.
// ---------------------------------------------------------------------------

const designEras: Secret[] = [
  // All buttons. They differ only in surface treatment — the strongest group
  // in the deck for steal difficulty.
  ...group("design-eras", "era-button", [
    ["web-2-glossy-button", "rounded, gradient, top highlight, drop shadow"],
    ["brutalist-button", "raw black border, no radius, system font, harsh"],
    ["neumorphic-button", "soft dual shadows, background-matched, barely there"],
    ["y2k-chrome-button", "silver gradient, bevel, blue glow"],
    ["claymorphic-button", "puffy, high radius, pastel, soft inner shadow"],
  ]),
  // Rectangular panels holding text.
  ...group("design-eras", "era-panel", [
    ["windows-95-dialog", "grey box, hard black/white bevel edges, title bar"],
    ["glassmorphism-card", "translucent, backdrop-filter blur, thin light border"],
    ["bootstrap-alert", "pale blue box, subtle border radius, muted dark blue text"],
    ["dos-terminal", "black background, green monospace, blocky cursor"],
    ["metro-tile", "square, flat saturated color, white text bottom-left"],
  ]),
  // The leftovers, and the deck's weakest group: silhouettes genuinely diverge,
  // so a caught Chameleon who lands here has an easier steal than elsewhere.
  ...group("design-eras", "era-object", [
    ["skeuomorphic-toggle", "leather/metal texture, inset shadow, real switch"],
    ["material-fab", "circular, bold accent color, elevation shadow, centered icon"],
    ["geocities-marquee", "clashing colors, tiled background (no scroll — no <marquee>)"],
    ["flat-design-badge", "solid fill, zero shadow, no gradient, sharp corners"],
    ["vaporwave-banner", "magenta/cyan gradient, wide-spaced text"],
  ]),
];

// ---------------------------------------------------------------------------
// Web Annoyances — silhouette: an interrupt or overlay. Divergence: which
// dark pattern. The funniest category, and the most recognizable from few edits.
// ---------------------------------------------------------------------------

const webAnnoyances: Secret[] = [
  // Big centered panel, guilt copy, one CTA. Very confusable with each other.
  ...group("web-annoyances", "blocking-panel", [
    ["age-verification-gate", "dark full-screen block, 'Are you 18 or older?'"],
    ["ad-blocker-detected-wall", "blocking panel, guilt copy, no dismiss"],
    ["open-in-app-interstitial", "full-cover panel, app icon, big CTA"],
    ["exit-intent-modal", "'Wait! Don't go!', oversized close button"],
    ["newsletter-signup-popup", "centered modal, email input, dim backdrop"],
  ]),
  // A small-to-medium box asking you to agree to something, with a button.
  ...group("web-annoyances", "consent-prompt", [
    ["push-notification-prompt", "small top-left card, 'Allow' / 'Block'"],
    ["location-permission-prompt", "pin icon, 'Know your location?'"],
    ["captcha-box", "bordered box, checkbox, 'I'm not a robot'"],
    ["cookie-consent-banner", "bottom bar, dense text, 'Accept All' button"],
    ["survey-invitation", "slide-in corner card, 'Got 2 minutes?'"],
  ]),
  // The visually distinctive ones. Divergent silhouettes, but these are also
  // the cards Devs can signal fastest, so the group balances out.
  ...group("web-annoyances", "attention-grab", [
    ["paywall-fade", "text with a gradient mask fading to white, button below"],
    ["live-chat-bubble", "bottom-right circle, avatar, 'Hi! Need help?'"],
    ["autoplay-video-player", "black rect, play overlay, mute icon"],
    ["fake-urgency-timer", "red countdown, 'Only 2 left at this price!'"],
    ["unsubscribe-guilt-trip", "tiny 'No thanks, I hate saving money' link"],
  ]),
];

// ---------------------------------------------------------------------------
// Everyday Components — silhouette: a bread-and-butter UI primitive.
// The most familiar category, so Devs signal fast — which makes the
// Chameleon's job hardest here.
// ---------------------------------------------------------------------------

const everydayComponents: Secret[] = [
  // Wide horizontal elements. Progress Bar and Range Slider are near-twins.
  ...group("everyday-components", "wide-bar", [
    ["progress-bar", "grey track, colored fill at ~60% width"],
    ["range-slider", "thin track, round thumb, filled left portion"],
    ["skeleton-loader", "grey rounded bars, no content"],
    ["alert-banner", "full-width tinted strip, icon, message"],
    ["search-bar", "rounded input, magnifier, wide"],
  ]),
  // Small rounded things with tiny text.
  ...group("everyday-components", "small-pill", [
    ["notification-badge", "red circle, white number, top-right overlap"],
    ["avatar", "circle, initials, centered"],
    ["tag-chip", "small pill, soft background, tiny text, optional ×"],
    ["tooltip", "small dark rounded box (no pointer arrow — no pseudo-elements)"],
    ["keyboard-shortcut-hint", "muted 'Press' beside a bordered kbd '⌘K'"],
  ]),
  // A box or row carrying a label plus an affordance.
  ...group("everyday-components", "panel-row", [
    ["modal-dialog", "centered white panel, shadow (no dimmed backdrop)"],
    ["accordion-header", "full-width row, label left, chevron right"],
    ["empty-state", "centered illustration slot, muted 'Nothing here yet'"],
    ["dropdown-trigger", "bordered box, label left, caret right"],
    ["breadcrumb-trail", "small muted text with a '/' separator"],
  ]),
];

export const CATEGORIES: Category[] = [
  { id: "form-states", labelKey: "deck.category.form-states", secrets: formStates },
  { id: "design-eras", labelKey: "deck.category.design-eras", secrets: designEras },
  {
    id: "web-annoyances",
    labelKey: "deck.category.web-annoyances",
    secrets: webAnnoyances,
  },
  {
    id: "everyday-components",
    labelKey: "deck.category.everyday-components",
    secrets: everydayComponents,
  },
];

export const ALL_SECRETS: Secret[] = CATEGORIES.flatMap((c) => c.secrets);

const SECRETS_BY_ID = new Map(ALL_SECRETS.map((s) => [s.id, s]));

export function getSecret(id: string): Secret | undefined {
  return SECRETS_BY_ID.get(id);
}

export function getCategory(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** The 5 cards of a Secret's similarity group — the steal slate before shuffling. */
export function getGroupSecrets(secret: Secret): Secret[] {
  const category = getCategory(secret.categoryId);
  if (!category) return [];
  return category.secrets.filter((s) => s.group === secret.group);
}
