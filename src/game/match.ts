import { SEAT_COLOR_ORDER } from "./constants";
import { applyRoundOutcome, createRound, type Rng } from "./round";
import type { MatchState, Round, SeatColor } from "./types";

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
    usedStyleIds: [],
    usedComponentIds: [],
    roundIndex: 0,
    round: createRound({ index: 0, seats, usedStyleIds: [], usedComponentIds: [], rng }),
  };
}

/**
 * Deals the next round after the previous one resolved.
 *
 * Neither half of the Secret can repeat, so both used pools are passed through.
 */
export function startNextRound(match: MatchState, rng?: Rng): MatchState {
  if (match.status === "finished") {
    throw new Error("Match is finished; no further rounds.");
  }
  const roundIndex = match.roundIndex + 1;
  return {
    ...match,
    roundIndex,
    round: createRound({
      index: roundIndex,
      seats: match.seats,
      usedStyleIds: match.usedStyleIds,
      usedComponentIds: match.usedComponentIds,
      rng,
    }),
  };
}

/**
 * Closes out a resolved round: banks its points, retires its Secret, and deals
 * the next one — unless somebody just reached the target, in which case the
 * match ends here and the finished round stays on screen so the table can read
 * the result rather than being cut straight to a scoreboard.
 */
export function advanceMatch(match: MatchState, round: Round, rng?: Rng): MatchState {
  const banked = applyRoundOutcome(match, round);
  if (banked.status === "finished") return { ...banked, round };
  return startNextRound(banked, rng);
}

/**
 * A seat's color, fixed by slot id. Stable across rejoins because inspector
 * lines are tinted by author — a color that moved would rewrite the history of
 * who drew what.
 */
export function seatColorFor(playerId: number): SeatColor {
  return SEAT_COLOR_ORDER[(playerId - 1) % SEAT_COLOR_ORDER.length];
}
