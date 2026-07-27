import { Box } from "@mui/material";
import { isColorValue } from "../game/css";
import { color } from "../theme/tokens";

/**
 * A colour value, shown as itself — the way DevTools previews one.
 *
 * Renders nothing unless the value really is a drawable colour, and the check
 * asks the browser rather than pattern-matching hex, so named colours, `hsl()`
 * and whatever lands next all work without a list to maintain.
 *
 * Ringed rather than bordered so a near-black value still reads against the
 * dark panel.
 */
export default function ColorSwatch({ value }: { value: string }) {
  if (!isColorValue(value)) return null;
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-block",
        width: "0.75em",
        height: "0.75em",
        mr: 0.5,
        verticalAlign: "baseline",
        backgroundColor: value,
        outline: `1px solid ${color.inkPunct}`,
      }}
    />
  );
}
