/**
 * Authored suggestions for the value step.
 *
 * These are *not* a whitelist. The property step shows them as browsable chips
 * (discovery, for a player who doesn't know a concept exists) and falls through
 * to every property the browser supports when you type (recall, for a fluent
 * dev). Keys with an entry here get a typed editor; everything else gets a
 * free-form field gated on `CSS.supports`.
 *
 * CSS only — there are no tags and no attributes in the game.
 */

import type { EnumOption, KeySchemaEntry } from "../types";

/** Enum chip where the label reads the same as the CSS. */
const o = (value: string): EnumOption => ({ label: value, value });
const LENGTH_UNITS = ["px", "%", "rem", "em"];

export const STYLE_SCHEMA: KeySchemaEntry[] = [
  // --- Box ---------------------------------------------------------------
  {
    key: "display",
    valueType: "enum",
    options: ["block", "flex", "inline-flex", "inline-block", "grid", "none"].map(o),
  },
  {
    // row-reverse / column-reverse invert the fixed span-before-inner order —
    // the difference between a label beside a box and a box beside a label.
    key: "flex-direction",
    valueType: "enum",
    options: ["row", "row-reverse", "column", "column-reverse"].map(o),
  },
  {
    key: "align-items",
    valueType: "enum",
    options: ["flex-start", "center", "flex-end", "stretch", "baseline"].map(o),
  },
  {
    key: "justify-content",
    valueType: "enum",
    options: [
      "flex-start",
      "center",
      "flex-end",
      "space-between",
      "space-around",
    ].map(o),
  },
  { key: "gap", valueType: "length", units: LENGTH_UNITS, min: 0, max: 64, step: 2 },
  { key: "padding", valueType: "length", units: LENGTH_UNITS, min: 0, max: 96, step: 2 },
  { key: "margin", valueType: "length", units: LENGTH_UNITS, min: 0, max: 96, step: 2 },
  { key: "width", valueType: "length", units: LENGTH_UNITS, min: 0, max: 480, step: 4 },
  { key: "height", valueType: "length", units: LENGTH_UNITS, min: 0, max: 480, step: 4 },

  // --- Surface -----------------------------------------------------------
  { key: "background-color", valueType: "color" },
  { key: "color", valueType: "color" },
  {
    // Gradients are composite, so this is free-form by design — that's what
    // lets Vaporwave, Y2K Chrome and Web 2.0 Glossy exist without presets
    // whose names would give the era away.
    key: "background-image",
    valueType: "freetext",
  },
  { key: "opacity", valueType: "length", units: [""], min: 0, max: 1, step: 0.1 },

  // --- Border ------------------------------------------------------------
  { key: "border-width", valueType: "length", units: ["px"], min: 0, max: 16, step: 1 },
  {
    key: "border-style",
    valueType: "enum",
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
  { key: "border-color", valueType: "color" },
  { key: "border-radius", valueType: "length", units: ["px", "%"], min: 0, max: 64, step: 2 },

  // --- Depth -------------------------------------------------------------
  // Composite values: a dual shadow, an inset, an elevation. Free-form.
  { key: "box-shadow", valueType: "freetext" },
  { key: "text-shadow", valueType: "freetext" },

  // --- Type --------------------------------------------------------------
  {
    key: "font-family",
    valueType: "enum",
    options: [
      // Generic families rather than named stacks. Deterministic faces are a
      // pending job — see the font-bundling plan.
      o("sans-serif"),
      o("serif"),
      o("monospace"),
      o("cursive"),
      o("fantasy"),
      o("system-ui"),
    ],
  },
  { key: "font-size", valueType: "length", units: ["px", "rem", "em"], min: 8, max: 72, step: 1 },
  {
    key: "font-weight",
    valueType: "enum",
    options: ["300", "400", "500", "600", "700", "900"].map(o),
  },
  {
    key: "font-style",
    valueType: "enum",
    options: ["normal", "italic"].map(o),
  },
  {
    key: "text-align",
    valueType: "enum",
    options: ["left", "center", "right", "justify"].map(o),
  },
  { key: "letter-spacing", valueType: "length", units: ["px", "em"], min: -2, max: 16, step: 0.5 },
  {
    key: "text-transform",
    valueType: "enum",
    options: ["none", "uppercase", "lowercase", "capitalize"].map(o),
  },
  {
    key: "text-decoration",
    valueType: "enum",
    options: ["none", "underline", "line-through", "overline"].map(o),
  },

  // --- Effects -----------------------------------------------------------
  // All function-valued, so all free-form. `backdrop-filter` needs a non-flat
  // canvas behind the stage to read at all — see the render window.
  { key: "filter", valueType: "freetext" },
  { key: "backdrop-filter", valueType: "freetext" },
  { key: "mask-image", valueType: "freetext" },

  // --- Misc --------------------------------------------------------------
  {
    key: "cursor",
    valueType: "enum",
    options: ["pointer", "not-allowed", "default", "text", "wait"].map(o),
  },
  {
    key: "overflow",
    valueType: "enum",
    options: ["visible", "hidden", "auto", "scroll"].map(o),
  },
];

const SCHEMA_BY_KEY = new Map<string, KeySchemaEntry>(
  STYLE_SCHEMA.map((entry) => [entry.key, entry]),
);

/** The typed editor for a property, or undefined when it falls through to free-form. */
export function getKeySchema(key: string): KeySchemaEntry | undefined {
  return SCHEMA_BY_KEY.get(key);
}
