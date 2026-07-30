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
  note,
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
  /**
   * A word about this person, beside their name rather than at the end of the
   * row. The end of the row is where the round's changing value goes — locked
   * in, then votes, then points — and something that is true from now on should
   * not be sitting in the slot that keeps being replaced.
   */
  note?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Box
      component="li"
      aria-current={current || undefined}
      sx={{
        /**
         * The one knob the whole row is drawn from.
         *
         * This list is read from the other side of a room, so it scales with
         * the viewport like the inspector beside it rather than sitting at a
         * laptop's idea of small. Everything below is in `em`, which means the
         * avatar, the gaps and the round's value all follow this one number and
         * the row keeps its proportions at every size.
         *
         * The floor is what it used to be flat, so nothing shrinks on a phone.
         */
        fontSize: "clamp(0.95rem, 1.3vw, 1.4rem)",
        display: "flex",
        alignItems: "center",
        gap: "0.66em",
        py: "0.5em",
        "&:not(:last-of-type)": { borderBottom: `1px solid ${color.inkRule}` },
      }}
    >
      <SeatAvatar seat={seat} lit={lit} ringed={ringed} size="1.9em" />
      {/* The name and the word beside it sit on one baseline, which is the
          only way two different type sizes look deliberate rather than
          nudged. Nested rather than aligned across the whole row: baseline
          alignment pulls its group to the top of the line, so doing it at row
          level would drag the text off centre from the avatar. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 1,
          // Shrinks before the note does, so a long name truncates rather than
          // pushing the word off the row.
          flex: "0 1 auto",
          minWidth: 0,
        }}
      >
        <Box
          component="span"
          sx={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: font.display,
            fontWeight: 600,
            color: lit ? color.paper : dim(color.paper, 60),
          }}
        >
          {seat?.name ?? "?"}
        </Box>
        {note}
      </Box>
      {/* Takes the slack, so the note stays against the name and the round's
          value stays against the right-hand edge. */}
      <Box sx={{ flex: 1 }} />
      {trailing}
    </Box>
  );
}
