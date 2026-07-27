import { describe, expect, test } from "vitest";
import { editSlot, foldEdits, inspectorLines, slotHistories } from "./fold";
import type { Edit } from "./types";

/** Terse builders — the log is long in most of these tests. */
let seq = 0;
const tag = (target: "outer" | "inner", value: string): Edit => ({
  id: `e${seq++}`,
  playerId: 1,
  turnIndex: seq,
  target,
  kind: "tag",
  value,
});
const attr = (target: "outer" | "inner", key: string, value: string): Edit => ({
  id: `e${seq++}`,
  playerId: 1,
  turnIndex: seq,
  target,
  kind: "attribute",
  key,
  value,
});
const style = (target: "outer" | "inner", key: string, value: string): Edit => ({
  id: `e${seq++}`,
  playerId: 1,
  turnIndex: seq,
  target,
  kind: "style",
  key,
  value,
});
const text = (target: "label" | "text", value: string): Edit => ({
  id: `e${seq++}`,
  playerId: 1,
  turnIndex: seq,
  target,
  kind: "text",
  value,
});

describe("foldEdits", () => {
  test("folds an empty log to the blank base structure", () => {
    expect(foldEdits([])).toEqual({
      outer: { tag: "div", attributes: {}, styles: {} },
      inner: { tag: "div", attributes: {}, styles: {} },
      label: "",
      text: "",
    });
  });

  test("applies a tag edit to the targeted element", () => {
    const tree = foldEdits([tag("inner", "button")]);
    expect(tree.inner.tag).toBe("button");
    expect(tree.outer.tag).toBe("div");
  });

  test("applies an attribute edit to the targeted element", () => {
    const tree = foldEdits([attr("inner", "disabled", "true")]);
    expect(tree.inner.attributes).toEqual({ disabled: "true" });
  });

  test("applies a style edit to the targeted element", () => {
    const tree = foldEdits([style("outer", "background-color", "#eee")]);
    expect(tree.outer.styles).toEqual({ "background-color": "#eee" });
  });

  test("applies each text edit to its own slot", () => {
    const tree = foldEdits([text("label", "I'm not a robot"), text("text", "Submit")]);
    expect(tree.label).toBe("I'm not a robot");
    expect(tree.text).toBe("Submit");
  });

  test("keeps attributes and styles on the same element independent", () => {
    const tree = foldEdits([
      attr("inner", "type", "checkbox"),
      style("inner", "type", "ignored-as-a-style"),
    ]);
    expect(tree.inner.attributes).toEqual({ type: "checkbox" });
    expect(tree.inner.styles).toEqual({ type: "ignored-as-a-style" });
  });

  test("lets a later edit override the same key", () => {
    const tree = foldEdits([
      style("outer", "background-color", "#eee"),
      style("outer", "background-color", "rebeccapurple"),
    ]);
    expect(tree.outer.styles["background-color"]).toBe("rebeccapurple");
  });

  test("does not disturb sibling keys when one is overridden", () => {
    const tree = foldEdits([
      style("outer", "background-color", "#eee"),
      style("outer", "border-radius", "8px"),
      style("outer", "background-color", "rebeccapurple"),
    ]);
    expect(tree.outer.styles).toEqual({
      "background-color": "rebeccapurple",
      "border-radius": "8px",
    });
  });

  test("scopes the same key to each element separately", () => {
    const tree = foldEdits([
      style("outer", "color", "red"),
      style("inner", "color", "blue"),
    ]);
    expect(tree.outer.styles.color).toBe("red");
    expect(tree.inner.styles.color).toBe("blue");
  });

  test("lets a text slot be overridden", () => {
    const tree = foldEdits([text("text", "Submit"), text("text", "Loading…")]);
    expect(tree.text).toBe("Loading…");
  });
});

describe("editSlot", () => {
  test("gives colliding edits the same slot", () => {
    expect(editSlot(style("outer", "color", "red"))).toBe(
      editSlot(style("outer", "color", "blue")),
    );
  });

  test("separates the same key across kinds, targets and keys", () => {
    const slots = new Set([
      editSlot(style("outer", "color", "red")),
      editSlot(attr("outer", "color", "red")),
      editSlot(style("inner", "color", "red")),
      editSlot(style("outer", "border-color", "red")),
      editSlot(tag("outer", "button")),
      editSlot(tag("inner", "button")),
      editSlot(text("label", "hi")),
      editSlot(text("text", "hi")),
    ]);
    expect(slots.size).toBe(8);
  });
});

