import { describe, expect, test } from "vitest";
import { deserializeMatch } from "./serialize";

/**
 * Firebase does not store empty collections — it deletes the key. So a round
 * that was written with `edits: []` reads back with no `edits` at all, and a
 * match nobody has scored in reads back with no `scores`. It also stores sparse
 * arrays as objects keyed by index.
 *
 * Every one of those shapes has to become a well-formed MatchState here, at the
 * single point where the wire format becomes the domain type — the same job
 * `deserializeRoom` does for RoomState.
 */
const round = {
  index: 0,
  styleId: "brutalist",
  componentId: "progress-bar",
  chameleonId: 3,
  phase: "turns",
  turnOrder: [1, 2, 3, 4],
  turnIndex: 0,
};

const match = { status: "playing", seats: [1, 2, 3, 4], round };

describe("deserializeMatch", () => {
  test("restores the edit log Firebase dropped for being empty", () => {
    expect(deserializeMatch(match).round?.edits).toEqual([]);
  });

  test("restores the votes Firebase dropped for being empty", () => {
    expect(deserializeMatch(match).round?.votes).toEqual({});
  });

  test("restores an empty scoreboard and both used pools", () => {
    const result = deserializeMatch(match);
    expect(result.scores).toEqual({});
    expect(result.usedStyleIds).toEqual([]);
    expect(result.usedComponentIds).toEqual([]);
    expect(result.roundIndex).toBe(0);
  });

  test("turns Firebase's index-keyed object back into an ordered array", () => {
    const raw = {
      ...match,
      round: {
        ...round,
        edits: {
          "0": { id: "a", playerId: 1, turnIndex: 0, target: "outer", kind: "tag", value: "div" },
          "1": { id: "b", playerId: 2, turnIndex: 1, target: "inner", kind: "tag", value: "button" },
        },
      },
    };
    expect(deserializeMatch(raw).round?.edits.map((e) => e.id)).toEqual(["a", "b"]);
  });

  test("keeps a well-formed match untouched", () => {
    const raw = {
      ...match,
      scores: { 1: 3 },
      usedStyleIds: ["wireframe"],
      usedComponentIds: ["avatar"],
      round: { ...round, edits: [], votes: { 1: 3 } },
    };
    const result = deserializeMatch(raw);
    expect(result.scores).toEqual({ 1: 3 });
    expect(result.usedStyleIds).toEqual(["wireframe"]);
    expect(result.round?.votes).toEqual({ 1: 3 });
  });

  test("copes with a match that has no round yet", () => {
    expect(deserializeMatch({ status: "playing", seats: [1, 2] }).round).toBeNull();
  });

  test("restores the seat list, which is never legitimately empty", () => {
    expect(deserializeMatch({ status: "playing" }).seats).toEqual([]);
  });

  test("preserves the outcome's awards when there are none", () => {
    const raw = {
      ...match,
      round: {
        ...round,
        phase: "result",
        outcome: { caughtPlayerId: null, chameleonCaught: false, tied: true, steal: null },
      },
    };
    expect(deserializeMatch(raw).round?.outcome?.awards).toEqual({});
  });
});

/** What Firebase actually does to a value on the way in: empties disappear. */
function throughFirebase(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(throughFirebase);
    return items.length ? items : undefined;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const stored = throughFirebase(item);
      if (stored !== undefined && stored !== null) out[key] = stored;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return value;
}

describe("a real round trip", () => {
  /**
   * The bug this file exists for: a freshly dealt match has an empty edit log,
   * an empty scoreboard and no votes. Firebase stores none of them, and the
   * canvas crashed on `edits is not iterable` the moment a match started.
   */
  test("survives Firebase dropping every empty collection", async () => {
    const { startMatch } = await import("./match");
    const { foldEdits } = await import("./fold");

    const stored = throughFirebase(JSON.parse(JSON.stringify(startMatch([1, 2, 3, 4]))));
    expect((stored as Record<string, unknown>).scores).toBeUndefined();
    // roundIndex 0 is falsy-but-meaningful; Firebase keeps it, we default it.
    expect(deserializeMatch(stored).roundIndex).toBe(0);

    const match = deserializeMatch(stored);
    expect(match.round?.edits).toEqual([]);
    expect(() => foldEdits(match.round!.edits)).not.toThrow();
    expect(match.round?.turnOrder).toHaveLength(4);
  });
});
