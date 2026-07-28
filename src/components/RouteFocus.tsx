import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

/**
 * Moves focus to the new view's heading on every route change.
 *
 * A view transition rearranges the layout but does nothing about focus: the
 * element you activated is gone, so focus falls back to `<body>` and a keyboard
 * or screen-reader user is left at the top of nowhere with no announcement that
 * anything happened. Routing focus to the incoming `<h1>` fixes both — it says
 * where you are and puts the tab order back at the start of the new page.
 *
 * `tabindex="-1"` makes the heading programmatically focusable without adding
 * it to the tab sequence, and `preventScroll` stops the browser jumping the
 * page mid-animation.
 *
 * It deliberately does nothing on first paint — stealing focus from the address
 * bar on a cold load is its own bug.
 */
export default function RouteFocus() {
  const { pathname } = useLocation();
  const landed = useRef(false);

  useEffect(() => {
    if (!landed.current) {
      landed.current = true;
      return;
    }
    // Deferred a frame: the route's element renders after this effect on a
    // lazy route, so the heading may not exist yet.
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("h1");
      if (!heading) return;

      /**
       * A view that autofocuses a control has already said where focus
       * belongs, and it knows better than this does — the join screen sends
       * you straight into the code field. Anything other than `<body>` holding
       * focus means somebody claimed it deliberately, so leave it alone.
       */
      const claimed = document.activeElement;
      if (claimed && claimed !== document.body) {
        heading.dataset.routeFocus = "skipped";
        return;
      }

      heading.dataset.routeFocus = "moved";
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <Outlet />;
}