describe("inspectorLines", () => {
  test("keeps every edit in log order, superseded ones included", () => {
    const edits = [
      style("outer", "color", "red"),
      style("outer", "border-radius", "8px"),
      style("outer", "color", "blue"),
    ];
    const lines = inspectorLines(edits);
    expect(lines.map((l) => l.edit.id)).toEqual(edits.map((e) => e.id));
  });

  test("marks an edit superseded only when a later edit takes its slot", () => {
    const first = style("outer", "color", "red");
    const other = style("outer", "border-radius", "8px");
    const last = style("outer", "color", "blue");
    const lines = inspectorLines([first, other, last]);
    expect(lines.map((l) => l.superseded)).toEqual([true, false, false]);
  });

  test("marks every superseded edit, not just the most recent one", () => {
    const lines = inspectorLines([
      text("text", "a"),
      text("text", "b"),
      text("text", "c"),
    ]);
    expect(lines.map((l) => l.superseded)).toEqual([true, true, false]);
  });

  test("supersedes across players, since overrides are unrestricted", () => {
    const mine = { ...style("outer", "color", "red"), playerId: 3 };
    const theirs = { ...style("outer", "color", "blue"), playerId: 7 };
    const lines = inspectorLines([mine, theirs]);
    expect(lines[0].superseded).toBe(true);
    expect(lines[1].superseded).toBe(false);
  });
});

/**
 * A turn either *opens* a declaration by naming it, or *supplies a value*. An
 * open declaration is a statement of intent with no execution — it says "this
 * thing is rounded" without saying how much — so it must not reach the render.
 */
const open = (target: "outer" | "inner", kind: "attribute" | "style", key: string): Edit => ({
  id: `e${seq++}`,
  playerId: 1,
  turnIndex: seq,
  target,
  kind,
  key,
});

describe("open declarations", () => {
  test("keeps an unvalued property out of the render", () => {
    const tree = foldEdits([open("outer", "style", "border-radius")]);
    // toEqual ignores undefined values, so check the key is truly absent.
    expect(Object.keys(tree.outer.styles)).toEqual([]);
  });

  test("keeps an unvalued attribute out of the render", () => {
    const tree = foldEdits([open("inner", "attribute", "role")]);
    expect(Object.keys(tree.inner.attributes)).toEqual([]);
  });

  test("renders it once someone supplies the value", () => {
    const tree = foldEdits([
      open("outer", "style", "border-radius"),
      style("outer", "border-radius", "12px"),
    ]);
    expect(tree.outer.styles).toEqual({ "border-radius": "12px" });
  });

  test("leaves other declarations alone", () => {
    const tree = foldEdits([
      style("outer", "display", "flex"),
      open("outer", "style", "border-radius"),
    ]);
    expect(Object.keys(tree.outer.styles)).toEqual(["display"]);
  });

  test("shares a slot with its value, so the value supersedes the opening", () => {
    const opened = open("outer", "style", "border-radius");
    const valued = style("outer", "border-radius", "12px");
    const lines = inspectorLines([opened, valued]);
    expect(lines.map((l) => l.superseded)).toEqual([true, false]);
  });

  test("stays visible on the inspector while nobody has answered it", () => {
    const opened = open("outer", "style", "border-radius");
    expect(inspectorLines([opened])[0].superseded).toBe(false);
  });
});

describe("slotHistories", () => {
  /**
   * The inspector draws one line per declaration, not one per edit: the name in
   * the colour of whoever opened it, the value in the colour of whoever
   * answered, and anything overridden trailing as a comment. That needs the log
   * grouped by slot, in the order the slots first appeared.
   */
  test("reports a declaration nobody has answered", () => {
    const opened = open("outer", "style", "border-radius");
    const [history] = slotHistories([opened]);
    expect(history.opened).toBe(opened);
    expect(history.current).toBeUndefined();
    expect(history.overridden).toEqual([]);
  });

  test("keeps the opener and the answerer apart", () => {
    const opened = open("outer", "style", "border-radius");
    const answer = style("outer", "border-radius", "12px");
    const [history] = slotHistories([opened, answer]);
    expect(history.opened).toBe(opened);
    expect(history.current).toBe(answer);
    expect(history.overridden).toEqual([]);
  });

  test("collects overridden values oldest first, keeping the newest current", () => {
    const opened = open("inner", "style", "background-color");
    const green = style("inner", "background-color", "#34a853");
    const blue = style("inner", "background-color", "#1a73e8");
    const [history] = slotHistories([opened, green, blue]);
    expect(history.current).toBe(blue);
    expect(history.overridden).toEqual([green]);
  });

  test("treats a tag as opened and answered in one move", () => {
    const chosen = tag("inner", "button");
    const [history] = slotHistories([chosen]);
    expect(history.opened).toBe(chosen);
    expect(history.current).toBe(chosen);
  });

  test("comments an overridden tag rather than losing it", () => {
    const first = tag("inner", "div");
    const second = tag("inner", "button");
    const [history] = slotHistories([first, second]);
    expect(history.current).toBe(second);
    expect(history.overridden).toEqual([first]);
  });

  test("orders slots by when they first appeared", () => {
    const histories = slotHistories([
      style("outer", "display", "flex"),
      open("outer", "style", "padding"),
      tag("outer", "section"),
      style("outer", "display", "grid"),
    ]);
    expect(histories.map((h) => h.key ?? h.kind)).toEqual(["display", "padding", "tag"]);
  });

  test("separates the two text slots", () => {
    const histories = slotHistories([text("label", "a"), text("text", "b")]);
    expect(histories).toHaveLength(2);
    expect(histories.map((h) => h.target)).toEqual(["label", "text"]);
  });
});
