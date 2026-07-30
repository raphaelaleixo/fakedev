import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { useTranslation } from "react-i18next";
import { SOFT_TIMER_SECONDS } from "../../game/constants";
import { color, dim, font, motion, pulse } from "../../theme/tokens";
import type { SeatInfo } from "./LiveInspector";
import { SeatList, SeatRow } from "./SeatList";

/**
 * Who is contributing, in turn order, with the current one marked — plus the
 * soft timer.
 *
 * Read as a repository's contributor list: a round avatar, a name, a hairline
 * between. The avatar is the seat colour made round, which is the same colour
 * their edits are written in on the board — so the sidebar and the code agree
 * about who is who without either of them saying so.
 *
 * An ordered list, because that is what turn order is. `aria-current` says
 * whose turn it is without relying on the colour or the ring, which are
 * otherwise the only cues.
 *
 * The timer is pure social pressure — see SoftTimer.
 */
export default function TurnRail({
  seats,
  turnOrder,
  activeId,
  turnIndex,
  totalTurns,
  label,
  scores,
}: {
  seats: SeatInfo[];
  turnOrder: number[];
  activeId: number | null;
  turnIndex: number;
  totalTurns: number;
  /** Names the list itself, so it is findable without leaning on the heading. */
  label: string;
  /** Running match totals — the standings, alongside the turn order. */
  scores: Record<number, number>;
}) {
  const { t } = useTranslation();
  const seatById = new Map(seats.map((s) => [s.id, s]));
  const activeName = activeId === null ? null : (seatById.get(activeId)?.name ?? `#${activeId}`);

  return (
    <Box>
      <SeatList label={label} ordered>
        {turnOrder.map((id) => {
          const seat = seatById.get(id);
          const active = id === activeId;
          return (
            <SeatRow
              key={id}
              seat={seat}
              lit={active}
              ringed={active}
              current={active}
              trailing={
                // The bare number for the room to read across it, the whole
                // phrase for anything reading it aloud — "Rafa 3" is not a
                // sentence.
                <Box
                  component="span"
                  sx={{
                    flex: "none",
                    fontFamily: font.display,
                    fontWeight: 800,
                    // Inherited from the row, so the score grows with the name
                    // rather than shrinking away from it on a big screen.
                    fontVariantNumeric: "tabular-nums",
                    color: active ? color.flame : dim(color.flame, 70),
                  }}
                >
                  <span aria-hidden>{scores[id] ?? 0}</span>
                  <Box component="span" sx={visuallyHidden}>
                    {t("canvas.points", { count: scores[id] ?? 0 })}
                  </Box>
                </Box>
              }
            />
          );
        })}
      </SeatList>

      <Box
        sx={{
          mt: 2,
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: "0.8rem",
          letterSpacing: "0.04em",
          color: color.muted,
        }}
      >
        {t("canvas.turnCount", { turn: turnIndex + 1, total: totalTurns })}
        {/* Keyed on the turn so it starts over each time, rather than holding a
            flag somebody has to remember to reset. */}
        {activeName && <SoftTimer key={turnIndex} name={activeName} />}
      </Box>
    </Box>
  );
}

/**
 * The soft timer, and what it becomes when it runs out.
 *
 * Nothing enforces it — no auto-play, no forfeit — so when the bar empties it
 * stops being a countdown and becomes what the table would be doing anyway:
 * looking at one person. The nudge pulses because a line that merely appeared
 * would be missed on a screen nobody is holding.
 */
function SoftTimer({ name }: { name: string }) {
  const { t } = useTranslation();
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setOverdue(true), SOFT_TIMER_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, []);

  if (overdue) {
    return (
      <Box
        role="status"
        sx={{
          mt: 0.75,
          color: color.flame,
          fontSize: "0.95rem",
          letterSpacing: 0,
          ...pulse(motion.urging),
        }}
      >
        {t("canvas.finishTurn", { name })}
      </Box>
    );
  }

  return (
    <Box
      aria-hidden
      sx={{ mt: 0.75, height: 3, backgroundColor: color.inkRule, overflow: "hidden" }}
    >
      <Box
        sx={{
          height: "100%",
          backgroundColor: color.flame,
          transformOrigin: "left",
          // `scale`, not `width`: this runs for the whole of every turn on the
          // one screen everybody is watching, and animating width relayouts the
          // page on every frame of it. The transform-origin was already here,
          // left over from someone intending exactly this.
          animation: `drain ${SOFT_TIMER_SECONDS}s linear forwards`,
          "@keyframes drain": { from: { scale: "1 1" }, to: { scale: "0 1" } },
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      />
    </Box>
  );
}
