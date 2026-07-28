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
