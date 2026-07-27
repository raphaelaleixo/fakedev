/**
 * The CSS property list and the value gate.
 *
 * Both come from the browser rather than a data package: `mdn-data` is 733 KB
 * and `css-tree` is 1.36 MB, while the browser already knows every property it
 * supports and `CSS.supports` already parses every value. Zero bytes shipped,
 * and it can't go stale.
 *
 * The catch, learned the hard way: **browsers disagree about where the property
 * list lives.** Chrome exposes almost nothing on `CSSStyleDeclaration.prototype`
 * — a real reading was `["cssText", "cssFloat"]` — and keeps the list on
 * computed style. jsdom does the reverse: a bare computed style and ~1600
 * accessors on the prototype. Reading only one source silently yields an empty
 * autocomplete with no error anywhere, so both are merged.
 */

export type SupportsFn = (property: string, value: string) => boolean;

/**
 * Where property names are read from. Injectable so the environment differences
 * above can be tested instead of discovered in a browser.
 */
export interface PropertySource {
  /** Names from computed style. Already kebab-case. Chrome's real list. */
  computed: () => string[];
  /** Candidate names off a style object. camelCase. jsdom's real list. */
  declared: () => string[];
  /** Whether a declared name is an actual property rather than a CSSOM method. */
  isProperty: (name: string) => boolean;
}

/** `backgroundColor` -> `background-color`, so a name can be written as CSS. */
export function toKebabCase(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function domPropertySource(): PropertySource {
  const style = document.createElement("div").style;
  return {
    computed: () => {
      const computed = getComputedStyle(document.documentElement);
      return Array.from({ length: computed.length }, (_, i) => computed.item(i));
    },
    declared: () => [
      ...Object.getOwnPropertyNames(style),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(style) ?? {}),
    ],
    // A real property reads back as a string; methods read back as functions.
    isProperty: (name) => typeof (style as unknown as Record<string, unknown>)[name] === "string",
  };
}

/** Every property this browser supports, kebab-case and sorted. */
export function supportedCssProperties(source?: PropertySource): string[] {
  if (!source && typeof document === "undefined") return [];
  const from = source ?? domPropertySource();

  const names = new Set<string>();
  const add = (candidate: string) => {
    const property = toKebabCase(candidate);
    // Excludes custom properties (`--x`), vendor prefixes and anything that
    // isn't a plain CSS identifier.
    if (property.startsWith("webkit") || property.startsWith("-")) return;
    if (!/^[a-z][a-z0-9-]*$/.test(property)) return;
    names.add(property);
  };

  for (const name of from.computed()) add(name);
  for (const name of from.declared()) {
    if (from.isProperty(name)) add(name);
  }

  return [...names].sort();
}

/** `CSS.supports` if this environment has it. jsdom does not; older browsers may not. */
export function nativeSupports(): SupportsFn | null {
  if (typeof CSS === "undefined") return null;
  const supports = (CSS as { supports?: unknown }).supports;
  if (typeof supports !== "function") return null;
  return (property, value) => {
    try {
      return (supports as SupportsFn).call(CSS, property, value);
    } catch {
      return false;
    }
  };
}

/**
 * Whether a declaration can be committed.
 *
 * This exists for the player, not for safety — the sandboxed stage handles
 * safety. A typo renders nothing, and a render that shows nothing is
 * indistinguishable from a deliberately vague play, so an invalid value must be
 * unsubmittable rather than quietly ignored.
 *
 * When the browser offers no `CSS.supports`, this degrades to permissive:
 * blocking every edit would make the game unplayable, and letting an odd value
 * through only costs that player their turn.
 */
export function isValidDeclaration(
  property: string,
  value: string,
  supports: SupportsFn | null = nativeSupports(),
): boolean {
  if (!property.trim() || !value.trim()) return false;
  if (!supports) return true;
  return supports(property, value);
}

/** Colour keywords a swatch cannot honestly draw — they depend on context. */
const UNDRAWABLE = new Set(["currentcolor", "transparent", "inherit", "initial", "unset", "revert"]);

/**
 * Whether a value is a colour worth previewing beside, the way DevTools shows a
 * swatch next to one.
 *
 * Asks the browser rather than pattern-matching hex and `rgb(`, so named
 * colours, `hsl()`, `color-mix()` and whatever lands next all work for free.
 *
 * Deliberately **strict** where `isValidDeclaration` is permissive: with no
 * `CSS.supports` available this returns false rather than guessing. A missing
 * swatch is invisible; a wrong one misreports what somebody played, and this
 * game is people reading each other's moves.
 */
export function isColorValue(
  value: string,
  supports: SupportsFn | null = nativeSupports(),
): boolean {
  const candidate = value.trim();
  if (!candidate || !supports) return false;
  if (UNDRAWABLE.has(candidate.toLowerCase())) return false;
  return supports("color", candidate);
}
