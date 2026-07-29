import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { color, dim, font } from "../../theme/tokens";
import type { SeatInfo } from "./LiveInspector";
import SeatAvatar from "./SeatAvatar";

/**
 * The roster, as the column beside the board draws it: avatar, name, and one
 * value on the right, with a hairline between.
 *
 * Both phases use it. Turn order is an ordered list carrying each player's
 * points; the vote is an unordered one carrying whether they have locked in.
 * The only real differences are the trailing value and whether order means
 * anything — everything else was duplicated, which is how two lists a screen
 * apart end up subtly disagreeing about a person.
 */
export function SeatList({
  label,
  labelledBy,
  ordered,
  children,
}: {
  label?: string;
  /** Preferred where the list already has a visible heading — one name, not two. */
  labelledBy?: string;
  /** `ol` when the sequence is the point, `ul` when it is just the roster. */
  ordered?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      component={ordered ? "ol" : "ul"}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      sx={{ listStyle: "none", m: 0, p: 0, display: "grid" }}
    >
      {children}
    </Box>
  );
}

export function SeatRow({
  seat,
  lit,
  ringed,
  current,
  trailing,
}: {
  seat: SeatInfo | undefined;
  /**
   * This seat is in whatever state the screen is about — taking its turn, or
   * having voted. Drives the avatar's fill and the name's weight of colour, so
   * the two phases dim a waiting player the same way.
   */
  lit?: boolean;
  ringed?: boolean;
  /** Whose turn it is, for anything that cannot see the ring. */
  current?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <Box
      component="li"
      aria-current={current || undefined}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        py: 1,
        "&:not(:last-of-type)": { borderBottom: `1px solid ${color.inkRule}` },
      }}
    >
      <SeatAvatar seat={seat} lit={lit} ringed={ringed} />
      <Box
        component="span"
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: "0.95rem",
          color: lit ? color.paper : dim(color.paper, 60),
        }}
      >
        {seat?.name ?? "?"}
      </Box>
      {trailing}
    </Box>
  );
}
