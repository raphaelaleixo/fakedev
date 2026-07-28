import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

/**
 * Mirrors a value, applying every change inside a view transition.
 *
 * Route transitions are React Router's job. This is for the changes that are
 * not navigations — the lobby becoming the round, a phase advancing — where the
 * URL never moves and the new state arrives from Firebase rather than from
 * anything a person clicked.
 *
 * The trick is that `startViewTransition` has to *own* the DOM update, and by
 * the time a component sees new props the update has already happened. So the
 * rendered value lags the real one by one commit: this holds the old value,
 * notices the change, and only then lets it through — from inside the
 * transition callback, where the browser can snapshot both sides.
 *
 * `flushSync` because the callback must finish the update before it returns.
 * A deferred render would let the browser snapshot a state that has not
 * changed yet, which is a transition that animates nothing — the exact failure
 * the cover's New game button had.
 *
 * Where the API is missing the value passes straight through, untouched by
 * state, so unsupported browsers get today's instant swap and not a frame of
 * lag for nothing.
 */
export function useViewTransition<T>(value: T, type?: string): T {
  const [shown, setShown] = useState(value);
  // Checked per render rather than cached at module load. A property lookup is
  // free, and caching it made the hook impossible to test without loading the
  // module twice.
  const supported = typeof document !== "undefined" && "startViewTransition" in document;

  useEffect(() => {
    if (!supported || Object.is(shown, value)) return;

    /**
     * A class on <html> for the duration, so CSS can tell *which* transition
     * is running. Every one of these shares the `root` group, and the route
     * transitions already animate it — without a marker, starting a round
     * would inherit the cover's choreography.
     *
     * The `types` option is the modern spelling of this, but it needs the
     * object form of `startViewTransition`, which older browsers treat as a
     * callback and throw on. A class works wherever the API does.
     */
    const root = document.documentElement;
    const marker = type ? `vt-${type}` : null;
    if (marker) root.classList.add(marker);

    const transition = document.startViewTransition(() => flushSync(() => setShown(value)));
    if (marker) transition.finished.finally(() => root.classList.remove(marker));
  }, [supported, type, value, shown]);

  return supported ? shown : value;
}
