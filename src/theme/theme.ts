import { createTheme } from "@mui/material/styles";
import { color, focusRing, font, radius } from "./tokens";

/**
 * The app is dark. Every surface a player touches — cover, lobby, canvas,
 * inspector, controller, ceremony — sits on ink, so the theme is dark by
 * default rather than dark by exception.
 *
 * The one bright surface, the Render Window, is an iframe with its own
 * document, so it is untouched by any of this. That's the point: the render
 * stays a lit window onto real UI while everything around it is the game.
 */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: color.flame, contrastText: color.onFlame },
    secondary: { main: color.paper, contrastText: color.ink },
    error: { main: color.flame },
    background: { default: color.ink, paper: color.inkPanel },
    text: { primary: color.paper, secondary: color.muted },
    divider: color.inkRule,
  },
  shape: { borderRadius: radius.md },
  typography: {
    fontFamily: font.mono,
    h1: {
      fontFamily: font.display,
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 0.9,
      textTransform: "uppercase",
    },
    h2: {
      fontFamily: font.display,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 0.95,
      textTransform: "uppercase",
    },
    h3: { fontFamily: font.display, fontWeight: 800, letterSpacing: "-0.01em" },
    h4: { fontFamily: font.display, fontWeight: 600 },
    body1: { fontFamily: font.prose },
    body2: { fontFamily: font.prose },
    button: {
      fontFamily: font.mono,
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: 0,
    },
    /**
     * `caption` is this app's label voice — composer steps, "The Secret",
     * "Room code", the value editor. Setting it in the display face draws the
     * line the interface actually has: **labels in Bricolage, values in mono**.
     * The thing being named and the thing itself stop looking alike.
     *
     * 600 because that and 800 are the only weights index.html loads; asking
     * for anything else would resolve to one of them regardless.
     */
    caption: {
      fontFamily: font.display,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },
  components: {
    // Flat throughout: hairlines separate, elevation never does.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${color.inkRule}`, backgroundImage: "none" },
      },
    },
    // No ripple anywhere. The app is flat by design — hairlines separate and
    // elevation never does — and a spreading circle is elevation's cousin.
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          /**
           * Flat, said here rather than through `disableElevation`.
           *
           * That prop emits `&.Mui-focusVisible { box-shadow: none }`, which
           * cancelled half the focus ring — the inner one is a box-shadow, and
           * on the flame band that inner ring is the half doing the work.
           * Zeroing the shadow ourselves keeps buttons flat and leaves focus
           * free to draw.
           */
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
          /**
           * Press feedback, now that the ripple is gone.
           *
           * A scale rather than a darker fill, because the fill is the one
           * thing that differs across variants — contained is ink, outlined and
           * text are transparent — so a colour shift would be invisible on two
           * of the three. This is the same on all of them, and on both
           * surfaces.
           *
           * Individual `scale` rather than `transform`, so nothing here has to
           * know whether something else already set a transform.
           */
          "&:active": { boxShadow: "none", scale: "0.97" },
          transition:
            "scale 80ms ease-out, background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out",
          // A press is a response to input, not motion for its own sake — so it
          // still happens, it just stops being animated.
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          paddingInline: 20,
          paddingBlock: 10,
          /**
           * Every button carries a border, visible or not.
           *
           * A border occupies space whether you can see it or not, so a row
           * mixing outlined and filled buttons came out uneven — the outlined
           * one 4px larger in both directions. Declaring it here and letting
           * variants set only the *colour* keeps every button in the app the
           * same size.
           */
          border: "2px solid transparent",
          // Flame is a fill; as type it needs the dark field behind it, which
          // it now has everywhere.
          "&.Mui-disabled": {
            color: color.inkPunct,
            borderColor: color.inkRule,
          },
          // MUI suppresses the UA focus ring, so put a real one back.
          "&:focus-visible": focusRing,
        },
        contained: { "&:hover": { backgroundColor: color.paper, color: color.ink } },
        /**
         * MUI draws outlined borders at half alpha, which is translucency
         * doing a colour's job — the field behind shows through and the line
         * reads as a smudge rather than a rule. The palette-specific classes
         * beat the shared `outlined` one, so each has to say it.
         */
        outlined: { borderColor: color.inkRule, color: color.paper },
      },
      variants: [
        { props: { variant: "outlined", color: "primary" }, style: { borderColor: color.flame } },
        { props: { variant: "outlined", color: "secondary" }, style: { borderColor: color.paper } },
      ],
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          fontFamily: font.mono,
          backgroundColor: color.ink,
          "& fieldset": { borderColor: color.inkRule },
          "&:hover fieldset": { borderColor: color.inkPunct },
        },
        input: { color: color.paper },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: color.muted, fontFamily: font.display, fontWeight: 600 },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        // Helper text names the shape of a value without being one, so it
        // belongs with the labels rather than with the mono it sits under.
        root: {
          color: color.muted,
          fontFamily: font.display,
          fontWeight: 600,
          letterSpacing: 0,
          marginInline: 0,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          borderColor: color.inkRule,
          color: color.muted,
          fontFamily: font.mono,
          "&:hover": { backgroundColor: color.inkPanel },
          /**
           * Paper, not flame. These are choices being made — a target, a
           * property — and there are several of them on the way to one commit.
           * Flame is what says *this is the action*, so spending it on every
           * step leaves the button that actually does something looking like
           * the fourth thing highlighted on the screen.
           */
          "&.Mui-selected": {
            backgroundColor: color.paper,
            color: color.ink,
            borderColor: color.paper,
            "&:hover": { backgroundColor: color.paper },
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: color.inkPanel,
          border: `1px solid ${color.inkRule}`,
          fontFamily: font.mono,
        },
        option: {
          fontFamily: font.mono,
          '&[aria-selected="true"], &.Mui-focused': {
            backgroundColor: color.ink,
            color: color.flame,
          },
        },
      },
    },
    MuiSlider: { styleOverrides: { root: { color: color.flame } } },
    // Links are focusable too, and MUI leaves them to the UA — which draws a
    // ring the same colour on both surfaces, so it disappears on one of them.
    MuiLink: { styleOverrides: { root: { "&:focus-visible": focusRing } } },
  },
});

export default theme;
