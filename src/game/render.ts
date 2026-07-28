import { LOREM } from "./constants";
import type { RenderElement, RenderTree } from "./types";

/**
 * Serializes the folded tree into the HTML the Render Window displays.
 *
 * Four elements at most, all of them divs and spans. There are no tags to
 * choose and no attributes to set, so the only thing that varies is the CSS —
 * every shape on screen was drawn by somebody.
 *
 * The stage is an iframe with an empty `sandbox`, so scripts can't run there
 * even if something slipped through. The escaping below is still the first
 * line: declaration values are free-form, and a stray quote should never become
 * markup.
 */

/** Property names must be plain identifiers; anything else is dropped. */
const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9-]*$/;

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function styleAttribute(element: RenderElement): string {
  const styles = Object.entries(element.styles)
    .filter(([property]) => IDENTIFIER.test(property))
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
  return styles ? ` style="${escapeText(styles)}"` : "";
}

export function renderTreeToHtml(tree: RenderTree): string {
  const span = (which: "outer-text" | "inner-text") =>
    tree[which].present ? `<span${styleAttribute(tree[which])}>${LOREM}</span>` : "";

  const inner = `<div${styleAttribute(tree.inner)}>${span("inner-text")}</div>`;
  return `<div${styleAttribute(tree.outer)}>${span("outer-text")}${inner}</div>`;
}

/**
 * The stage's own background is deliberately *not* flat — `backdrop-filter`
 * needs something behind it or Glassmorphism renders as nothing. Kept faint so
 * it never competes with the component under construction.
 */
const STAGE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    display: grid;
    place-items: center;
    padding: 24px;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #202124;
    background:
      radial-gradient(600px circle at 22% 18%, #e8f0fe 0%, transparent 60%),
      radial-gradient(520px circle at 78% 74%, #fdeaf3 0%, transparent 55%),
      #ffffff;
  }
`;

/** The full document handed to the sandboxed stage iframe. */
export function buildStageDocument(tree: RenderTree): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${STAGE_CSS}</style></head><body>${renderTreeToHtml(tree)}</body></html>`;
}
