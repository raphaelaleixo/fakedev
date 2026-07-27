import { describe, expect, test } from "vitest";
import {
  isColorValue,
  isValidDeclaration,
  supportedCssProperties,
  toKebabCase,
  type PropertySource,
} from "./css";

describe("toKebabCase", () => {
  test("converts the CSSOM's camelCase property names", () => {
    expect(toKebabCase("backgroundColor")).toBe("background-color");
    expect(toKebabCase("borderTopLeftRadius")).toBe("border-top-left-radius");
  });

  test("leaves a single-word property alone", () => {
    expect(toKebabCase("color")).toBe("color");
  });

  test("leaves an already-kebab name alone", () => {
    expect(toKebabCase("background-color")).toBe("background-color");
  });
});

/**
 * Browsers disagree about where CSS properties live, and getting this wrong
 * empties the composer's search with no error anywhere. Chrome exposes almost
 * nothing on `CSSStyleDeclaration.prototype` — a real reading was
 * `["cssText", "cssFloat"]` — and puts the list on computed style. jsdom does
 * the opposite. So neither source alone is enough, and each of these fakes is a
 * real environment that has already broken this.
 */
const chromeLike: PropertySource = {
  computed: () => ["color", "background-color", "display", "grid-template-areas", "--custom"],
  declared: () => ["cssText", "cssFloat", "getPropertyValue", "setProperty", "item"],
  isProperty: (name) => name === "cssText" || name === "cssFloat",
};

const jsdomLike: PropertySource = {
  computed: () => [],
  declared: () => ["color", "backgroundColor", "display", "webkitLineClamp", "getPropertyValue"],
  isProperty: (name) => name !== "getPropertyValue",
};

describe("supportedCssProperties", () => {
  test("finds properties when only computed style has them, as in Chrome", () => {
    const properties = supportedCssProperties(chromeLike);
    expect(properties).toContain("color");
    expect(properties).toContain("background-color");
    expect(properties).toContain("grid-template-areas");
  });

  test("finds properties when only the prototype has them, as in jsdom", () => {
    const properties = supportedCssProperties(jsdomLike);
    expect(properties).toContain("color");
    expect(properties).toContain("background-color");
  });

  test("merges both sources without duplicating", () => {
    const both: PropertySource = {
      computed: () => ["color", "display"],
      declared: () => ["color", "backgroundColor"],
      isProperty: () => true,
    };
    expect(supportedCssProperties(both)).toEqual([
      "background-color",
      "color",
      "display",
    ]);
  });

  test("drops CSSOM methods, which are not properties", () => {
    const properties = supportedCssProperties(jsdomLike);
    expect(properties).not.toContain("get-property-value");
  });

  test("drops vendor-prefixed noise", () => {
    expect(supportedCssProperties(jsdomLike)).not.toContain("webkit-line-clamp");
  });

  test("drops custom properties, which are not a thing to autocomplete", () => {
    expect(supportedCssProperties(chromeLike)).not.toContain("--custom");
  });

  test("is sorted and deduplicated, so autocomplete is stable", () => {
    const properties = supportedCssProperties(chromeLike);
    expect(properties).toEqual([...new Set(properties)].sort());
  });

  /**
   * The guard that would have caught the Chrome failure: whatever this
   * environment is, the list has to be big enough to search.
   */
  test("returns a usable list from the real environment", () => {
    const properties = supportedCssProperties();
    expect(properties.length).toBeGreaterThan(50);
    expect(properties).toContain("color");
    expect(properties).toContain("background-color");
  });
});

describe("isValidDeclaration", () => {
  const supports = (property: string, value: string) =>
    property === "color" && (value === "red" || value === "#fff");

  test("accepts what the browser accepts", () => {
    expect(isValidDeclaration("color", "red", supports)).toBe(true);
  });

  test("rejects a value the browser cannot parse", () => {
    expect(isValidDeclaration("color", "notacolor", supports)).toBe(false);
  });

  test("rejects a misspelled property", () => {
    expect(isValidDeclaration("colour", "red", supports)).toBe(false);
  });

  test("rejects an empty value before asking the browser", () => {
    expect(isValidDeclaration("color", "", supports)).toBe(false);
    expect(isValidDeclaration("color", "   ", supports)).toBe(false);
  });

  test("rejects an empty property", () => {
    expect(isValidDeclaration("", "red", supports)).toBe(false);
  });

  /**
   * jsdom has no CSS.supports, and neither do some older browsers. Blocking
   * every edit in that case would make the game unplayable, and the sandboxed
   * stage is the actual safety net — so validation degrades to permissive.
   */
  test("falls back to permissive when the browser has no CSS.supports", () => {
    expect(isValidDeclaration("color", "red", null)).toBe(true);
    expect(isValidDeclaration("anything", "at-all", null)).toBe(true);
  });

  test("still rejects an empty value with no CSS.supports available", () => {
    expect(isValidDeclaration("color", "", null)).toBe(false);
  });
});

describe("isColorValue", () => {
  const supports = (property: string, value: string) =>
    property === "color" &&
    ["red", "#1a73e8", "rgb(0, 0, 0)", "transparent", "currentColor"].includes(value);

  test("recognises the ways a colour gets written", () => {
    expect(isColorValue("red", supports)).toBe(true);
    expect(isColorValue("#1a73e8", supports)).toBe(true);
    expect(isColorValue("rgb(0, 0, 0)", supports)).toBe(true);
  });

  test("ignores values that are not colours", () => {
    expect(isColorValue("flex", supports)).toBe(false);
    expect(isColorValue("20px", supports)).toBe(false);
    expect(isColorValue("", supports)).toBe(false);
  });

  /**
   * Strict where `isValidDeclaration` is permissive, and deliberately so: a
   * missing swatch is invisible, a wrong one is a lie about what got played.
   */
  test("shows nothing rather than guessing when the browser cannot say", () => {
    expect(isColorValue("red", null)).toBe(false);
  });

  test("skips keywords a swatch could not honestly draw", () => {
    expect(isColorValue("currentColor", supports)).toBe(false);
    expect(isColorValue("transparent", supports)).toBe(false);
  });
});
