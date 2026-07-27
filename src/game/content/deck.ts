/**
 * The two decks: 15 styles × 15 components = 225 Secrets from 30 authored items.
 *
 * A round draws one of each. Both halves are hidden from the Chameleon, and
 * neither repeats within a match.
 *
 * Every entry passes the four screening rules in `projectInfo/cards.md`:
 * expressible as container-plus-one-child, identity surviving meaningless copy,
 * needing several distinct moves, and built from different moves than its
 * siblings.
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
  style("windows-95", "grey fill, hard outset bevel, black title strip, system font"),
  style("web-2-glossy", "rounded, vertical gradient, top highlight, drop shadow"),
  style("brutalist", "thick black border, zero radius, system font, hard offset shadow"),
  style("skeuomorphic", "textured gradient, inset shadow, bevelled edge"),
  style("material", "bold accent fill, elevation shadow, uppercase medium type"),
  style("neumorphic", "fill matching the background, dual light and dark shadows, soft radius"),
  style("glassmorphism", "translucent fill, backdrop-filter blur, thin light border"),
  style("bootstrap", "pale tinted fill, thin border, small radius, muted darker text"),
  style("dos-terminal", "black fill, green monospace, zero radius"),
  style("flat-design", "solid saturated fill, no shadow, no gradient, small radius"),
  style("metro-tile", "perfect square, flat saturated fill, white type bottom-left"),
  style("y2k-chrome", "silver gradient, bevel, blue glow, heavy weight"),
  style("vaporwave", "magenta-to-cyan gradient, wide letter-spacing, glow"),
  style("claymorphic", "puffy, very high radius, pastel, soft inner and outer shadow"),
  style("wireframe", "no fill, grey dashed border, monospace, low contrast"),
];

/**
 * What it is. Each is a distinct silhouette built from container plus child.
 */
export const COMPONENTS: Card[] = [
  component("progress-bar", "wide track, colored fill at part width"),
  component("range-slider", "thin track, round thumb"),
  component("toggle-switch", "pill track, circular knob at one end"),
  component("avatar", "circle, centred initials"),
  component("notification-badge", "small circle, number, offset to a corner"),
  component("tag-chip", "small pill, soft fill, tiny text"),
  component("tooltip", "small dark rounded box, small text"),
  component("search-bar", "wide rounded input, placeholder"),
  component("alert-banner", "full-width strip, tinted, glyph beside text"),
  component("modal-dialog", "centred panel, shadow, a button inside"),
  component("icon-button", "square, one glyph centred, no label"),
  component("segmented-control", "wide bordered track, one filled active segment"),
  component("checkbox", "small square, check glyph, label beside"),
  // Only playable because the canvas is code: its identity is having no content.
  component("skeleton-loader", "grey rounded bars, deliberately no content"),
  component("keyboard-key", "small bordered kbd, monospace glyph, subtle depth"),
];

const STYLE_BY_ID = new Map(STYLES.map((c) => [c.id, c]));
const COMPONENT_BY_ID = new Map(COMPONENTS.map((c) => [c.id, c]));

export function getStyle(id: string): Card | undefined {
  return STYLE_BY_ID.get(id);
}

export function getComponent(id: string): Card | undefined {
  return COMPONENT_BY_ID.get(id);
}
