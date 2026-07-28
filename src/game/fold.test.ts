import { describe, expect, test } from "vitest";
import { editSlot, foldEdits, inspectorLines, slotHistories } from "./fold";
import type { Edit, EditTarget, TextTarget } from "./types";

let seq = 0;
const decl = (target: EditTarget, key: string, value?: string): Edit => ({
  id: `e${seq++}`,
  playerId: 1,
  turnIndex: seq,
  target,
  kind: "style",
  key,
  ...(value === undefined ? {} : { value }),
});
const open = (target: EditTarget, key: string): Edit => decl(target, key);
const text = (target: TextTarget): Edit => ({
  id: `e${seq++}`,
  playerId: 1,
  turnIndex: seq,
  target,
  kind: "text",
});

describe("foldEdits", () => {
  test("folds an empty log to two bare boxes and no spans", () => {
    const tree = foldEdits([]);
    expect(tree.outer.styles).toEqual({});
    expect(tree.inner.styles).toEqual({});
    expect(tree["outer-text"].present).toBe(false);
    expect(tree["inner-text"].present).toBe(false);
  });

  test("applies a declaration to the box it targets", () => {
    const tree = foldEdits([decl("outer", "display", "flex")]);
    expect(tree.outer.styles).toEqual({ display: "flex" });
    expect(tree.inner.styles).toEqual({});
  });

  /**
   * The text move creates the span. That's what makes it worth a turn — it
   * hands everyone a new element to work on rather than being a dead end.
   */
  test("brings a span into being", () => {
    const tree = foldEdits([text("inner-text")]);
    expect(tree["inner-text"].present).toBe(true);
    expect(tree["outer-text"].present).toBe(false);
  });

  test("styles a span once it exists", () => {
    const tree = foldEdits([text("outer-text"), decl("outer-text", "font-style", "italic")]);
    expect(tree["outer-text"].present).toBe(true);
    expect(tree["outer-text"].styles).toEqual({ "font-style": "italic" });
  });

  test("keeps each target's declarations to itself", () => {
    const tree = foldEdits([decl("outer", "color", "red"), decl("inner", "color", "blue")]);
    expect(tree.outer.styles.color).toBe("red");
    expect(tree.inner.styles.color).toBe("blue");
  });

  test("lets a later value override an earlier one", () => {
    const tree = foldEdits([decl("outer", "color", "red"), decl("outer", "color", "blue")]);
    expect(tree.outer.styles.color).toBe("blue");
  });

  test("does not disturb sibling declarations when one is overridden", () => {
    const tree = foldEdits([
      decl("outer", "color", "red"),
      decl("outer", "padding", "8px"),
      decl("outer", "color", "blue"),
    ]);
    expect(tree.outer.styles).toEqual({ color: "blue", padding: "8px" });
  });

  test("keeps an unanswered declaration out of the render", () => {
    const tree = foldEdits([open("outer", "border-radius")]);
    // toEqual ignores undefined values, so check the key is truly absent.
    expect(Object.keys(tree.outer.styles)).toEqual([]);
  });

  test("renders it once somebody answers", () => {
    const tree = foldEdits([open("outer", "border-radius"), decl("outer", "border-radius", "12px")]);
    expect(tree.outer.styles).toEqual({ "border-radius": "12px" });
  });
});

describe("editSlot", () => {
  test("gives colliding declarations the same slot", () => {
    expect(editSlot(decl("outer", "color", "red"))).toBe(editSlot(decl("outer", "color", "blue")));
  });

  test("separates targets, keys and kinds", () => {
    const slots = new Set([
      editSlot(decl("outer", "color", "red")),
      editSlot(decl("inner", "color", "red")),
      editSlot(decl("outer-text", "color", "red")),
      editSlot(decl("outer", "border-color", "red")),
      editSlot(text("outer-text")),
      editSlot(text("inner-text")),
    ]);
    expect(slots.size).toBe(6);
  });
});

describe("inspectorLines", () => {
  test("keeps every edit in log order", () => {
    const edits = [decl("outer", "color", "red"), decl("outer", "color", "blue")];
    expect(inspectorLines(edits).map((l) => l.edit.id)).toEqual(edits.map((e) => e.id));
  });

  test("marks an edit superseded only when a later one takes its slot", () => {
    const lines = inspectorLines([
      decl("outer", "color", "red"),
      decl("outer", "padding", "8px"),
      decl("outer", "color", "blue"),
    ]);
    expect(lines.map((l) => l.superseded)).toEqual([true, false, false]);
  });

  test("supersedes across players, since overrides are unrestricted", () => {
    const mine = { ...decl("outer", "color", "red"), playerId: 3 };
    const theirs = { ...decl("outer", "color", "blue"), playerId: 7 };
    expect(inspectorLines([mine, theirs]).map((l) => l.superseded)).toEqual([true, false]);
  });
});

describe("slotHistories", () => {
  test("keeps the opener and the answerer apart", () => {
    const opened = open("outer", "border-radius");
    const answer = decl("outer", "border-radius", "12px");
    const [history] = slotHistories([opened, answer]);
    expect(history.opened).toBe(opened);
    expect(history.current).toBe(answer);
    expect(history.overridden).toEqual([]);
  });

  test("reports a declaration nobody has answered", () => {
    const [history] = slotHistories([open("outer", "border-radius")]);
    expect(history.current).toBeUndefined();
  });

  test("collects overridden values oldest first, keeping the newest current", () => {
    const green = decl("inner", "background-color", "#34a853");
    const blue = decl("inner", "background-color", "#1a73e8");
    const [history] = slotHistories([open("inner", "background-color"), green, blue]);
    expect(history.current).toBe(blue);
    expect(history.overridden).toEqual([green]);
  });

  test("orders slots by when they first appeared", () => {
    const histories = slotHistories([
      decl("outer", "display", "flex"),
      open("outer", "padding"),
      decl("outer", "display", "grid"),
    ]);
    expect(histories.map((h) => h.key)).toEqual(["display", "padding"]);
  });

  test("separates the two spans", () => {
    const histories = slotHistories([text("outer-text"), text("inner-text")]);
    expect(histories).toHaveLength(2);
    expect(histories.map((h) => h.target)).toEqual(["outer-text", "inner-text"]);
  });
});
