import { createTheme } from "@mui/material/styles";
import { color, font, radius } from "./tokens";

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
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
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
          /**
           * MUI suppresses the UA focus ring, so put a real one back. Drawing
           * it in `currentColor` is what lets one rule work on both surfaces:
           * ink type on the flame band, flame type on every dark page. The
           * offset keeps it clear of the fill.
           */
          "&:focus-visible": {
            outline: `2px solid currentColor`,
            outlineOffset: 2,
          },
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
          "&.Mui-selected": {
            backgroundColor: color.flame,
            color: color.onFlame,
            "&:hover": { backgroundColor: color.flame },
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
  },
});

export default theme;
