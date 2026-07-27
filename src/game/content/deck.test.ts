import { describe, expect, test } from "vitest";
import { COMPONENTS, STYLES, getComponent, getStyle } from "./deck";
import en from "../../locales/en.json";

function lookup(key: string): unknown {
  return key.split(".").reduce<unknown>(
    (node, part) =>
      node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
    en,
  );
}

/**
 * Guards the decks' structural invariants. `cards.md` says the screening rules
 * apply to anything added later — this is where that gets enforced, so a
 * sixteenth style or a missing label fails CI instead of surfacing mid-game.
 */
describe("the decks", () => {
  test("holds fifteen of each", () => {
    expect(STYLES).toHaveLength(15);
    expect(COMPONENTS).toHaveLength(15);
  });

  test("offers 225 Secrets from thirty authored items", () => {
    expect(STYLES.length * COMPONENTS.length).toBe(225);
  });

  test("gives every entry a unique id within its deck", () => {
    expect(new Set(STYLES.map((c) => c.id)).size).toBe(STYLES.length);
    expect(new Set(COMPONENTS.map((c) => c.id)).size).toBe(COMPONENTS.length);
  });

  test("gives every entry a label that actually resolves", () => {
    for (const card of [...STYLES, ...COMPONENTS]) {
      expect(lookup(card.labelKey), card.labelKey).toEqual(expect.any(String));
    }
  });

  test("gives every entry an authoring sketch", () => {
    for (const card of [...STYLES, ...COMPONENTS]) {
      expect(card.sketch.length, card.id).toBeGreaterThan(10);
    }
  });

  test("resolves a card by id, and only from its own deck", () => {
    expect(getStyle("brutalist")?.labelKey).toBe("deck.style.brutalist");
    expect(getComponent("progress-bar")?.labelKey).toBe("deck.component.progress-bar");
    // The two decks are separate namespaces; a style is not a component.
    expect(getComponent("brutalist")).toBeUndefined();
    expect(getStyle("progress-bar")).toBeUndefined();
  });
});
