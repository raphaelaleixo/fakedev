import GlobalStyles from "@mui/material/GlobalStyles";
import { color, focusRing, font, motion, radius } from "./tokens";

/** `inkPanel` -> `ink-panel`, so the custom properties read like CSS. */
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Styles for the headless components `react-gameroom` ships — it deliberately
 * brings no CSS of its own, so the room modal and the fullscreen toggle are
 * dressed here rather than inside each page.
 */
export default function AppGlobalStyles() {
  return (
    <GlobalStyles
      styles={{
        /**
         * The tokens, as custom properties.
         *
         * Emitted from the same objects the components import, so there is one
         * source and no chance of a hex here disagreeing with a hex there. They
         * exist for the CSS that has no component to live in — the view
         * transition rules below, `react-gameroom`'s headless components — and
         * so anything reading the DOM sees a named colour rather than a hex
         * emotion generated.
         *
         * The MUI palette deliberately keeps the literals: it runs values
         * through `alpha()` and friends, which parse colours and cannot parse
         * `var(--flame)`.
         */
        ":root": {
          ...Object.fromEntries(Object.entries(color).map(([name, value]) => [`--${kebab(name)}`, value])),
          ...Object.fromEntries(Object.entries(motion).map(([name, value]) => [`--motion-${kebab(name)}`, value])),
          "--font-display": font.display,
          "--font-mono": font.mono,
          "--font-prose": font.prose,
        },

        /**
         * Slow motion, for looking at a transition instead of inferring it.
         *
         * Every duration and delay in the choreography reads one of these, so
         * overriding the four scales the whole orchestration proportionally —
         * the order of the movements is preserved, which is the thing worth
         * checking. Toggled from the mock big screen.
         */
        "html.vt-slow": {
          "--motion-quick": "900ms",
          "--motion-base": "1700ms",
          "--motion-slow": "2300ms",
          "--motion-stagger": "400ms",
        },

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
          animation: `cover-drop var(--motion-slow) var(--motion-exit) both`,
        },
        "::view-transition-old(cover-band), ::view-transition-old(cover-foot)": {
          animation: `cover-drop var(--motion-slow) var(--motion-stagger) var(--motion-exit) both`,
        },
        "::view-transition-new(cover-band), ::view-transition-new(cover-foot)": {
          animation: `cover-rise var(--motion-slow) var(--motion-enter) both`,
        },
        "::view-transition-new(cover-art)": {
          animation: `cover-rise var(--motion-slow) var(--motion-stagger) var(--motion-enter) both`,
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
          animation: `stage-out-left var(--motion-slow) var(--motion-travel) both`,
        },
        "html.vt-round-start::view-transition-new(root)": {
          animation: `stage-in-right var(--motion-slow) var(--motion-travel) both`,
        },
        "html.vt-round-start::view-transition-old(masthead), html.vt-round-start::view-transition-new(masthead)":
          { animation: "none" },

        /**
         * The vote opening is a cut, on purpose.
         *
         * The board is on both sides of it and identical — the countdown was
         * only ever an overlay — so the sole thing that changes is the column
         * beside it. Sliding the page for that would move the board away from
         * itself and back. With every animation off the transition ends on the
         * next frame, which is the point: this exists to *suppress* the default
         * cross-fade, not to draw anything.
         */
        [`html.vt-open-vote::view-transition-group(*),
          html.vt-open-vote::view-transition-old(*),
          html.vt-open-vote::view-transition-new(*)`]: { animation: "none" },

        "::view-transition-new(masthead)": {
          animation: `masthead-drop var(--motion-base) var(--motion-stagger) var(--motion-enter) both`,
        },
        "::view-transition-old(masthead)": {
          animation: `masthead-lift var(--motion-quick) var(--motion-exit) both`,
        },

        // Everything unnamed rides in `root`: the cover's empty half on one
        // side, the arriving page's content on the other.
        "::view-transition-old(root)": { animation: `content-out var(--motion-quick) var(--motion-exit) both` },
        "::view-transition-new(root)": {
          animation: `content-in var(--motion-base) var(--motion-stagger) var(--motion-enter) both`,
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

        /**
         * The heading RouteFocus lands on gets no ring.
         *
         * WCAG 2.4.7 is about *keyboard operable* components, and this one is
         * not: `tabindex="-1"` keeps it out of the tab order, so nobody can
         * ever reach it by tabbing. It is focused only by script, to announce
         * the new view — and a browser default ring drawn around a headline is
         * both meaningless and the loudest thing on the page.
         *
         * Scoped to the attribute RouteFocus sets rather than to headings in
         * general, so this can never quietly swallow a real indicator.
         */
        "[data-route-focus]:focus": { outline: "none" },

        // The one pulse — see `pulse` in tokens.
        "@keyframes pulse": { "50%": { opacity: 0.35 } },

        // Votes arriving on a row, one after another. A plain CSS animation on
        // the real elements, which is all it ever needed to be: the rows are
        // never snapshotted, so nothing here has to be staged around a
        // transition.
        "@keyframes count-in": { from: { opacity: 0, scale: "0.8" } },

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
          // `react-gameroom` ships it headless, so its focus ring is ours too.
          "&:focus-visible": focusRing,
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
