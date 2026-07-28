/**
 * Dev-only instrumentation for the route view transitions.
 *
 * A console patch is the obvious way to do this, but it is wiped by every full
 * reload — and editing a route file makes Vite reload the page — so "nothing
 * logged" stops being evidence about anything. Living in the app instead, it
 * survives reloads and HMR.
 *
 * Imported only under `import.meta.env.DEV`, so it cannot reach production.
 */
export function instrumentViewTransitions() {
  const original = document.startViewTransition?.bind(document);

  if (!original) {
    console.warn("[vt] this browser has no startViewTransition — transitions will be skipped");
    return;
  }

  document.startViewTransition = (...args: Parameters<typeof original>) => {
    // Read the names off the *current* DOM, which is the "old" snapshot the
    // browser is about to take. Two elements sharing a name is the usual
    // reason a transition starts and is then silently skipped.
    const names = [...document.querySelectorAll<HTMLElement>("*")]
      .map((el) => getComputedStyle(el).viewTransitionName)
      .filter((name) => name && name !== "none");
    const duplicated = names.filter((n, i) => names.indexOf(n) !== i);

    console.log(
      `[vt] start — from ${location.pathname} — captured: ${names.join(", ") || "(none)"}`,
    );
    if (duplicated.length) console.error("[vt] duplicate names, will be skipped:", duplicated);

    const startedAt = performance.now();
    const transition = original(...args);
    transition.ready.then(
      () => {
        // The decisive reading: which pseudo-elements the browser actually
        // built, and whether each is running one of our animations or the
        // UA's default fade. A group that never appears here was never
        // captured; one running `-ua-view-transition-*` means our selector
        // did not match it.
        const running = document
          .getAnimations()
          .map((animation) => {
            const effect = animation.effect as KeyframeEffect | null;
            return {
              pseudo: effect?.pseudoElement ?? "",
              animation: (animation as Animation & { animationName?: string }).animationName ?? "?",
              ms: Number(effect?.getTiming().duration ?? 0),
              // If a declaration in the keyframe is invalid the browser drops
              // it silently: the animation still runs, with nothing in it.
              keyframes: JSON.stringify(
                effect
                  ?.getKeyframes()
                  .map((frame) =>
                    Object.fromEntries(
                      Object.entries(frame).filter(
                        ([key]) => !["offset", "easing", "composite"].includes(key),
                      ),
                    ),
                  ) ?? [],
              ),
            };
          })
          .filter((entry) => entry.pseudo.includes("view-transition"));
        // A long gap here means the new state took a while to commit, which
        // is the signature of a deferred render rather than a CSS problem.
        console.log(
          `[vt] ready — now at ${location.pathname} (${Math.round(performance.now() - startedAt)}ms to commit)`,
        );
        console.table(running);
      },
      (error) => console.warn("[vt] skipped:", error),
    );
    transition.finished.then(() => console.log("[vt] finished"));
    return transition;
  };

  // Worth stating up front: with this on, our own rules switch themselves off
  // and every transition completes instantly — which looks exactly like a
  // transition that never ran.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /**
   * Slow motion, so a transition can be looked at rather than inferred. Call
   * `vtSlow()` from the console; it stretches every rule to six seconds.
   */
  (window as unknown as { vtSlow: () => void }).vtSlow = () => {
    const style = document.createElement("style");
    style.textContent = `
      ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
        animation-duration: 6s !important;
      }`;
    document.head.append(style);
    console.log("[vt] slow motion on — every transition now takes 6s");
  };

  console.log(`[vt] instrumentation installed — prefers-reduced-motion: ${reduced ? "REDUCE" : "no-preference"}`);
}
