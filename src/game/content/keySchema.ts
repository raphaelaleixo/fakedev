/**
 * Authored suggestions for the turn composer.
 *
 * These are *not* a whitelist. The property step shows them as browsable chips
 * (discovery, for a player who doesn't know a concept exists) and falls through
 * to every property the browser supports when you type (recall, for a fluent
 * dev). Keys with an entry here get a typed editor; everything else gets a
 * free-form field gated on `CSS.supports`. See `projectInfo/decisions.md`.
 *
 * Nothing here is load-bearing for correctness — dropping an entry costs a
 * chip, not a capability.
 */

import { TEXT_MAX_LENGTH } from "../constants";
import type { ElementTarget, EnumOption, KeySchemaEntry } from "../types";

const BOTH: ElementTarget[] = ["outer", "inner"];

/** Enum chip where the label reads the same as the CSS. */
const o = (value: string): EnumOption => ({ label: value, value });
/** Enum chip where the CSS is unreadable as a label. */
const named = (label: string, value: string): EnumOption => ({ label, value });

/**
 * Tag suggestions. `input` is void — setting `inner` to `input` kills the
 * `{text}` slot for the rest of the round, which is exactly what the second
 * text slot exists to survive, and a good tell.
 */
export const TAG_SUGGESTIONS: string[] = [
  "div",
  "span",
  "p",
  "button",
  "input",
  "label",
  "a",
  "section",
  "form",
  "kbd",
  "code",
];

export const ATTRIBUTE_SCHEMA: KeySchemaEntry[] = [
  {
    key: "type",
    kind: "attribute",
    valueType: "enum",
    appliesTo: BOTH,
    options: [
      "text",
      "password",
      "checkbox",
      "radio",
      "range",
      "email",
      "search",
      "file",
      "submit",
      "number",
    ].map(o),
  },
  {
    key: "placeholder",
    kind: "attribute",
    valueType: "freetext",
    appliesTo: BOTH,
    maxLength: TEXT_MAX_LENGTH,
  },
  {
    key: "value",
    kind: "attribute",
    valueType: "freetext",
    appliesTo: BOTH,
    maxLength: TEXT_MAX_LENGTH,
  },
  { key: "disabled", kind: "attribute", valueType: "boolean", appliesTo: BOTH },
  { key: "checked", kind: "attribute", valueType: "boolean", appliesTo: BOTH },
  { key: "required", kind: "attribute", valueType: "boolean", appliesTo: BOTH },
  { key: "readonly", kind: "attribute", valueType: "boolean", appliesTo: BOTH },
  {
    // Invisible on the render, fully visible on the inspector — effectively a
    // third text slot, so it carries the same cap as {label} and {text}.
    key: "aria-label",
    kind: "attribute",
    valueType: "freetext",
    appliesTo: BOTH,
    maxLength: TEXT_MAX_LENGTH,
  },
  {
    key: "role",
    kind: "attribute",
    valueType: "enum",
    appliesTo: BOTH,
    options: [
      "button",
      "checkbox",
      "switch",
      "alert",
      "status",
      "dialog",
      "progressbar",
      "banner",
      "link",
      "tooltip",
    ].map(o),
  },
];

const LENGTH_UNITS = ["px", "%", "rem", "em"];

