import { describe, expect, test } from "vitest";
import { advanceMatch, seatColorFor, startMatch, startNextRound } from "./match";
import { MAX_PLAYERS, SEAT_COLOR_ORDER } from "./constants";
import { ALL_SECRETS } from "./content/deck";
import type { MatchState, Round } from "./types";

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

describe("advanceMatch", () => {
  // Nothing banked yet, and the round below is index 0 — so the next round is 1.
  const base: MatchState = {
    status: "playing",
    seats,
    scores: { 1: 2 },
    usedSecretIds: [],
    round: null,
  };

  const resolved = (awards: Record<number, number>): Round => ({
    index: 0,
    categoryId: "form-states",
    secretId: "form-states/disabled-button",
    chameleonId: 3,
    phase: "result",
    turnOrder: seats,
    turnIndex: 8,
    edits: [],
    votes: {},
    outcome: {
      caughtPlayerId: 3,
      chameleonCaught: true,
      tied: false,
      stealCorrect: false,
      awards,
    },
  });

  test("banks the round's points", () => {
    const next = advanceMatch(base, resolved({ 1: 1, 2: 1 }), rng);
    expect(next.scores).toEqual({ 1: 3, 2: 1 });
  });

  test("deals the next round while the match is still live", () => {
    const next = advanceMatch(base, resolved({ 1: 1 }), rng);
    expect(next.status).toBe("playing");
    expect(next.round?.phase).toBe("turns");
    expect(next.round?.index).toBe(1);
  });

  test("does not deal a Secret already played", () => {
    const next = advanceMatch(base, resolved({ 1: 1 }), rng);
    expect(next.round?.secretId).not.toBe("form-states/disabled-button");
  });

  test("ends the match instead of dealing when someone reaches the target", () => {
    const next = advanceMatch(base, resolved({ 1: 3 }), rng);
    expect(next.status).toBe("finished");
    expect(next.winnerIds).toEqual([1]);
  });

  test("keeps the finished round on screen so the result can be read", () => {
    const next = advanceMatch(base, resolved({ 1: 3 }), rng);
    expect(next.round?.outcome).toBeDefined();
    expect(next.round?.phase).toBe("result");
  });

  test("refuses a round that has not resolved", () => {
    const unresolved = { ...resolved({}), outcome: undefined };
    expect(() => advanceMatch(base, unresolved, rng)).toThrow(/outcome/i);
  });
});
