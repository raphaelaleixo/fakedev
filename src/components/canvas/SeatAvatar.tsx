import { Box } from "@mui/material";
import { SEAT_COLORS } from "../../game/constants";
import { color, dim, font } from "../../theme/tokens";
import type { SeatInfo } from "./LiveInspector";

/**
 * A player, as a round avatar in their seat colour.
 *
 * The same colour their edits are written in on the board, so the sidebar, the
 * vote and the code all agree about who is who without any of them saying so.
 * Shared rather than copied because the turn order and the vote draw the same
 * people one screen apart, and two drawings of one person is one too many.
 *
 * Always decorative: a name sits beside it everywhere it is used, and an avatar
 * that announced the initial would make every player read as "R Rafa".
 */
export default function SeatAvatar({
  seat,
  lit,
  ringed,
  size = 28,
}: {
  seat: SeatInfo | undefined;
  /** Full seat colour rather than a dimmed one — in play, not waiting. */
  lit?: boolean;
  /** A ring, for the one seat the screen is currently about. */
  ringed?: boolean;
  /**
   * Pixels, or any CSS length. A length in `em` lets a row that scales with the
   * viewport carry its avatar with it instead of pinning it to one number.
   */
  size?: number | string;
}) {
  const tint = seat ? SEAT_COLORS[seat.color] : color.muted;
  const name = seat?.name ?? "?";

  return (
    <Box
      aria-hidden
      sx={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        backgroundColor: lit ? tint : dim(tint, 55),
        color: color.ink,
        fontFamily: font.display,
        fontWeight: 800,
        // Half the circle either way — the initial is drawn to the avatar, not
        // to whatever type it happens to be sitting next to.
        fontSize: typeof size === "number" ? size * 0.5 : `calc(${size} * 0.5)`,
        lineHeight: 1,
        // A ring rather than a fill change, so the seat colour stays the seat
        // colour whatever the screen is doing with it.
        outline: ringed ? `2px solid ${color.paper}` : "none",
        outlineOffset: 2,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </Box>
  );
}
