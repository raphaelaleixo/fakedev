import { describe, expect, test } from "vitest";
import { draftSteps, draftToEdit, isDraftSubmittable } from "./composer";
import type { ComposerDraft } from "./types";

/** Pretend browser: knows a handful of declarations, rejects everything else. */
const supports = (property: string, value: string) =>
  (property === "color" && value === "red") ||
  (property === "padding" && value === "8px") ||
  (property === "display" && value === "flex");

const check = (draft: ComposerDraft) => isDraftSubmittable(draft, supports);

describe("draftSteps", () => {
  test("always asks which element first, then what kind of edit", () => {
    expect(draftSteps()).toEqual(["element", "kind"]);
  });

  test("treats the tag itself as the value, with no key step", () => {
    expect(draftSteps("tag")).toEqual(["element", "kind", "value"]);
  });

  test("takes text straight to its value too", () => {
    expect(draftSteps("text")).toEqual(["element", "kind", "value"]);
  });

  test("asks for a key before a value on attributes and CSS", () => {
    expect(draftSteps("attribute")).toEqual(["element", "kind", "key", "value"]);
    expect(draftSteps("style")).toEqual(["element", "kind", "key", "value"]);
  });
});

describe("isDraftSubmittable", () => {
  test("refuses an empty draft", () => {
    expect(check({})).toBe(false);
  });

  test("accepts text once it has content", () => {
    expect(check({ element: "inner", kind: "text", value: "Continue" })).toBe(true);
  });

  test("refuses blank text, which would render as nothing", () => {
    expect(check({ element: "inner", kind: "text", value: "   " })).toBe(false);
  });

  test("refuses text past the layout cap", () => {
    expect(check({ element: "outer", kind: "text", value: "x".repeat(25) })).toBe(false);
    expect(check({ element: "outer", kind: "text", value: "x".repeat(24) })).toBe(true);
  });

  test("accepts a tag that is a plain element name", () => {
    expect(check({ element: "inner", kind: "tag", value: "button" })).toBe(true);
  });

  test("refuses a tag that is not a plain element name", () => {
    expect(check({ element: "inner", kind: "tag", value: 'div onload="x"' })).toBe(false);
  });

  test("refuses a style edit with no key chosen yet", () => {
    expect(check({ element: "outer", kind: "style", value: "red" })).toBe(false);
  });

  test("accepts a declaration the browser can parse", () => {
    expect(check({ element: "outer", kind: "style", key: "color", value: "red" })).toBe(true);
  });

  test("refuses a declaration the browser rejects, so a typo cannot be committed", () => {
    expect(check({ element: "outer", kind: "style", key: "color", value: "rde" })).toBe(false);
  });

  test("refuses a misspelled property", () => {
    expect(check({ element: "outer", kind: "style", key: "colour", value: "red" })).toBe(false);
  });

  test("requires a boolean attribute to be explicitly on or off", () => {
    expect(check({ element: "inner", kind: "attribute", key: "disabled", value: "true" })).toBe(true);
    expect(check({ element: "inner", kind: "attribute", key: "disabled", value: "false" })).toBe(true);
    expect(check({ element: "inner", kind: "attribute", key: "disabled", value: "yes" })).toBe(false);
  });

  test("requires an enum attribute to be one of its options", () => {
    expect(check({ element: "inner", kind: "attribute", key: "type", value: "checkbox" })).toBe(true);
    expect(check({ element: "inner", kind: "attribute", key: "type", value: "cheeseburger" })).toBe(false);
  });

  test("caps a capped free-text attribute", () => {
    const long = { element: "inner", kind: "attribute", key: "aria-label", value: "x".repeat(25) } as const;
    expect(check(long)).toBe(false);
  });

  test("refuses an attribute name that is not a plain identifier", () => {
    expect(check({ element: "inner", kind: "attribute", key: 'x" onload', value: "1" })).toBe(false);
  });
});

describe("draftToEdit", () => {
  const meta = { id: "e1", playerId: 3, turnIndex: 5 };

  test("maps outer's text onto the {label} slot", () => {
    const edit = draftToEdit({ element: "outer", kind: "text", value: "Lorem ipsum" }, meta);
    expect(edit).toEqual({ ...meta, target: "label", kind: "text", value: "Lorem ipsum" });
  });

  test("maps inner's text onto the {text} slot", () => {
    const edit = draftToEdit({ element: "inner", kind: "text", value: "Continue" }, meta);
    expect(edit).toEqual({ ...meta, target: "text", kind: "text", value: "Continue" });
  });

  test("builds a tag edit with no key", () => {
    const edit = draftToEdit({ element: "inner", kind: "tag", value: "button" }, meta);
    expect(edit).toEqual({ ...meta, target: "inner", kind: "tag", value: "button" });
  });

  test("builds a keyed edit", () => {
    const edit = draftToEdit(
      { element: "outer", kind: "style", key: "color", value: "red" },
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
    const edit = draftToEdit({ element: "inner", kind: "text", value: "  Continue  " }, meta);
    expect(edit.value).toBe("Continue");
  });

  test("refuses to build from an incomplete draft", () => {
    expect(() => draftToEdit({ element: "outer", kind: "style" }, meta)).toThrow(/incomplete/i);
  });
});
