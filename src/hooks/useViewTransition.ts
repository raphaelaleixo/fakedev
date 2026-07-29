import { useEffect, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

/**
 * How many transitions this module has in flight, and who wants to know.
 *
 * Module state rather than a context because it is one fact about the document
 * — the browser will only run one of these at a time — and threading a provider
 * through the tree to say so would be ceremony around a boolean.
 */
let moving = 0;
const watchers = new Set<() => void>();

const settled = () => moving === 0;

const subscribe = (notify: () => void) => {
  watchers.add(notify);
  return () => watchers.delete(notify);
};

const setMoving = (delta: number) => {
  moving += delta;
  watchers.forEach((notify) => notify());
};

/**
 * Whether the page is holding still.
 *
 * For anything that runs on a timer *after* a transition — the resolution's
 * beats, which have to start counting from the end of the movement rather than
 * from the commit that began it. A `setTimeout` armed on mount is armed from
 * inside the transition callback, so it is racing the choreography: whatever it
 * changes lands on a live `::view-transition-new` layer, mid-flight, with no
 * transition of its own.
 *
 * `true` where the API is missing, since nothing is ever moving there.
 */
export function useTransitionSettled() {
  return useSyncExternalStore(subscribe, settled, () => true);
}

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
export function useViewTransition<T>(
  value: T,
  /**
   * A marker class for the duration, so CSS can tell which transition is
   * running. A function when one value has more than one way to change — a
   * round starting and a round ending are not the same movement, and two
   * separate hooks would be two transitions that cancel each other.
   */
  type?: string | ((from: T, to: T) => string | undefined),
): T {
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
    const named = typeof type === "function" ? type(shown, value) : type;
    const marker = named ? `vt-${named}` : null;
    if (marker) root.classList.add(marker);

    setMoving(1);
    const transition = document.startViewTransition(() => flushSync(() => setShown(value)));
    transition.finished.finally(() => {
      setMoving(-1);
      if (marker) root.classList.remove(marker);
    });
  }, [supported, type, value, shown]);

  return supported ? shown : value;
}
