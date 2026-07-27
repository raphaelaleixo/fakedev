import { SEAT_COLOR_ORDER } from "./constants";
import { createRound, type Rng } from "./round";
import type { MatchState, SeatColor } from "./types";

/**
 * Opens a match and deals its first round in one value, so the room can be
 * flipped to "started" and given its game state in a single write — a client
 * never observes a started room with no round in it.
 */
export function startMatch(seats: number[], rng?: Rng): MatchState {
  return {
    status: "playing",
    seats,
    scores: {},
    usedSecretIds: [],
    round: createRound({ index: 0, seats, usedSecretIds: [], rng }),
  };
}

/**
 * Deals the next round after the previous one resolved. The round index is
 * derived from the used pile rather than tracked separately, so it can't drift
 * out of sync with the deck.
 */
export function startNextRound(match: MatchState, rng?: Rng): MatchState {
  if (match.status === "finished") {
    throw new Error("Match is finished; no further rounds.");
  }
  return {
    ...match,
    round: createRound({
      index: match.usedSecretIds.length,
      seats: match.seats,
      usedSecretIds: match.usedSecretIds,
      rng,
    }),
  };
}

/**
 * A seat's color, fixed by slot id. Stable across rejoins because inspector
 * lines are tinted by author — a color that moved would rewrite the history of
 * who drew what.
 */
export function seatColorFor(playerId: number): SeatColor {
  return SEAT_COLOR_ORDER[(playerId - 1) % SEAT_COLOR_ORDER.length];
}
