import { describe, expect, test } from "vitest";
import { draftSteps, draftToEdit, isDraftSubmittable } from "./composer";
import type { ComposerDraft } from "./types";

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

describe("draftSteps", () => {
  test("always asks which element first, then what move", () => {
    expect(draftSteps()).toEqual(["element", "move"]);
  });

  test("treats the tag itself as the value", () => {
    expect(draftSteps("tag")).toEqual(["element", "move", "value"]);
  });

  test("takes text straight to its value too", () => {
    expect(draftSteps("text")).toEqual(["element", "move", "value"]);
  });

  /**
   * A turn opens a declaration *or* answers one. Naming the property ends the
   * turn — supplying the value is somebody's next move, possibly not yours.
   */
  test("ends the turn once a declaration is named", () => {
    expect(draftSteps("attribute")).toEqual(["element", "move", "key"]);
    expect(draftSteps("style")).toEqual(["element", "move", "key"]);
  });

  test("asks which declaration a value answers, then the value", () => {
    expect(draftSteps("value")).toEqual(["element", "move", "slot", "value"]);
  });
});

describe("isDraftSubmittable", () => {
  test("refuses an empty draft", () => {
    expect(check({})).toBe(false);
  });

  test("accepts text once it has content", () => {
    expect(check({ element: "inner", move: "text", value: "Continue" })).toBe(true);
  });

  test("refuses blank text, which would render as nothing", () => {
    expect(check({ element: "inner", move: "text", value: "   " })).toBe(false);
  });

  test("refuses text past the layout cap", () => {
    expect(check({ element: "outer", move: "text", value: "x".repeat(25) })).toBe(false);
    expect(check({ element: "outer", move: "text", value: "x".repeat(24) })).toBe(true);
  });

  test("accepts a tag that is a plain element name", () => {
    expect(check({ element: "inner", move: "tag", value: "button" })).toBe(true);
  });

  test("refuses a tag that is not a plain element name", () => {
    expect(check({ element: "inner", move: "tag", value: 'div onload="x"' })).toBe(false);
  });

  test("accepts opening a property, with no value at all", () => {
    expect(check({ element: "outer", move: "style", key: "border-radius" })).toBe(true);
  });

  test("accepts opening an attribute", () => {
    expect(check({ element: "inner", move: "attribute", key: "role" })).toBe(true);
  });

  test("refuses opening a property nobody could resolve", () => {
    expect(check({ element: "outer", move: "style", key: "colour" })).toBe(false);
    expect(check({ element: "outer", move: "style", key: "" })).toBe(false);
  });

  test("refuses an attribute name that is not a plain identifier", () => {
    expect(check({ element: "inner", move: "attribute", key: 'x" onload' })).toBe(false);
  });

  test("accepts a value the browser can parse", () => {
    expect(
      check({ element: "outer", move: "value", slotKind: "style", key: "color", value: "red" }),
    ).toBe(true);
  });

  test("refuses a value the browser rejects, so a typo cannot be committed", () => {
    expect(
      check({ element: "outer", move: "value", slotKind: "style", key: "color", value: "rde" }),
    ).toBe(false);
  });

  test("refuses a value with no declaration to answer", () => {
    expect(check({ element: "outer", move: "value", value: "red" })).toBe(false);
  });

  test("requires a boolean attribute to be explicitly on or off", () => {
    const at = (value: string) =>
      check({ element: "inner", move: "value", slotKind: "attribute", key: "disabled", value });
    expect(at("true")).toBe(true);
    expect(at("false")).toBe(true);
    expect(at("yes")).toBe(false);
  });

  test("requires an enum attribute to be one of its options", () => {
    const at = (value: string) =>
      check({ element: "inner", move: "value", slotKind: "attribute", key: "type", value });
    expect(at("checkbox")).toBe(true);
    expect(at("cheeseburger")).toBe(false);
  });

  test("caps a capped free-text attribute", () => {
    expect(
      check({
        element: "inner",
        move: "value",
        slotKind: "attribute",
        key: "aria-label",
        value: "x".repeat(25),
      }),
    ).toBe(false);
  });
});

describe("draftToEdit", () => {
  const meta = { id: "e1", playerId: 3, turnIndex: 5 };

  test("maps outer's text onto the {label} slot", () => {
    const edit = draftToEdit({ element: "outer", move: "text", value: "Lorem ipsum" }, meta);
    expect(edit).toEqual({ ...meta, target: "label", kind: "text", value: "Lorem ipsum" });
  });

  test("maps inner's text onto the {text} slot", () => {
    const edit = draftToEdit({ element: "inner", move: "text", value: "Continue" }, meta);
    expect(edit).toEqual({ ...meta, target: "text", kind: "text", value: "Continue" });
  });

  test("builds a tag edit with no key", () => {
    const edit = draftToEdit({ element: "inner", move: "tag", value: "button" }, meta);
    expect(edit).toEqual({ ...meta, target: "inner", kind: "tag", value: "button" });
  });

  test("builds an opening with no value on it", () => {
    const edit = draftToEdit({ element: "outer", move: "style", key: "color" }, meta);
    expect(edit).toEqual({ ...meta, target: "outer", kind: "style", key: "color" });
  });

  test("builds a value onto the declaration it answers", () => {
    const edit = draftToEdit(
      { element: "outer", move: "value", slotKind: "style", key: "color", value: "red" },
      meta,
    );
    expect(edit).toEqual({
      ...meta,
      target: "outer",
      kind: "style",
      key: "color",
      value: "red",
    });
  });

  test("trims the value, since trailing space is invisible on the inspector", () => {
    const edit = draftToEdit({ element: "inner", move: "text", value: "  Continue  " }, meta);
    expect(edit.value).toBe("Continue");
  });

  test("refuses to build from an incomplete draft", () => {
    expect(() => draftToEdit({ element: "outer", move: "value", key: "color" }, meta)).toThrow(
      /incomplete/i,
    );
  });
});
