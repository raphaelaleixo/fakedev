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
  roundPhase,
} from "./round";
import { COMPONENTS, STYLES, getComponent, getStyle } from "./content/deck";
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
  const votes = { 1: 3, 2: 3, 3: 1, 4: 2 }; // seats 1 and 2 caught seat 3
  const escaped = { 1: 2, 2: 2, 3: 2, 4: 1 }; // they caught seat 2 instead

  test("pays the Chameleon 2 for escaping", () => {
    expect(scoreRound({ chameleonId: 3, votes: escaped, steal: null })).toEqual({ 3: 2 });
  });

  test("pays the Chameleon 2 for escaping on a tie", () => {
    const tied = { 1: 3, 2: 3, 3: 2, 4: 2 };
    expect(scoreRound({ chameleonId: 3, votes: tied, steal: null })).toEqual({ 3: 2 });
  });

  /** Escaping and a perfect steal pay the same, as in the paper game. */
  test("pays the Chameleon 2 for a perfect steal, and the Devs nothing", () => {
    const steal = { style: true, component: true };
    expect(scoreRound({ chameleonId: 3, votes, steal })).toEqual({ 3: 2 });
  });

  test("splits the round when the Chameleon gets one axis", () => {
    const steal = { style: true, component: false };
    expect(scoreRound({ chameleonId: 3, votes, steal })).toEqual({ 3: 1, 1: 1, 2: 1 });
  });

  test("splits it the same way whichever axis they got", () => {
    const steal = { style: false, component: true };
    expect(scoreRound({ chameleonId: 3, votes, steal })).toEqual({ 3: 1, 1: 1, 2: 1 });
  });

  test("pays only the correct voters when the Chameleon gets neither", () => {
    const steal = { style: false, component: false };
    expect(scoreRound({ chameleonId: 3, votes, steal })).toEqual({ 1: 1, 2: 1 });
  });

  test("pays nothing to Devs who voted wrong", () => {
    const steal = { style: false, component: false };
    expect(scoreRound({ chameleonId: 3, votes, steal })[4]).toBeUndefined();
  });

  test("never pays the Chameleon for voting for themselves", () => {
    const selfVote = { 1: 3, 2: 3, 3: 3, 4: 2 };
    const steal = { style: false, component: false };
    expect(scoreRound({ chameleonId: 3, votes: selfVote, steal })).toEqual({ 1: 1, 2: 1 });
  });
});

