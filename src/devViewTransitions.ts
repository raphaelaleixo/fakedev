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
/** Every animation the browser is running on a view-transition pseudo-element. */
const transitionAnimations = () =>
  document
    .getAnimations()
    .filter((animation) =>
      (animation.effect as KeyframeEffect | null)?.pseudoElement?.includes("view-transition"),
    );

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
        if (held !== null) freeze(held);
      },
      (error) => console.warn("[vt] skipped:", error),
    );
    transition.finished.then(() => console.log("[vt] finished"));
    return transition;
  };

  /**
   * Freeze a transition part-way so it can be *inspected*.
   *
   * Slow motion is not enough on its own: opening DevTools costs a second or
   * two, and by the time the panel is up the transition has finished and the
   * pseudo-elements it built no longer exist — which is why they cannot be
   * found in the elements tree. Pausing the animations leaves the whole
   * `::view-transition` subtree mounted and holding still, so computed styles
   * can be read off it and a frame can be screenshotted at leisure.
   *
   * The transition never settles while it is held — `finished` does not
   * resolve, so the marker class stays on `<html>` and the page stays mid-move.
   * `vtResume()` lets it go.
   */
  let held: number | null = null;

  const freeze = (fraction: number) => {
    const running = transitionAnimations();
    if (!running.length) {
      console.warn("[vt] nothing to hold — the transition was skipped");
      return;
    }
    // The longest of them is the run as a whole, so one fraction reads the same
    // across every pseudo-element however each one is delayed.
    const span = Math.max(
      ...running.map((animation) => {
        const timing = (animation.effect as KeyframeEffect).getTiming();
        const duration = Number(timing.duration);
        return Number(timing.delay ?? 0) + (Number.isNaN(duration) ? 0 : duration);
      }),
    );
    running.forEach((animation) => {
      animation.pause();
      animation.currentTime = fraction * span;
    });
    console.log(
      `[vt] held at ${Math.round(fraction * 100)}% — ${Math.round(fraction * span)}ms of ${Math.round(span)}ms. vtScrub(0…1) to move, vtResume() to let go.`,
    );
  };

  const dev = window as unknown as {
    vtSlow: () => void;
    vtHold: (fraction?: number) => void;
    vtScrub: (fraction: number) => void;
    vtResume: () => void;
  };

  dev.vtHold = (fraction = 0.5) => {
    held = fraction;
    console.log(`[vt] armed — the next transition will hold at ${Math.round(fraction * 100)}%`);
  };
  dev.vtScrub = (fraction) => {
    held = fraction;
    freeze(fraction);
  };
  dev.vtResume = () => {
    held = null;
    transitionAnimations().forEach((animation) => animation.play());
    console.log("[vt] released");
  };

  // Worth stating up front: with this on, our own rules switch themselves off
  // and every transition completes instantly — which looks exactly like a
  // transition that never ran.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /**
   * Slow motion, so a transition can be looked at rather than inferred. Call
   * `vtSlow()` from the console; it stretches every rule to six seconds.
   */
  dev.vtSlow = () => {
    // The same switch the mock's control uses — one mechanism, and it scales
    // the choreography rather than flattening every step to one duration.
    const on = document.documentElement.classList.toggle("vt-slow");
    console.log(`[vt] slow motion ${on ? "on" : "off"}`);
  };

  console.log(
    `[vt] installed — vtSlow(), vtHold(0…1), vtScrub(0…1), vtResume() — prefers-reduced-motion: ${reduced ? "REDUCE" : "no-preference"}`,
  );
}
