import { describe, expect, test } from "vitest";
import { ALL_SECRETS, CATEGORIES, getGroupSecrets, getSecret } from "./deck";

/**
 * Guards the deck's structural invariants. `cards.md` says the screening rules
 * apply to anything added later — this is where that gets enforced, so a 61st
 * card or a lopsided group fails CI instead of surfacing as a broken steal.
 */
describe("deck", () => {
  test("holds 4 categories of 15 secrets", () => {
    expect(CATEGORIES).toHaveLength(4);
    for (const category of CATEGORIES) {
      expect(category.secrets, category.id).toHaveLength(15);
    }
    expect(ALL_SECRETS).toHaveLength(60);
  });

  test("gives every secret a unique id", () => {
    const ids = new Set(ALL_SECRETS.map((s) => s.id));
    expect(ids.size).toBe(ALL_SECRETS.length);
  });

  test("files every secret under its own category", () => {
    for (const category of CATEGORIES) {
      for (const secret of category.secrets) {
        expect(secret.categoryId, secret.id).toBe(category.id);
      }
    }
  });

  test("splits each category into exactly 3 groups of 5", () => {
    for (const category of CATEGORIES) {
      const sizes = new Map<string, number>();
      for (const secret of category.secrets) {
        sizes.set(secret.group, (sizes.get(secret.group) ?? 0) + 1);
      }
      expect([...sizes.keys()], category.id).toHaveLength(3);
      for (const [groupId, size] of sizes) {
        expect(size, `${category.id}/${groupId}`).toBe(5);
      }
    }
  });

  test("never reuses a group id across categories", () => {
    const groups = ALL_SECRETS.map((s) => s.group);
    expect(new Set(groups).size).toBe(12);
  });

  test("resolves a secret by id", () => {
    expect(getSecret("everyday-components/progress-bar")?.group).toBe("wide-bar");
    expect(getSecret("nope/nope")).toBeUndefined();
  });

  test("returns a full 5-card slate including the secret itself", () => {
    for (const secret of ALL_SECRETS) {
      const slate = getGroupSecrets(secret);
      expect(slate, secret.id).toHaveLength(5);
      expect(slate.map((s) => s.id), secret.id).toContain(secret.id);
    }
  });
});
