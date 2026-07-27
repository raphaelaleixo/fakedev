import { describe, expect, test } from "vitest";
import {
  activePlayerId,
  applyRoundOutcome,
  beginVoting,
  buildStealSlate,
  castVote,
  createRound,
  resolveRound,
  resolveVotes,
  scoreRound,
  submitEdit,
  submitSteal,
  tallyVotes,
  totalTurns,
} from "./round";
import { ALL_SECRETS, getCategory, getSecret } from "./content/deck";
import type { Edit, MatchState, Round } from "./types";

describe("tallyVotes", () => {
  test("counts votes per suspect", () => {
    const { counts } = tallyVotes({ 1: 3, 2: 3, 3: 1 });
    expect(counts).toEqual({ 3: 2, 1: 1 });
  });

  test("names the single most-pointed player", () => {
    const { mostPointed } = tallyVotes({ 1: 3, 2: 3, 3: 1 });
    expect(mostPointed).toEqual([3]);
  });

  test("names every player tied for most-pointed", () => {
    const { mostPointed } = tallyVotes({ 1: 2, 2: 1, 3: 4, 4: 3 });
    expect([...mostPointed].sort()).toEqual([1, 2, 3, 4]);
  });

  test("returns nobody when there are no votes", () => {
    expect(tallyVotes({})).toEqual({ counts: {}, mostPointed: [] });
  });
});

describe("resolveVotes", () => {
  test("catches the Chameleon when they are alone at the top", () => {
    expect(resolveVotes({ 1: 3, 2: 3, 3: 1 }, 3)).toEqual({
      caughtPlayerId: 3,
      tied: false,
      chameleonCaught: true,
    });
  });

  test("catches the wrong player when the Devs misfire", () => {
    expect(resolveVotes({ 1: 2, 2: 2, 3: 2 }, 3)).toEqual({
      caughtPlayerId: 2,
      tied: false,
      chameleonCaught: false,
    });
  });

  test("lets the Chameleon escape on a tie, catching nobody", () => {
    expect(resolveVotes({ 1: 3, 2: 1 }, 3)).toEqual({
      caughtPlayerId: null,
      tied: true,
      chameleonCaught: false,
    });
  });

  test("lets the Chameleon escape even when they are in the tie", () => {
    // Seats 2 and 3 both draw two votes; the Chameleon is 3.
    const result = resolveVotes({ 1: 3, 2: 3, 3: 2, 4: 2 }, 3);
    expect(result.chameleonCaught).toBe(false);
    expect(result.caughtPlayerId).toBeNull();
    expect(result.tied).toBe(true);
  });
});

describe("scoreRound", () => {
  test("pays the Chameleon 3 when the Devs catch the wrong player", () => {
    const awards = scoreRound({
      chameleonId: 3,
      votes: { 1: 2, 2: 2, 3: 2, 4: 1 },
      stealGuess: null,
      secretId: "form-states/disabled-button",
    });
    expect(awards).toEqual({ 3: 3 });
  });

  test("pays the Chameleon 3 when the vote ties", () => {
    const awards = scoreRound({
      chameleonId: 3,
      votes: { 1: 3, 2: 3, 3: 2, 4: 2 },
      stealGuess: null,
      secretId: "form-states/disabled-button",
    });
    expect(awards).toEqual({ 3: 3 });
  });

  test("pays the Chameleon 3 when caught but the steal lands", () => {
    const awards = scoreRound({
      chameleonId: 3,
      votes: { 1: 3, 2: 3, 3: 1, 4: 3 },
      stealGuess: "form-states/disabled-button",
      secretId: "form-states/disabled-button",
    });
    expect(awards).toEqual({ 3: 3 });
  });

  test("pays 1 to each correct voter when the steal misses", () => {
    const awards = scoreRound({
      chameleonId: 3,
      votes: { 1: 3, 2: 3, 3: 1, 4: 2 },
      stealGuess: "form-states/loading-button",
      secretId: "form-states/disabled-button",
    });
    expect(awards).toEqual({ 1: 1, 2: 1 });
  });

  test("pays nothing to Devs who voted wrong", () => {
    const awards = scoreRound({
      chameleonId: 3,
      votes: { 1: 3, 2: 3, 3: 1, 4: 2 },
      stealGuess: "form-states/loading-button",
      secretId: "form-states/disabled-button",
    });
    expect(awards[4]).toBeUndefined();
  });

  test("never pays the Chameleon for voting for themselves", () => {
    const awards = scoreRound({
      chameleonId: 3,
      votes: { 1: 3, 2: 3, 3: 3, 4: 2 },
      stealGuess: "form-states/loading-button",
      secretId: "form-states/disabled-button",
    });
    expect(awards[3]).toBeUndefined();
    expect(awards).toEqual({ 1: 1, 2: 1 });
  });
});

