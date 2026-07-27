import { Box } from "@mui/material";
import { Plane } from "./Skyline";
import { color, font } from "../theme/tokens";

/**
 * The compact mark, for the masthead. The cover carries the full three-line
 * lockup; this is the same voice at a glance — the plane, then the two words
 * that matter.
 */
export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: color.flame }}>
      <Plane size={size * 1.5} />
      <Box
        component="span"
        sx={{
          fontFamily: font.display,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontSize: size,
          color: color.paper,
          whiteSpace: "nowrap",
        }}
      >
        Fake Dev
        <Box
          component="span"
          sx={{
            display: { xs: "none", sm: "inline" },
            color: color.flame,
            letterSpacing: "0.1em",
            fontSize: "0.62em",
            ml: 0.75,
          }}
        >
          Amsterdam
        </Box>
      </Box>
    </Box>
  );
}
