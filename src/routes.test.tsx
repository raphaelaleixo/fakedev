import { describe, expect, test, vi } from "vitest";
import { routes } from "./routes";

/**
 * Route-level `lazy` moves the import out of the component tree, where a typo
 * would have failed loudly at build time, and into a callback that only runs
 * when someone navigates. This walks every one of them so a bad path fails here
 * instead of in front of a room full of players.
 */
vi.mock("./firebase", () => ({ database: {} }));

describe("routes", () => {
  const lazyRoutes = routes.filter((route) => typeof route.lazy === "function");

  test("splits every real page into its own chunk", () => {
    expect(lazyRoutes.length).toBe(routes.length - 1); // all but the catch-all
  });

  test("each one resolves to a component", async () => {
    for (const route of lazyRoutes) {
      const load = route.lazy as () => Promise<{ Component?: unknown }>;
      const resolved = await load();
      expect(resolved.Component, route.path).toBeTypeOf("function");
    }
  });
});
