/**
 * Design tokens.
 *
 * The whole game is a browser inspector, so the palette is lifted from the one
 * real artifact in the subject's world: the Chrome DevTools Elements panel in
 * *light* mode. Those syntax colors — the magenta tag names, the rust attribute
 * names, the deep blue values — are instantly legible to this audience and
 * belong to nothing else.
 *
 * Light rather than the expected dark terminal, deliberately: the canvas is a
 * rendered web component, and components are authored against white. Dark
 * chrome would fight every single render the game produces.
 */

export const color = {
  /** The canvas, and the render window's own background. */
  paper: "#ffffff",
  /** DevTools' toolbar grey — panels, headers, the inspector gutter. */
  chrome: "#f1f3f4",
  /** Hairline rules. DevTools separates with 1px, never with shadow. */
  rule: "#d9dce0",
  /** Tag names. The accent color of the whole product. */
  tag: "#881280",
  /** Attribute names. */
  attr: "#994500",
  /** Attribute values and strings. */
  value: "#1a1aa6",
  /** Body text — Chrome's grey-900. */
  ink: "#202124",
  /** Secondary text, comments, the muted half of everything. */
  muted: "#5f6368",
  /** DevTools' selected-node blue. Used for the active turn and fresh joins. */
  selection: "#cfe8fc",
  /** Destructive / the Chameleon reveal. */
  alarm: "#c5221f",
} as const;

export const font = {
  /** Used with restraint: the wordmark, round numbers, the winner. */
  display: '"Bricolage Grotesque", system-ui, sans-serif',
  /** The interface voice. This game's chrome is code, so mono is not a costume. */
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  /** Prose only — rules, instructions. Mono at length is punishing. */
  prose: 'system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;

/** DevTools is built on 1px rules and 4px rhythm. Nothing here is rounded much. */
export const radius = {
  none: 0,
  sm: 2,
  md: 4,
} as const;