/** Deterministic RNG: yields the given values in order, then repeats the last. */
function seededRng(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("buildStealSlate", () => {
  const slate = (r = 0.3) => buildStealSlate("brutalist", "progress-bar", seededRng(r));

  test("offers five of each", () => {
    expect(slate().styles).toHaveLength(5);
    expect(slate().components).toHaveLength(5);
  });

  test("always contains both true answers", () => {
    expect(slate().styles).toContain("brutalist");
    expect(slate().components).toContain("progress-bar");
  });

  test("draws each half from its own deck only", () => {
    const { styles, components } = slate();
    expect(styles.every((id) => STYLES.some((c) => c.id === id))).toBe(true);
    expect(components.every((id) => COMPONENTS.some((c) => c.id === id))).toBe(true);
  });

  test("never repeats a card within a slate", () => {
    expect(new Set(slate().styles).size).toBe(5);
    expect(new Set(slate().components).size).toBe(5);
  });

  /**
   * Drawn fresh at steal time, so the same Secret never presents the same five
   * twice — the flaw the old fixed similarity groups had.
   */
  test("varies the decoys between draws", () => {
    const seen = new Set([0.1, 0.35, 0.6, 0.85].map((r) => slate(r).styles.join()));
    expect(seen.size).toBeGreaterThan(1);
  });

  test("refuses an id that is not in the deck", () => {
    expect(() => buildStealSlate("nope", "progress-bar", seededRng(0.3))).toThrow(/unknown/i);
  });
});

describe("createRound", () => {
  const seats = [1, 2, 3, 4];
  const fresh = (rng = seededRng(0)) =>
    createRound({ index: 0, seats, usedStyleIds: [], usedComponentIds: [], rng });

  test("starts a round ready for its first turn", () => {
    const round = fresh();
    expect(round.index).toBe(0);
    expect(round.phase).toBe("turns");
    expect(round.turnIndex).toBe(0);
    expect(round.edits).toEqual([]);
    expect(round.votes).toEqual({});
    expect(round.outcome).toBeUndefined();
  });

  test("draws one half from each deck", () => {
    const round = fresh(seededRng(0.42));
    expect(getStyle(round.styleId)).toBeDefined();
    expect(getComponent(round.componentId)).toBeDefined();
  });

  test("makes exactly one seated player the Chameleon", () => {
    expect(seats).toContain(fresh(seededRng(0.9)).chameleonId);
  });

  test("never redraws a style already played this match", () => {
    const used = STYLES.slice(0, -1).map((c) => c.id);
    const round = createRound({
      index: 1,
      seats,
      usedStyleIds: used,
      usedComponentIds: [],
      rng: seededRng(0),
    });
    expect(used).not.toContain(round.styleId);
  });

  test("never redraws a component already played this match", () => {
    const used = COMPONENTS.slice(0, -1).map((c) => c.id);
    const round = createRound({
      index: 1,
      seats,
      usedStyleIds: [],
      usedComponentIds: used,
      rng: seededRng(0),
    });
    expect(used).not.toContain(round.componentId);
  });

  test("tracks the two pools independently", () => {
    // Every style used, no component used: the component must still be fresh.
    const round = createRound({
      index: 15,
      seats,
      usedStyleIds: STYLES.map((c) => c.id),
      usedComponentIds: [COMPONENTS[0].id],
      rng: seededRng(0),
    });
    expect(round.componentId).not.toBe(COMPONENTS[0].id);
  });

  test("reshuffles a deck rather than deadlocking once it is exhausted", () => {
    const round = createRound({
      index: 15,
      seats,
      usedStyleIds: STYLES.map((c) => c.id),
      usedComponentIds: COMPONENTS.map((c) => c.id),
      rng: seededRng(0),
    });
    expect(getStyle(round.styleId)).toBeDefined();
    expect(getComponent(round.componentId)).toBeDefined();
  });

  test("orders turns by seat order, starting at the drawn player", () => {
    // Fourth rng draw picks the starting player: 0.5 of 4 seats -> index 2.
    const round = fresh(seededRng(0, 0, 0, 0.5));
    expect(round.turnOrder).toEqual([3, 4, 1, 2]);
  });

  test("keeps every seat in the turn order exactly once", () => {
    const round = createRound({
      index: 0,
      seats: [1, 2, 3, 4, 5, 6, 7],
      usedStyleIds: [],
      usedComponentIds: [],
      rng: seededRng(0.8),
    });
    expect([...round.turnOrder].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

function makeRound(overrides: Partial<Round> = {}): Round {
  return {
    index: 0,
    styleId: "brutalist",
    componentId: "progress-bar",
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
  kind: "style",
  key: "display",
  value: "flex",
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
  test("sends a caught Chameleon to the steal with both slates", () => {
    const round = resolveRound(
      makeRound({ phase: "reveal", votes: { 1: 3, 2: 3, 3: 1, 4: 3 } }),
      seededRng(0.3),
    );
    expect(round.phase).toBe("steal");
    expect(round.stealSlate?.styles).toHaveLength(5);
    expect(round.stealSlate?.components).toHaveLength(5);
    expect(round.stealSlate?.styles).toContain("brutalist");
    expect(round.stealSlate?.components).toContain("progress-bar");
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
      steal: null,
      awards: { 3: 2 },
    });
  });

  test("resolves a tie to the result with the Chameleon paid", () => {
    const round = resolveRound(
      makeRound({ phase: "reveal", votes: { 1: 3, 2: 3, 3: 2, 4: 2 } }),
      seededRng(0.3),
    );
    expect(round.phase).toBe("result");
    expect(round.outcome?.tied).toBe(true);
    expect(round.outcome?.awards).toEqual({ 3: 2 });
  });
});

describe("submitSteal", () => {
  const caught = makeRound({
    phase: "steal",
    votes: { 1: 3, 2: 3, 3: 1, 4: 2 },
    stealSlate: { styles: ["brutalist", "wireframe"], components: ["progress-bar", "avatar"] },
  });

  test("pays the Chameleon 2 for naming both", () => {
    const round = submitSteal(caught, { styleId: "brutalist", componentId: "progress-bar" });
    expect(round.phase).toBe("result");
    expect(round.outcome?.steal).toEqual({ style: true, component: true });
    expect(round.outcome?.awards).toEqual({ 3: 2 });
  });

  test("splits the round when they name exactly one", () => {
    const round = submitSteal(caught, { styleId: "brutalist", componentId: "avatar" });
    expect(round.outcome?.steal).toEqual({ style: true, component: false });
    expect(round.outcome?.awards).toEqual({ 3: 1, 1: 1, 2: 1 });
  });

  test("pays only the correct voters when they name neither", () => {
    const round = submitSteal(caught, { styleId: "wireframe", componentId: "avatar" });
    expect(round.outcome?.steal).toEqual({ style: false, component: false });
    expect(round.outcome?.awards).toEqual({ 1: 1, 2: 1 });
  });

  test("records the guess so the result can show it", () => {
    const guess = { styleId: "wireframe", componentId: "avatar" };
    expect(submitSteal(caught, guess).stealGuess).toEqual(guess);
  });

  test("refuses a guess outside the steal phase", () => {
    expect(() =>
      submitSteal(makeRound(), { styleId: "brutalist", componentId: "progress-bar" }),
    ).toThrow(/phase/i);
  });
});

describe("applyRoundOutcome", () => {
  const match: MatchState = {
    status: "playing",
    seats: [1, 2, 3, 4],
    scores: { 1: 2, 3: 1 },
    usedStyleIds: ["wireframe"],
    usedComponentIds: ["avatar"],
    roundIndex: 1,
    round: null,
  };

  const resolved = (awards: Record<number, number>) =>
    makeRound({
      phase: "result",
      outcome: {
        caughtPlayerId: 3,
        chameleonCaught: true,
        tied: false,
        steal: { style: false, component: false },
        awards,
      },
    });

  test("adds this round's awards to the running scores", () => {
    const next = applyRoundOutcome(match, resolved({ 1: 1, 2: 1 }));
    expect(next.scores).toEqual({ 1: 3, 2: 1, 3: 1 });
  });

  test("retires both halves so neither can repeat this match", () => {
    const next = applyRoundOutcome(match, resolved({ 1: 1 }));
    expect(next.usedStyleIds).toEqual(["wireframe", "brutalist"]);
    expect(next.usedComponentIds).toEqual(["avatar", "progress-bar"]);
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

describe("the used pools stay sets", () => {
  test("never records the same half twice", () => {
    const match: MatchState = {
      status: "playing",
      seats: [1, 2, 3, 4],
      scores: {},
      usedStyleIds: ["brutalist"],
      usedComponentIds: ["progress-bar"],
      roundIndex: 1,
      round: null,
    };
    const round = makeRound({
      phase: "result",
      outcome: {
        caughtPlayerId: 3,
        chameleonCaught: true,
        tied: false,
        steal: { style: false, component: false },
        awards: {},
      },
    });
    const next = applyRoundOutcome(match, round);
    expect(next.usedStyleIds).toEqual(["brutalist"]);
    expect(next.usedComponentIds).toEqual(["progress-bar"]);
  });
});

describe("roundPhase", () => {
  /**
   * The bug this exists for: reporting "playing" until Firebase answers means
   * the status flips the moment it does, which fires the lobby-to-round
   * transition on top of the route transition from the cover and cancels it.
   * Arriving at a room you just made must be one continuous state, not two.
   */
  test("reads an unloaded room as the lobby, not as play", () => {
    expect(roundPhase(undefined)).toBe("lobby");
    expect(roundPhase("lobby")).toBe("lobby");
  });

  test("reads anything else as play", () => {
    expect(roundPhase("playing")).toBe("playing");
    expect(roundPhase("finished")).toBe("playing");
  });
});
