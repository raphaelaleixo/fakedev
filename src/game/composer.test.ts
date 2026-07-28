import { describe, expect, test } from "vitest";
import { availableTargets, draftSteps, draftToEdit, isDraftSubmittable } from "./composer";
import type { ComposerDraft, Edit } from "./types";

/**
 * Pretend browser. It knows four properties and, like a real one, accepts
 * `initial` for any of them — which is how opening a declaration checks that
 * the name is real before anyone spends a turn answering it.
 */
const KNOWN = new Set(["color", "padding", "display", "border-radius"]);
const supports = (property: string, value: string) => {
  if (!KNOWN.has(property)) return false;
  if (value === "initial") return true;
  return (
    (property === "color" && value === "red") ||
    (property === "padding" && value === "8px") ||
    (property === "display" && value === "flex")
  );
};
const check = (draft: ComposerDraft) => isDraftSubmittable(draft, supports);

const textEdit = (target: "outer-text" | "inner-text"): Edit => ({
  id: "t",
  playerId: 1,
  turnIndex: 0,
  target,
  kind: "text",
});

describe("availableTargets", () => {
  /** A span isn't a place to play until somebody has brought it into being. */
  test("offers only the two boxes at the start of a round", () => {
    expect(availableTargets([])).toEqual(["outer", "inner"]);
  });

  test("offers a span once its text move has been played", () => {
    expect(availableTargets([textEdit("inner-text")])).toEqual([
      "outer",
      "inner",
      "inner-text",
    ]);
  });

  test("offers all four once both spans exist", () => {
    expect(availableTargets([textEdit("outer-text"), textEdit("inner-text")])).toEqual([
      "outer",
      "outer-text",
      "inner",
      "inner-text",
    ]);
  });
});

describe("draftSteps", () => {
  test("always asks which target first, then what move", () => {
    expect(draftSteps()).toEqual(["target", "move"]);
  });

  /** Naming a declaration ends the turn. Answering it is somebody's next move. */
  test("ends the turn at the name when opening", () => {
    expect(draftSteps("style")).toEqual(["target", "move", "key"]);
  });

  test("asks which declaration a value answers, then the value", () => {
    expect(draftSteps("value")).toEqual(["target", "move", "slot", "value"]);
  });

  test("takes the text move straight to a commit — there is nothing to choose", () => {
    expect(draftSteps("text")).toEqual(["target", "move"]);
  });
});

describe("isDraftSubmittable", () => {
  test("refuses an empty draft", () => {
    expect(check({})).toBe(false);
  });

  test("accepts a text move on a box, with nothing else to say", () => {
    expect(check({ target: "outer", move: "text" })).toBe(true);
  });

  /** A span already holds the only copy there is; there's nothing to add. */
  test("refuses a text move on a span", () => {
    expect(check({ target: "outer-text", move: "text" })).toBe(false);
  });

  test("accepts opening a property, with no value at all", () => {
    expect(check({ target: "outer", move: "style", key: "border-radius" })).toBe(true);
  });

  test("accepts opening a property on a span", () => {
    expect(check({ target: "inner-text", move: "style", key: "color" })).toBe(true);
  });

  test("refuses opening a property nobody could resolve", () => {
    expect(check({ target: "outer", move: "style", key: "colour" })).toBe(false);
    expect(check({ target: "outer", move: "style", key: "" })).toBe(false);
  });

  test("accepts a value the browser can parse", () => {
    expect(check({ target: "outer", move: "value", key: "color", value: "red" })).toBe(true);
  });

  test("refuses a value the browser rejects, so a typo cannot be committed", () => {
    expect(check({ target: "outer", move: "value", key: "color", value: "rde" })).toBe(false);
  });

  test("refuses a value with no declaration to answer", () => {
    expect(check({ target: "outer", move: "value", value: "red" })).toBe(false);
  });
});

describe("draftToEdit", () => {
  const meta = { id: "e1", playerId: 3, turnIndex: 5 };

  test("maps a text move onto the span it creates", () => {
    expect(draftToEdit({ target: "outer", move: "text" }, meta)).toEqual({
      ...meta,
      target: "outer-text",
      kind: "text",
    });
    expect(draftToEdit({ target: "inner", move: "text" }, meta)).toEqual({
      ...meta,
      target: "inner-text",
      kind: "text",
    });
  });

  test("builds an opening with no value on it", () => {
    const edit = draftToEdit({ target: "outer", move: "style", key: "color" }, meta);
    expect(edit).toEqual({ ...meta, target: "outer", kind: "style", key: "color" });
  });

  test("builds a value onto the declaration it answers", () => {
    const edit = draftToEdit(
      { target: "inner-text", move: "value", key: "color", value: "red" },
      meta,
    );
    expect(edit).toEqual({
      ...meta,
      target: "inner-text",
      kind: "style",
      key: "color",
      value: "red",
    });
  });

  test("trims the value, since trailing space is invisible on the inspector", () => {
    const edit = draftToEdit(
      { target: "outer", move: "value", key: "color", value: "  red  " },
      meta,
    );
    expect(edit.kind === "style" && edit.value).toBe("red");
  });

  test("refuses to build from an incomplete draft", () => {
    expect(() => draftToEdit({ target: "outer", move: "value", key: "color" }, meta)).toThrow(
      /incomplete/i,
    );
  });
});
