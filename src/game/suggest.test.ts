import { describe, expect, test } from "vitest";
import { rankSuggestions } from "./suggest";

const POOL = [
  "display",
  "direction",
  "border-radius",
  "padding",
  "color",
  "background-color",
  "border-color",
  "gap",
];

describe("rankSuggestions", () => {
  test("puts properties starting with the query first", () => {
    const ranked = rankSuggestions("d", POOL);
    expect(ranked.slice(0, 2)).toEqual(["direction", "display"]);
  });

  test("still finds a match in the middle of a name", () => {
    expect(rankSuggestions("d", POOL)).toContain("border-radius");
    expect(rankSuggestions("d", POOL)).toContain("padding");
  });

  test("ranks an exact prefix above a substring match", () => {
    const ranked = rankSuggestions("color", POOL);
    expect(ranked[0]).toBe("color");
    expect(ranked).toContain("background-color");
    expect(ranked.indexOf("color")).toBeLessThan(ranked.indexOf("background-color"));
  });

  test("sorts alphabetically within each tier, so the list is stable", () => {
    const ranked = rankSuggestions("color", POOL);
    expect(ranked).toEqual(["color", "background-color", "border-color"]);
  });

  test("ignores case", () => {
    expect(rankSuggestions("DISP", POOL)).toEqual(["display"]);
  });

  test("ignores surrounding whitespace", () => {
    expect(rankSuggestions("  gap  ", POOL)).toEqual(["gap"]);
  });

  test("returns the pool untouched when there is no query", () => {
    expect(rankSuggestions("", POOL)).toEqual(POOL);
  });

  test("returns nothing when nothing matches", () => {
    expect(rankSuggestions("zzz", POOL)).toEqual([]);
  });

  test("caps the list so a one-letter query cannot render hundreds of rows", () => {
    expect(rankSuggestions("o", POOL, 3)).toHaveLength(3);
  });

  test("keeps the best matches when capping", () => {
    // Only "color" starts with "c"; the rest are substring matches.
    expect(rankSuggestions("c", POOL, 1)).toEqual(["color"]);
  });
});