/** Deterministic RNG: yields the given values in order, then repeats the last. */
function seededRng(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("buildStealSlate", () => {
  test("is the Secret's similarity group, all 5 cards", () => {
    const slate = buildStealSlate("everyday-components/progress-bar", seededRng(0.3));
    expect([...slate].sort()).toEqual(
      [
        "everyday-components/alert-banner",
        "everyday-components/progress-bar",
        "everyday-components/range-slider",
        "everyday-components/search-bar",
        "everyday-components/skeleton-loader",
      ].sort(),
    );
  });

  test("always contains the true Secret", () => {
    for (const secret of ALL_SECRETS) {
      expect(buildStealSlate(secret.id, seededRng(0.7)), secret.id).toContain(secret.id);
    }
  });

  test("randomizes the true Secret's position rather than fixing it", () => {
    const positions = new Set(
      [0.05, 0.35, 0.65, 0.95].map((r) =>
        buildStealSlate("everyday-components/progress-bar", seededRng(r)).indexOf(
          "everyday-components/progress-bar",
        ),
      ),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("createRound", () => {
  const seats = [1, 2, 3, 4];

  test("starts a round ready for its first turn", () => {
    const round = createRound({ index: 0, seats, usedSecretIds: [], rng: seededRng(0) });
    expect(round.index).toBe(0);
    expect(round.phase).toBe("turns");
    expect(round.turnIndex).toBe(0);
    expect(round.edits).toEqual([]);
    expect(round.votes).toEqual({});
    expect(round.outcome).toBeUndefined();
  });

  test("draws a Secret belonging to the drawn Category", () => {
    const round = createRound({ index: 0, seats, usedSecretIds: [], rng: seededRng(0.42) });
    expect(getSecret(round.secretId)?.categoryId).toBe(round.categoryId);
  });

  test("makes exactly one seated player the Chameleon", () => {
    const round = createRound({ index: 0, seats, usedSecretIds: [], rng: seededRng(0.9) });
    expect(seats).toContain(round.chameleonId);
  });

  test("never redraws a Secret already used this match", () => {
    const category = getCategory("form-states")!;
    const used = category.secrets.slice(0, 14).map((s) => s.id);
    const round = createRound({
      index: 1,
      seats,
      usedSecretIds: used,
      // rng 0 picks the first category, which has exactly one card left.
      rng: seededRng(0),
    });
    expect(used).not.toContain(round.secretId);
  });

  test("skips a fully-used Category rather than drawing from it", () => {
    const used = getCategory("form-states")!.secrets.map((s) => s.id);
    const round = createRound({ index: 1, seats, usedSecretIds: used, rng: seededRng(0) });
    expect(round.categoryId).not.toBe("form-states");
  });

  test("reshuffles the deck when every Secret has been used", () => {
    const used = ALL_SECRETS.map((s) => s.id);
    const round = createRound({ index: 60, seats, usedSecretIds: used, rng: seededRng(0) });
    expect(round.secretId).toBeTruthy();
    expect(getSecret(round.secretId)).toBeDefined();
  });

  test("orders turns by seat order, starting at the drawn player", () => {
    const round = createRound({
      index: 0,
      seats,
      usedSecretIds: [],
      // Fourth rng draw picks the starting player: 0.5 of 4 seats -> index 2.
      rng: seededRng(0, 0, 0, 0.5),
    });
    expect(round.turnOrder).toEqual([3, 4, 1, 2]);
  });

  test("keeps every seat in the turn order exactly once", () => {
    const round = createRound({
      index: 0,
      seats: [1, 2, 3, 4, 5, 6, 7],
      usedSecretIds: [],
      rng: seededRng(0.8),
    });
    expect([...round.turnOrder].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

function makeRound(overrides: Partial<Round> = {}): Round {
  return {
    index: 0,
    categoryId: "form-states",
    secretId: "form-states/disabled-button",
    chameleonId: 3,
    phase: "turns",
    turnOrder: [3, 4, 1, 2],
    turnIndex: 0,
    edits: [],
    votes: {},
    ...overrides,
  };
}

const anEdit = (playerId: number): Edit => ({
  id: "edit-1",
  playerId,
  turnIndex: -1,
  target: "inner",
  kind: "tag",
  value: "button",
});

describe("the turn loop", () => {
  test("runs two full trips around the table", () => {
    expect(totalTurns(makeRound())).toBe(8);
    expect(totalTurns(makeRound({ turnOrder: [1, 2, 3, 4, 5] }))).toBe(10);
  });

  test("follows the turn order, wrapping into the second lap", () => {
    const order = [0, 1, 2, 3, 4, 5, 6, 7].map((turnIndex) =>
      activePlayerId(makeRound({ turnIndex })),
    );
    expect(order).toEqual([3, 4, 1, 2, 3, 4, 1, 2]);
  });

  test("has no active player once the turns are spent", () => {
    expect(activePlayerId(makeRound({ phase: "voting", turnIndex: 8 }))).toBeNull();
  });

  test("appends the edit and advances the turn", () => {
    const next = submitEdit(makeRound(), anEdit(3));
    expect(next.edits).toHaveLength(1);
    expect(next.turnIndex).toBe(1);
    expect(next.phase).toBe("turns");
  });

  test("stamps the edit with the turn that produced it", () => {
    const next = submitEdit(makeRound({ turnIndex: 5 }), anEdit(4));
    expect(next.edits[0].turnIndex).toBe(5);
  });

  test("refuses an edit from a player whose turn it is not", () => {
    expect(() => submitEdit(makeRound(), anEdit(4))).toThrow(/turn/i);
  });

  test("refuses an edit outside the turns phase", () => {
    expect(() => submitEdit(makeRound({ phase: "voting" }), anEdit(3))).toThrow(/phase/i);
  });

  test("moves to the countdown after the final turn", () => {
    const next = submitEdit(makeRound({ turnIndex: 7 }), anEdit(2));
    expect(next.turnIndex).toBe(8);
    expect(next.phase).toBe("countdown");
  });

  test("leaves the log append-only across many turns", () => {
    let round = makeRound();
    for (let i = 0; i < 8; i++) {
      round = submitEdit(round, { ...anEdit(round.turnOrder[i % 4]), id: `e${i}` });
    }
    expect(round.edits.map((e) => e.id)).toEqual(["e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7"]);
  });
});

describe("voting", () => {
  const voting = makeRound({ phase: "voting", turnIndex: 8 });

  test("records a vote", () => {
    expect(castVote(voting, 1, 3).votes).toEqual({ 1: 3 });
  });

  test("locks a vote once submitted", () => {
    const once = castVote(voting, 1, 3);
    expect(() => castVote(once, 1, 4)).toThrow(/locked/i);
  });

  test("waits for every seat before revealing", () => {
    let round = castVote(voting, 1, 3);
    round = castVote(round, 2, 3);
    round = castVote(round, 3, 1);
    expect(round.phase).toBe("voting");
    round = castVote(round, 4, 3);
    expect(round.phase).toBe("reveal");
  });
});

describe("resolveRound", () => {
  test("sends a caught Chameleon to the steal with a 5-card slate", () => {
    const round = resolveRound(
      makeRound({ phase: "reveal", votes: { 1: 3, 2: 3, 3: 1, 4: 3 } }),
      seededRng(0.3),
    );
    expect(round.phase).toBe("steal");
    expect(round.stealSlate).toHaveLength(5);
    expect(round.stealSlate).toContain("form-states/disabled-button");
    expect(round.outcome).toBeUndefined();
  });

  test("resolves straight to the result when the Chameleon escapes", () => {
    const round = resolveRound(
      makeRound({ phase: "reveal", votes: { 1: 2, 2: 2, 3: 2, 4: 1 } }),
      seededRng(0.3),
    );
    expect(round.phase).toBe("result");
    expect(round.stealSlate).toBeUndefined();
    expect(round.outcome).toEqual({
      caughtPlayerId: 2,
      chameleonCaught: false,
      tied: false,
      stealCorrect: null,
      awards: { 3: 3 },
    });
  });

  test("resolves a tie to the result with the Chameleon paid", () => {
    const round = resolveRound(
      makeRound({ phase: "reveal", votes: { 1: 3, 2: 3, 3: 2, 4: 2 } }),
      seededRng(0.3),
    );
    expect(round.phase).toBe("result");
    expect(round.outcome?.tied).toBe(true);
    expect(round.outcome?.awards).toEqual({ 3: 3 });
  });
});

describe("submitSteal", () => {
  const caught = makeRound({
    phase: "steal",
    votes: { 1: 3, 2: 3, 3: 1, 4: 2 },
    stealSlate: ["form-states/loading-button", "form-states/disabled-button"],
  });

  test("pays the Chameleon when the steal lands", () => {
    const round = submitSteal(caught, "form-states/disabled-button");
    expect(round.phase).toBe("result");
    expect(round.outcome?.stealCorrect).toBe(true);
    expect(round.outcome?.awards).toEqual({ 3: 3 });
  });

  test("pays only the correct voters when the steal misses", () => {
    const round = submitSteal(caught, "form-states/loading-button");
    expect(round.outcome?.stealCorrect).toBe(false);
    expect(round.outcome?.awards).toEqual({ 1: 1, 2: 1 });
  });

  test("refuses a guess outside the steal phase", () => {
    expect(() => submitSteal(makeRound(), "form-states/disabled-button")).toThrow(/phase/i);
  });
});

describe("applyRoundOutcome", () => {
  const match: MatchState = {
    status: "playing",
    seats: [1, 2, 3, 4],
    scores: { 1: 2, 3: 1 },
    usedSecretIds: ["form-states/loading-button"],
    round: null,
  };

  const resolved = (awards: Record<number, number>) =>
    makeRound({
      phase: "result",
      outcome: {
        caughtPlayerId: 3,
        chameleonCaught: true,
        tied: false,
        stealCorrect: false,
        awards,
      },
    });

  test("adds this round's awards to the running scores", () => {
    const next = applyRoundOutcome(match, resolved({ 1: 1, 2: 1 }));
    expect(next.scores).toEqual({ 1: 3, 2: 1, 3: 1 });
  });

  test("retires the Secret so it cannot repeat this match", () => {
    const next = applyRoundOutcome(match, resolved({ 1: 1 }));
    expect(next.usedSecretIds).toEqual([
      "form-states/loading-button",
      "form-states/disabled-button",
    ]);
  });

  test("keeps playing while everyone is below the target", () => {
    const next = applyRoundOutcome(match, resolved({ 1: 1 }));
    expect(next.status).toBe("playing");
    expect(next.winnerIds).toBeUndefined();
  });

  test("finishes the match the moment a player reaches the target", () => {
    const next = applyRoundOutcome(match, resolved({ 1: 3 }));
    expect(next.scores[1]).toBe(5);
    expect(next.status).toBe("finished");
    expect(next.winnerIds).toEqual([1]);
  });

  test("gives the win to the highest total when two players cross together", () => {
    const both = { ...match, scores: { 1: 4, 2: 4 } };
    const next = applyRoundOutcome(both, resolved({ 1: 1, 2: 3 }));
    expect(next.winnerIds).toEqual([2]);
  });

  test("shares the win when the highest totals are equal", () => {
    const both = { ...match, scores: { 1: 4, 2: 4 } };
    const next = applyRoundOutcome(both, resolved({ 1: 1, 2: 1 }));
    expect([...next.winnerIds!].sort()).toEqual([1, 2]);
  });

  test("refuses to apply a round that has not resolved", () => {
    expect(() => applyRoundOutcome(match, makeRound())).toThrow(/outcome/i);
  });
});

describe("phase guards", () => {
  test("refuses a vote before the voting phase opens", () => {
    expect(() => castVote(makeRound(), 1, 3)).toThrow(/phase/i);
  });

  test("opens voting after the countdown", () => {
    const round = beginVoting(makeRound({ phase: "countdown", turnIndex: 8 }));
    expect(round.phase).toBe("voting");
  });

  test("refuses to open voting outside the countdown", () => {
    expect(() => beginVoting(makeRound())).toThrow(/phase/i);
  });

  test("refuses to resolve before the votes are revealed", () => {
    expect(() => resolveRound(makeRound({ phase: "voting" }))).toThrow(/phase/i);
  });
});

describe("usedSecretIds stays a set", () => {
  /** startNextRound derives the round index from this list's length. */
  test("never records the same Secret twice", () => {
    const match: MatchState = {
      status: "playing",
      seats: [1, 2, 3, 4],
      scores: {},
      usedSecretIds: ["form-states/disabled-button"],
      round: null,
    };
    const round = makeRound({
      phase: "result",
      outcome: {
        caughtPlayerId: 3,
        chameleonCaught: true,
        tied: false,
        stealCorrect: false,
        awards: {},
      },
    });
    expect(applyRoundOutcome(match, round).usedSecretIds).toEqual([
      "form-states/disabled-button",
    ]);
  });
});
