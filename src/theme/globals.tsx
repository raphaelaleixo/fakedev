import GlobalStyles from "@mui/material/GlobalStyles";
import { color, font, radius } from "./tokens";

/**
 * Styles for the headless components `react-gameroom` ships — it deliberately
 * brings no CSS of its own, so the room modal and the fullscreen toggle are
 * dressed here rather than inside each page.
 */
export default function AppGlobalStyles() {
  return (
    <GlobalStyles
      styles={{
        // The page surfaces set their own colour; this is only what shows
        // through an overscroll bounce, and white there is jarring.
        body: { backgroundColor: color.ink },

        /**
         * The app shell owns the viewport, so a page can be more than one
         * element tall without pushing itself off the bottom. The cover is
         * <main> plus <footer>: with the height on <main> the page came out
         * exactly one footer taller than the screen and scrolled for no
         * reason. Pages that are a single element are unaffected — they keep
         * their own `min-height: 100dvh` and simply fill this.
         */
        "#root": { minHeight: "100dvh", display: "flex", flexDirection: "column" },

        /**
         * Leaving the cover.
         *
         * The flame block drops out of the bottom of the screen and the houses
         * ride down with it, a beat behind — the band is what's moving and the
         * drawing is being carried. Meanwhile the masthead drops in from the
         * top and the new page's content fades up underneath it. Coming back,
         * every one of those runs in reverse, which needs no extra rules: the
         * pieces that exist only on the cover are `old` on the way out and
         * `new` on the way in.
         *
         * Distances are viewport-relative rather than percentages of each
         * element, so the band and the footer — two boxes making one visual
         * surface — travel at exactly the same rate instead of desyncing on
         * their different heights.
         *
         * The whole thing is progressive enhancement: a browser without the
         * API just swaps the DOM, which is the behaviour we had.
         */
        "@keyframes cover-drop": { to: { transform: "translateY(100vh)" } },
        "@keyframes cover-rise": { from: { transform: "translateY(100vh)" } },
        "@keyframes masthead-drop": { from: { transform: "translateY(-100%)" } },
        "@keyframes masthead-lift": { to: { transform: "translateY(-100%)" } },
        "@keyframes content-in": { from: { opacity: 0, transform: "translateY(1.5rem)" } },
        "@keyframes content-out": { to: { opacity: 0 } },

        /**
         * The cover's groups sit above `root`, which carries the whole
         * incoming page as one opaque snapshot. The spec's default order
         * already puts them there, but stating it costs one line and removes
         * the possibility of the drop happening behind the page it is
         * supposed to be uncovering.
         */
        "::view-transition-group(cover-band), ::view-transition-group(cover-foot), ::view-transition-group(cover-art), ::view-transition-group(masthead)":
          { zIndex: 1 },

        /**
         * Leaving, the houses go first and the block follows a beat later, so
         * the drawing falls into the flame and the flame takes it down. Coming
         * back reverses the order — the block arrives, then the houses land on
         * it — which is why the two directions stagger the opposite way rather
         * than sharing one rule.
         */
        "::view-transition-old(cover-art)": {
          animation: "cover-drop 460ms cubic-bezier(0.5, 0, 0.85, 0.3) both",
        },
        "::view-transition-old(cover-band), ::view-transition-old(cover-foot)": {
          animation: "cover-drop 420ms 120ms cubic-bezier(0.5, 0, 0.85, 0.3) both",
        },
        "::view-transition-new(cover-band), ::view-transition-new(cover-foot)": {
          animation: "cover-rise 460ms cubic-bezier(0.2, 0.8, 0.3, 1) both",
        },
        "::view-transition-new(cover-art)": {
          animation: "cover-rise 560ms 60ms cubic-bezier(0.2, 0.8, 0.3, 1) both",
        },

        /**
         * Starting the round is not a navigation — same URL, same page — so
         * the marker class scopes it. The lobby leaves to the left and the
         * round arrives from the right, a whole surface each: it reads as
         * moving forward through the game rather than as the screen being
         * replaced.
         *
         * `root` carries both, because the masthead is the only named element
         * in a room and named elements are lifted out of it. Which also means
         * the masthead has to be told to sit still — it exists on both sides,
         * so the route rules below would otherwise slide it in from the top
         * while everything else moves sideways.
         */
        "@keyframes stage-out-left": { to: { transform: "translateX(-100%)" } },
        "@keyframes stage-in-right": { from: { transform: "translateX(100%)" } },

        "html.vt-round-start::view-transition-old(root)": {
          animation: "stage-out-left 460ms cubic-bezier(0.65, 0, 0.35, 1) both",
        },
        "html.vt-round-start::view-transition-new(root)": {
          animation: "stage-in-right 460ms cubic-bezier(0.65, 0, 0.35, 1) both",
        },
        "html.vt-round-start::view-transition-old(masthead), html.vt-round-start::view-transition-new(masthead)":
          { animation: "none" },

        "::view-transition-new(masthead)": {
          animation: "masthead-drop 340ms 80ms cubic-bezier(0.2, 0.8, 0.3, 1) both",
        },
        "::view-transition-old(masthead)": {
          animation: "masthead-lift 260ms cubic-bezier(0.4, 0, 1, 1) both",
        },

        // Everything unnamed rides in `root`: the cover's empty half on one
        // side, the arriving page's content on the other.
        "::view-transition-old(root)": { animation: "content-out 180ms ease-in both" },
        "::view-transition-new(root)": {
          animation: "content-in 360ms 140ms cubic-bezier(0.2, 0.8, 0.3, 1) both",
        },

        /**
         * Reduced motion takes the movement away, not the navigation. Old and
         * new simply cross-fade at the browser's default, which is the
         * quietest thing that still marks that the page changed.
         */
        "@media (prefers-reduced-motion: reduce)": {
          "::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*)": {
            animation: "none !important",
          },
        },

        ".fullscreen-toggle": {
          fontFamily: font.mono,
          fontSize: "0.8rem",
          color: color.muted,
          background: "transparent",
          border: `1px solid ${color.inkRule}`,
          borderRadius: radius.sm,
          padding: "6px 12px",
          cursor: "pointer",
          "&:hover": { color: color.paper, borderColor: color.paper },
        },

        ".room-info-modal": {
          border: `4px solid ${color.flame}`,
          borderRadius: radius.none,
          backgroundColor: color.ink,
          color: color.paper,
          fontFamily: font.mono,
          padding: "24px",
          maxWidth: "min(92vw, 420px)",
          "&::backdrop": { background: "rgba(6, 10, 24, 0.82)" },
          "& h2, & h3": {
            fontFamily: font.display,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            margin: "0 0 12px",
          },
          "& a": {
            display: "block",
            color: color.flame,
            padding: "8px 0",
            borderBottom: `1px solid ${color.inkRule}`,
            textDecoration: "none",
          },
          "& a:hover": { textDecoration: "underline" },
          "& button": {
            fontFamily: font.mono,
            color: color.paper,
            background: "transparent",
            border: `1px solid ${color.inkRule}`,
            borderRadius: radius.sm,
            padding: "6px 12px",
            cursor: "pointer",
          },
          // The QR has to stay light to scan — same window idea as the stage.
          "& svg, & canvas, & img": {
            background: color.paper,
            padding: 8,
            display: "block",
            margin: "0 auto 16px",
          },
        },
      }}
    />
  );
}
