/**
 * The two decks: 13 styles × 14 components = 182 Secrets from 27 authored items.
 *
 * A round draws one of each. Both halves are hidden from the Chameleon, and
 * neither repeats within a match.
 *
 * Every entry passes the six screening rules in `projectInfo/cards.md`. The
 * second one does most of the work here: the copy is always the same lorem, so
 * nothing may lean on what a word says. A component is a silhouette.
 *
 * `sketch` is authoring guidance — what the code should read as. Never shown in
 * game.
 */

import type { Card } from "../types";

const card = (list: "style" | "component") =>
  (id: string, sketch: string): Card => ({
    id,
    labelKey: `deck.${list}.${id}`,
    sketch,
  });

const style = card("style");
const component = card("component");

/**
 * What it looks like. Each is a distinct combination of surface moves — fill,
 * border, radius, shadow, type.
 */
export const STYLES: Card[] = [
  style("windows-95", "grey face, hard outset bevel — white top-left, black bottom-right"),
  style("web-2-glossy", "raised: vertical light-to-dark gradient, bright top highlight, drop shadow"),
  style("brutalist", "thick black border, zero radius, hard offset shadow with no blur"),
  // The inverse of glossy: pressed in rather than raised out.
  style("skeuomorphic", "pressed: inset shadow, ridged gradient, darker rim"),
  style("material", "bold accent fill, layered elevation shadow, uppercase medium type"),
  style("neumorphic", "fill identical to the page, twin shadows — light top-left, dark bottom-right"),
  style("glassmorphism", "translucent fill, backdrop-filter blur, hairline light border"),
  // One hue in three tints is the whole look, and nothing else in the deck does it.
  style("bootstrap", "one hue in three tints — pale fill, mid border, dark text — small radius"),
  style("dos-terminal", "black fill, phosphor-green monospace, zero radius, no border"),
  style("vaporwave", "magenta-to-cyan gradient, very wide letter-spacing, coloured glow"),
  style("claymorphic", "puffy pastel, very high radius, soft outer shadow plus a light inner one"),
  // Balsamiq's mockups use Comic Sans on purpose, so nobody mistakes a wireframe
  // for a finished design. The font is the move; the name is the artefact.
  style("wireframe", "no fill, grey dashed border, comic lettering, everything low-contrast"),
  style("newspaper", "serif, black on cream, hairline rules, small caps, no colour"),
];

/**
 * What it is. Each is a distinct silhouette built from container plus child.
 */
export const COMPONENTS: Card[] = [
  component("progress-bar", "wide flat track, one fill stopping partway, no copy at all"),
  component("range-slider", "thin track, one round thumb sitting on it"),
  component("toggle-switch", "short pill track, circular knob pushed to one end"),
  component("avatar", "circle, copy centred and clipped inside it"),
  // Its identity is placement, not a digit — the disc hangs off the corner.
  component("notification-badge", "small disc pinned over the top-right corner of a larger box"),
  component("tooltip", "small dark rounded box, pale small copy, tight padding"),
  component("search-bar", "wide rounded field, thin border, copy in placeholder grey"),
  // The scrim is the point, and it is exactly what an outer div is for.
  component("backdrop", "dimmed full-bleed scrim, a pale panel floating centred in it"),
  component("primary-button", "solid accent fill, bold label, generous horizontal padding"),
  // Its identity is a border on one side only — nothing else in the deck is.
  component("blockquote", "thick coloured left border, italic serif, no fill"),
  component("checkbox", "small square with a heavy border, copy alongside on one line"),
  // Circle inside a circle — the structure's most literal container-and-child.
  component("radio-selected", "outer ring, smaller filled dot centred inside it"),
  component("app-header", "full-width bar, one line of copy at the left, hairline rule beneath"),
  component("hero-banner", "tall full-bleed block, oversized centred type, deep vertical padding"),
];

const STYLE_BY_ID = new Map(STYLES.map((c) => [c.id, c]));
const COMPONENT_BY_ID = new Map(COMPONENTS.map((c) => [c.id, c]));

export function getStyle(id: string): Card | undefined {
  return STYLE_BY_ID.get(id);
}

export function getComponent(id: string): Card | undefined {
  return COMPONENT_BY_ID.get(id);
}
