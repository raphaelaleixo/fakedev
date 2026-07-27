import { describe, expect, test } from "vitest";
import { seatColorFor, startMatch, startNextRound } from "./match";
import { MAX_PLAYERS, SEAT_COLOR_ORDER } from "./constants";
import { ALL_SECRETS } from "./content/deck";
import type { MatchState } from "./types";

const seats = [1, 2, 3, 4];
const rng = () => 0.5;

describe("startMatch", () => {
  test("opens a match with a clean scoreboard", () => {
    const match = startMatch(seats, rng);
    expect(match.status).toBe("playing");
    expect(match.seats).toEqual(seats);
    expect(match.scores).toEqual({});
    expect(match.usedSecretIds).toEqual([]);
    expect(match.winnerIds).toBeUndefined();
  });

  test("deals the first round immediately, so the room never sits started-but-empty", () => {
    const match = startMatch(seats, rng);
    expect(match.round?.index).toBe(0);
    expect(match.round?.phase).toBe("turns");
    expect([...match.round!.turnOrder].sort()).toEqual(seats);
  });
});

describe("startNextRound", () => {
  const played: MatchState = {
    status: "playing",
    seats,
    scores: { 1: 3 },
    usedSecretIds: ["form-states/disabled-button"],
    round: null,
  };

  test("deals the next round without touching the scoreboard", () => {
    const next = startNextRound(played, rng);
    expect(next.round?.index).toBe(1);
    expect(next.scores).toEqual({ 1: 3 });
  });

  test("never deals a Secret already played this match", () => {
    const next = startNextRound(played, rng);
    expect(next.round?.secretId).not.toBe("form-states/disabled-button");
  });

  test("counts the round index off the used pile, so it survives a reload", () => {
    const deep = { ...played, usedSecretIds: ALL_SECRETS.slice(0, 7).map((s) => s.id) };
    expect(startNextRound(deep, rng).round?.index).toBe(7);
  });

  test("refuses to deal into a finished match", () => {
    const finished: MatchState = { ...played, status: "finished", winnerIds: [1] };
    expect(() => startNextRound(finished, rng)).toThrow(/finished/i);
  });
});

describe("seatColorFor", () => {
  test("gives every seat at a full table a distinct color", () => {
    const colors = new Set(
      Array.from({ length: MAX_PLAYERS }, (_, i) => seatColorFor(i + 1)),
    );
    expect(colors.size).toBe(MAX_PLAYERS);
  });

  test("keeps a seat's color stable across rejoins", () => {
    expect(seatColorFor(3)).toBe(seatColorFor(3));
    expect(seatColorFor(1)).toBe(SEAT_COLOR_ORDER[0]);
  });
});
