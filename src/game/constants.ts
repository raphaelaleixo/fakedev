import type { SeatColor } from "./types";

/** Lobby bounds. Seats are symmetric; exactly one Chameleon regardless of size. */
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 10;

/** Two full trips around the table — a round is `TURNS_PER_PLAYER * N` turns. */
export const TURNS_PER_PLAYER = 2;

/** A match ends the instant any player reaches this, evaluated at end of round. */
export const TARGET_SCORE = 5;

/** Chameleon escapes, or steals correctly. Nobody else scores. */
export const CHAMELEON_POINTS = 3;
/** Each player who voted for a caught Chameleon who then failed the steal. */
export const CORRECT_VOTER_POINTS = 1;

/** The caught Chameleon's slate is their Secret's similarity group, shuffled. */
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
 * Seat colors. Used to tint inspector lines by author and to identify players
 * in the turn rail — never as CSS values in the render, which has its own
 * swatch palette.
 *
 * Tuned for the *light* inspector: each one has to hold contrast as text on
 * white and stay distinct from the other nine. The lighter tints that read well
 * on a dark panel are unusable here.
 */
export const SEAT_COLORS: Record<SeatColor, string> = {
  crimson: "#e11d48",
  amber: "#b45309",
  lime: "#4d7c0f",
  emerald: "#047857",
  teal: "#0f766e",
  sky: "#0369a1",
  indigo: "#4338ca",
  violet: "#7c3aed",
  magenta: "#a21caf",
  slate: "#475569",
};

/** Assignment order for seats 1..MAX_PLAYERS. */
export const SEAT_COLOR_ORDER: SeatColor[] = [
  "crimson",
  "sky",
  "amber",
  "emerald",
  "violet",
  "teal",
  "magenta",
  "lime",
  "indigo",
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
