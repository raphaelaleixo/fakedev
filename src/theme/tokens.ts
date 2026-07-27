/**
 * Design tokens — a bold duotone: Dutch orange against deep ink.
 *
 * Two colours carry the whole app: chrome, type, backgrounds, buttons, the
 * countdown, the result screens, the controller. Everything is one of them, a
 * tint of ink, or white.
 *
 * Two things sit outside the pair, and both earn it:
 *
 *  1. **Seat colours** (`SEAT_COLORS` in game/constants) — ten distinguishable
 *     hues are a mechanic, not decoration. Inspector lines are tinted by author
 *     and the turn rail identifies players.
 *  2. **The render stage** — white, because real components are authored
 *     against white. It reads as a window punched into the duotone frame.
 */

export const color = {
  /** The brand. Fills, large type, the skyline, the active state. */
  flame: "#ff972e",
  /** The dark field. Covers, ceremony screens, controller chrome. */
  ink: "#101935",
  /**
   * Secondary text. The app is dark, so this is ink *lightened* — see
   * `mutedOnPaper` for the handful of light surfaces that survive.
   */
  muted: "#9aa2bd",
  /** The render stage, and light surfaces generally. */
  paper: "#ffffff",
  /** Text sitting on the flame field. Warmer than ink, and darker than it needs
   * to be — the lighter orange gives us the room. */
  onFlame: "#241100",

  // Syntax roles. The inspector used to quote Chrome DevTools' four hues
  // literally; under a duotone that isn't available, so they're re-keyed onto
  // the pair and differentiated by weight and position instead of by hue.
  inkTag: "#ff972e",
  inkAttr: "#9aa2bd",
  inkValue: "#ffffff",
  inkPunct: "#5f6784",
  /** A pane lifted off the ink field — the inspector, panel headers. */
  inkPanel: "#18213f",
  /** Hairlines on the ink field. */
  inkRule: "#26304f",
} as const;

export const font = {
  /** Used big and used flat: the wordmark, the countdown, the winner. */
  display: '"Bricolage Grotesque", system-ui, sans-serif',
  /** The interface voice. This game's chrome is code, so mono is not a costume. */
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  /** Prose only — rules, instructions. Mono at length is punishing. */
  prose: 'system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;

/** Flat shapes, hard edges. Nothing here is rounded much and nothing is shadowed. */
export const radius = {
  none: 0,
  sm: 2,
  md: 4,
} as const;
