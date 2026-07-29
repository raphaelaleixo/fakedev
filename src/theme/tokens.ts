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

/**
 * Dim a colour by mixing it toward a surface, not by making the element
 * translucent.
 *
 * `opacity` fades everything inside an element together and lets the page show
 * through, which is right for motion and wrong for state. These are states —
 * an inactive seat, an unlocked vote, a superseded declaration — and every one
 * of them carries a *hue* that has to survive the dimming, because the hue is
 * who. A flat muted token would erase that; mixing toward the surface keeps it
 * and produces an opaque colour.
 *
 * `oklab` rather than sRGB so a 55% mix looks like 55% at every hue.
 */
export const dim = (value: string, percent: number, toward: string = color.ink) =>
  `color-mix(in oklab, ${value} ${percent}%, ${toward})`;

export const font = {
  /** Used big and used flat: the wordmark, the countdown, the winner. */
  display: '"Bricolage Grotesque", system-ui, sans-serif',
  /** The interface voice. This game's chrome is code, so mono is not a costume. */
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  /** Prose only — rules, instructions. Mono at length is punishing. */
  prose: 'system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;

/**
 * A focus ring that survives both surfaces.
 *
 * `outline: currentColor` was wrong, and wrong in the worst place: the cover's
 * primary button is flame type on ink, sitting on the flame band, so the ring
 * was drawn *outside* the button in flame — on flame. Invisible. The colour of
 * an element's text says nothing about what is behind the element.
 *
 * Nothing single-coloured works everywhere here: paper reads on ink but barely
 * on flame, ink reads on flame but not on ink. So the ring is two, adjacent —
 * paper filling the offset gap, ink immediately outside it. Whichever surface
 * it lands on, one of the two contrasts with it, and the pair contrasts with
 * each other.
 */
export const focusRing = {
  outline: `2px solid ${color.ink}`,
  outlineOffset: 2,
  boxShadow: `0 0 0 2px ${color.paper}`,
} as const;

/**
 * Motion, as three easings and a scale of durations.
 *
 * These were literals scattered through the transition CSS — four spellings of
 * the same curve, eleven durations between 60ms and 560ms with nothing saying
 * which were meant to match. Naming them makes the choreography legible: things
 * arriving use `enter`, things leaving use `exit`, and anything travelling the
 * width of the screen uses `travel`.
 */
export const motion = {
  /** Decelerating: for anything arriving, which should settle rather than stop. */
  enter: "cubic-bezier(0.2, 0.8, 0.3, 1)",
  /** Accelerating: for anything leaving, which should get out of the way. */
  exit: "cubic-bezier(0.5, 0, 0.85, 0.3)",
  /** Even at both ends, for a surface crossing the whole viewport. */
  travel: "cubic-bezier(0.65, 0, 0.35, 1)",
  quick: "180ms",
  base: "340ms",
  slow: "460ms",
  /** The beat one thing waits so another can lead it. */
  stagger: "80ms",
} as const;

/** Flat shapes, hard edges. Nothing here is rounded much and nothing is shadowed. */
export const radius = {
  none: 0,
  sm: 2,
  md: 4,
} as const;
