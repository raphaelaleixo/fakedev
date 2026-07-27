import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SEAT_COLORS, SOFT_TIMER_SECONDS } from "../../game/constants";
import { color, font } from "../../theme/tokens";
import type { SeatInfo } from "./LiveInspector";

/**
 * Turn order with the active player highlighted, plus the soft timer.
 *
 * The timer is pure social pressure: nothing happens when it expires, there is
 * no auto-play and no forfeit. It keeps animating while a disconnected player's
 * turn waits, which is exactly the paper-table experience of everyone staring
 * at the one person who hasn't drawn yet.
 */
export default function TurnRail({
  seats,
  turnOrder,
  activeId,
  turnIndex,
  totalTurns,
}: {
  seats: SeatInfo[];
  turnOrder: number[];
  activeId: number | null;
  turnIndex: number;
  totalTurns: number;
}) {
  const { t } = useTranslation();
  const seatById = new Map(seats.map((s) => [s.id, s]));

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
        {turnOrder.map((id) => {
          const seat = seatById.get(id);
          const tint = seat ? SEAT_COLORS[seat.color] : color.muted;
          const active = id === activeId;
          return (
            <Box
              key={id}
              sx={{
                px: 1.25,
                py: 0.5,
                fontFamily: font.mono,
                fontSize: "0.95rem",
                color: active ? color.ink : color.paper,
                backgroundColor: active ? color.paper : "transparent",
                // Order matters: the shorthand would wipe the seat rule.
                border: `1px solid ${color.inkRule}`,
                borderLeft: `4px solid ${tint}`,
                opacity: active ? 1 : 0.55,
              }}
            >
              {seat?.name ?? `#${id}`}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontFamily: font.mono,
          fontSize: "0.85rem",
          color: color.muted,
        }}
      >
        <Box component="span">{t("canvas.turnCount", { turn: turnIndex + 1, total: totalTurns })}</Box>
        <Box sx={{ flex: 1, height: 3, backgroundColor: color.inkRule, overflow: "hidden" }}>
          <Box
            // Restarting the element on each turn restarts the animation.
            key={turnIndex}
            sx={{
              height: "100%",
              backgroundColor: color.flame,
              transformOrigin: "left",
              animation: `shrink ${SOFT_TIMER_SECONDS}s linear forwards`,
              "@keyframes shrink": { from: { width: "100%" }, to: { width: "0%" } },
              "@media (prefers-reduced-motion: reduce)": { animation: "none", width: "100%" },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
