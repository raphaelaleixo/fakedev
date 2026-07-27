import type { SeatColor } from "./types";

/** Lobby bounds. Seats are symmetric; exactly one Chameleon regardless of size. */
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 10;

/** Two full trips around the table — a round is `TURNS_PER_PLAYER * N` turns. */
export const TURNS_PER_PLAYER = 2;

/** A match ends the instant any player reaches this, evaluated at end of round. */
export const TARGET_SCORE = 5;

/**
 * Chameleon escapes, or names both halves. The two pay the same, as they do in
 * the paper game — both are simply "the Chameleon won this round".
 */
export const CHAMELEON_POINTS = 2;
/** Caught, and named exactly one of the two halves. */
export const PARTIAL_STEAL_POINTS = 1;
/** Each player who caught a Chameleon that didn't fully recover. */
export const CORRECT_VOTER_POINTS = 1;

/** Five styles and five components, each slate including the true answer. */
export const STEAL_SLATE_SIZE = 5;

/**
 * A layout constraint, not an anti-cheat measure — a long string blows up the
 * render. Applies to `{label}`, `{text}`, and `aria-label`, which is invisible
 * on the render but every bit as loud on the inspector.
 */
export const TEXT_MAX_LENGTH = 24;

/** Pure social pressure. Nothing happens when it expires — no auto-play, no forfeit. */
export const SOFT_TIMER_SECONDS = 30;

/**
 * Seat colors — the one place the duotone opens up, because ten
 * distinguishable players is a mechanic rather than decoration.
 *
 * **Tuned to carry text on the ink field**, which is the only surface they ever
 * appear on now that the whole app is dark. Every one of them clears roughly
 * 4.5:1 against `ink`, so an edit can be written in its author's color and
 * still be read from across a room. `violet` and `indigo` are lighter than
 * their siblings for exactly that reason — at the saturation the others use,
 * both landed around 3:1 and would have been the two seats nobody could read.
 *
 * Nothing here sits near the brand orange, which would read as "the app"
 * rather than as a player.
 */
export const SEAT_COLORS: Record<SeatColor, string> = {
  crimson: "#f16a6f",
  rose: "#f2609b",
  violet: "#b48ae8",
  indigo: "#8098f0",
  sky: "#3aa9ff",
  cyan: "#22b8dd",
  teal: "#2cc0ad",
  emerald: "#45bd83",
  lime: "#a8dd4a",
  slate: "#a2a5b0",
};

/** Assignment order for seats 1..MAX_PLAYERS. */
export const SEAT_COLOR_ORDER: SeatColor[] = [
  "crimson",
  "sky",
  "lime",
  "violet",
  "teal",
  "rose",
  "indigo",
  "emerald",
  "cyan",
  "slate",
];

/**
 * The render's color palette — a direct port of the physical box's 12 pens.
 * Keeps "who used the ugly green" a usable clue. These are actual CSS values;
 * the free-form value field can still commit anything else.
 */
export const SWATCHES: string[] = [
  "#ffffff",
  "#000000",
  "#94a3b8",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
