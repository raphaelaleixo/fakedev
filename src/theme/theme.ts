import { createTheme } from "@mui/material/styles";
import { color, font, radius } from "./tokens";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: color.tag },
    secondary: { main: color.value },
    error: { main: color.alarm },
    background: { default: color.paper, paper: color.chrome },
    text: { primary: color.ink, secondary: color.muted },
    divider: color.rule,
  },
  shape: { borderRadius: radius.md },
  typography: {
    fontFamily: font.mono,
    h1: {
      fontFamily: font.display,
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 0.95,
    },
    h2: {
      fontFamily: font.display,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      lineHeight: 1,
    },
    h3: { fontFamily: font.display, fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontFamily: font.display, fontWeight: 600 },
    body1: { fontFamily: font.prose },
    body2: { fontFamily: font.prose },
    button: {
      fontFamily: font.mono,
      fontWeight: 500,
      textTransform: "none",
      letterSpacing: 0,
    },
    caption: { fontFamily: font.mono, letterSpacing: "0.02em" },
  },
  components: {
    // DevTools separates with hairlines, never with elevation.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${color.rule}`, backgroundImage: "none" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.sm, paddingInline: 16 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          fontFamily: font.mono,
          backgroundColor: color.paper,
        },
      },
    },
  },
});

export default theme;