export const STYLE_SCHEMA: KeySchemaEntry[] = [
  // --- Box ---------------------------------------------------------------
  {
    key: "display",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["block", "flex", "inline-flex", "inline-block", "grid", "none"].map(o),
  },
  {
    // row-reverse / column-reverse invert the fixed {label}-before-inner slot
    // order. The structure audit found CAPTCHA and Character Counter need it,
    // and it's the discoverable trick the spec wants left in.
    key: "flex-direction",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["row", "row-reverse", "column", "column-reverse"].map(o),
  },
  {
    key: "align-items",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["flex-start", "center", "flex-end", "stretch", "baseline"].map(o),
  },
  {
    key: "justify-content",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: [
      "flex-start",
      "center",
      "flex-end",
      "space-between",
      "space-around",
    ].map(o),
  },
  { key: "gap", kind: "style", valueType: "length", appliesTo: BOTH, units: LENGTH_UNITS, min: 0, max: 64, step: 2 },
  { key: "padding", kind: "style", valueType: "length", appliesTo: BOTH, units: LENGTH_UNITS, min: 0, max: 96, step: 2 },
  { key: "margin", kind: "style", valueType: "length", appliesTo: BOTH, units: LENGTH_UNITS, min: 0, max: 96, step: 2 },
  { key: "width", kind: "style", valueType: "length", appliesTo: BOTH, units: LENGTH_UNITS, min: 0, max: 480, step: 4 },
  { key: "height", kind: "style", valueType: "length", appliesTo: BOTH, units: LENGTH_UNITS, min: 0, max: 480, step: 4 },

  // --- Surface -----------------------------------------------------------
  { key: "background-color", kind: "style", valueType: "color", appliesTo: BOTH },
  { key: "color", kind: "style", valueType: "color", appliesTo: BOTH },
  {
    // Gradients are composite, so this is free-form by design — that's what
    // lets Vaporwave, Y2K Chrome and Web 2.0 Glossy exist without presets
    // whose names would give the era away.
    key: "background-image",
    kind: "style",
    valueType: "freetext",
    appliesTo: BOTH,
  },
  { key: "opacity", kind: "style", valueType: "length", appliesTo: BOTH, units: [""], min: 0, max: 1, step: 0.1 },

  // --- Border ------------------------------------------------------------
  { key: "border-width", kind: "style", valueType: "length", appliesTo: BOTH, units: ["px"], min: 0, max: 16, step: 1 },
  {
    key: "border-style",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: [
      "solid",
      "dashed",
      "dotted",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset",
      "none",
    ].map(o),
  },
  { key: "border-color", kind: "style", valueType: "color", appliesTo: BOTH },
  { key: "border-radius", kind: "style", valueType: "length", appliesTo: BOTH, units: ["px", "%"], min: 0, max: 64, step: 2 },

  // --- Depth -------------------------------------------------------------
  // Composite values: a dual shadow, an inset, an elevation. Free-form.
  { key: "box-shadow", kind: "style", valueType: "freetext", appliesTo: BOTH },
  { key: "text-shadow", kind: "style", valueType: "freetext", appliesTo: BOTH },

  // --- Type --------------------------------------------------------------
  {
    key: "font-family",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: [
      named("System", "system-ui, sans-serif"),
      named("Serif", "Georgia, serif"),
      named("Monospace", '"Courier New", monospace'),
      named("Impact", "Impact, sans-serif"),
      named("Comic Sans", '"Comic Sans MS", cursive'),
      named("Arial", "Arial, Helvetica, sans-serif"),
      named("Times", '"Times New Roman", serif'),
    ],
  },
  { key: "font-size", kind: "style", valueType: "length", appliesTo: BOTH, units: ["px", "rem", "em"], min: 8, max: 72, step: 1 },
  {
    key: "font-weight",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["300", "400", "500", "600", "700", "900"].map(o),
  },
  {
    key: "font-style",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["normal", "italic"].map(o),
  },
  {
    key: "text-align",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["left", "center", "right", "justify"].map(o),
  },
  { key: "letter-spacing", kind: "style", valueType: "length", appliesTo: BOTH, units: ["px", "em"], min: -2, max: 16, step: 0.5 },
  {
    key: "text-transform",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["none", "uppercase", "lowercase", "capitalize"].map(o),
  },
  {
    key: "text-decoration",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["none", "underline", "line-through", "overline"].map(o),
  },

  // --- Effects -----------------------------------------------------------
  // All function-valued, so all free-form. `backdrop-filter` needs a non-flat
  // canvas behind the stage to read at all — see the render window.
  { key: "filter", kind: "style", valueType: "freetext", appliesTo: BOTH },
  { key: "backdrop-filter", kind: "style", valueType: "freetext", appliesTo: BOTH },
  { key: "mask-image", kind: "style", valueType: "freetext", appliesTo: BOTH },

  // --- Misc --------------------------------------------------------------
  {
    key: "cursor",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["pointer", "not-allowed", "default", "text", "wait"].map(o),
  },
  {
    key: "overflow",
    kind: "style",
    valueType: "enum",
    appliesTo: BOTH,
    options: ["visible", "hidden", "auto", "scroll"].map(o),
  },
];

const SCHEMA_BY_KIND_AND_KEY = new Map<string, KeySchemaEntry>(
  [...ATTRIBUTE_SCHEMA, ...STYLE_SCHEMA].map((e) => [`${e.kind}|${e.key}`, e]),
);

/** The typed editor for a key, or undefined when it falls through to free-form. */
export function getKeySchema(
  kind: "attribute" | "style",
  key: string,
): KeySchemaEntry | undefined {
  return SCHEMA_BY_KIND_AND_KEY.get(`${kind}|${key}`);
}
