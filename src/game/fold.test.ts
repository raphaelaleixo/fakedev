import { describe, expect, test } from "vitest";
import { editSlot, foldEdits, inspectorLines } from "./fold";
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
