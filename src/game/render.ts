import type { RenderElement, RenderTree } from "./types";

/**
 * Serializes the folded tree into the HTML the Render Window displays.
 *
 * The stage is an iframe with an empty `sandbox`, so scripts can't run there
 * even if something slipped through. The escaping below is still the first
 * line: text slots are free-form by design, and a stray `<` should render as a
 * character rather than as markup — that's correctness for the player before
 * it's safety for us.
 */

/** Elements that cannot hold children. A void `inner` swallows the text slot. */
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/**
 * Attributes whose presence alone is the state. Stored as "true"/"false" so an
 * override can turn one back off.
 */
const BOOLEAN_ATTRIBUTES = new Set(["disabled", "checked", "required", "readonly"]);

/** Tag and attribute names must be plain identifiers; anything else is dropped. */
const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9-]*$/;

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeAttributes(element: RenderElement): string {
  const parts: string[] = [];

  for (const [name, value] of Object.entries(element.attributes)) {
    if (!IDENTIFIER.test(name)) continue;
    if (BOOLEAN_ATTRIBUTES.has(name)) {
      if (value === "true") parts.push(name);
      continue;
    }
    parts.push(`${name}="${escapeText(value)}"`);
  }

  const styles = Object.entries(element.styles)
    .filter(([property]) => IDENTIFIER.test(property))
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
  if (styles) parts.push(`style="${escapeText(styles)}"`);

  return parts.length ? ` ${parts.join(" ")}` : "";
}

function renderElement(element: RenderElement, children: string): string {
  const tag = IDENTIFIER.test(element.tag) ? element.tag : "div";
  const open = `<${tag}${serializeAttributes(element)}>`;
  if (VOID_ELEMENTS.has(tag)) return open;
  return `${open}${children}</${tag}>`;
}

export function renderTreeToHtml(tree: RenderTree): string {
  const inner = renderElement(tree.inner, escapeText(tree.text));
  return renderElement(tree.outer, `${escapeText(tree.label)}${inner}`);
}

/**
 * The stage's own background is deliberately *not* flat — `backdrop-filter`
 * needs something behind it or the Glassmorphism card renders as nothing. Kept
 * faint so it never competes with the component under construction.
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
