import type { ComponentType } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

/**
 * Code splitting lives on the **route**, not in `React.lazy`.
 *
 * The difference matters for view transitions. `React.lazy` resolves its chunk
 * *after* the navigation commits, so React suspends inside
 * `startViewTransition`, the browser snapshots a "new" state identical to the
 * old one, and the transition is over before the page it was meant to animate
 * exists. That is why leaving the cover looked inert while coming back to it
 * animated — the cover's chunk was already in memory.
 *
 * A route-level `lazy` is awaited as *part of* the navigation. The current page
 * stays on screen while the chunk arrives, and only then does the router
 * commit, inside the transition, with a real destination to snapshot.
 */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const routes: RouteObject[] = [
  { path: "/", lazy: page(() => import("./pages/HomePage")) },
  { path: "/how-to-play", lazy: page(() => import("./pages/HowToPlayPage")) },
  { path: "/join", lazy: page(() => import("./pages/JoinPage")) },
  { path: "/room/:id", lazy: page(() => import("./pages/RoomPage")) },
  { path: "/room/:id/player", lazy: page(() => import("./pages/PlayerJoinPage")) },
  { path: "/room/:id/player/:playerId", lazy: page(() => import("./pages/PlayerPage")) },
];

if (import.meta.env.DEV) {
  routes.push({ path: "/mock/big-screen/:id", lazy: page(() => import("./pages/MockBigScreen")) });
  routes.push({ path: "/mock/controller", lazy: page(() => import("./pages/MockController")) });
  routes.push({ path: "/mock/diag", lazy: page(() => import("./pages/MockDiagnostics")) });
}

routes.push({ path: "*", element: <Navigate to="/" replace /> });
