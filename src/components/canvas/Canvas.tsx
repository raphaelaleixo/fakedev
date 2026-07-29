import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { activePlayerId, totalTurns } from "../../game/round";
import type { Round } from "../../game/types";
import { color, font } from "../../theme/tokens";
import type { SeatInfo } from "./LiveInspector";
import BoardPanel from "./BoardPanel";
import RoundLayout from "./RoundLayout";
import TurnRail from "./TurnRail";

/**
 * The big screen during a round.
 *
 * Nothing about the Secret is public — the header only names the *shape* of the
 * answer, `style × component`, so everyone knows what the Chameleon must guess.
 *
 * **The canvas shows code, not the render.** Finishing the component was never
 * the goal — the table is watching who is working toward it — and half the
 * moves under the split (naming a property) change nothing visually at all. A
 * live render would show the least interesting thing on screen while making
 * every other turn look like a no-op. The render is the payoff instead, and it
 * lands at resolution beside the Chameleon and the Secret.
 */
export default function Canvas({
  round,
  seats,
  scores,
}: {
  round: Round;
  seats: SeatInfo[];
  /** Running match totals, so the sidebar reads as a standings board too. */
  scores: Record<number, number>;
}) {
  const { t } = useTranslation();
  const active = activePlayerId(round);
  const activeSeat = seats.find((s) => s.id === active);

  return (
    <RoundLayout
      roundNumber={round.index + 1}
      asideTitle={t("canvas.contributors")}
      aside={
        <>
          <TurnRail
            seats={seats}
            turnOrder={round.turnOrder}
            activeId={active}
            turnIndex={Math.min(round.turnIndex, totalTurns(round) - 1)}
            totalTurns={totalTurns(round)}
            label={t("canvas.contributors")}
            scores={scores}
          />

          {/* A round never actually rests here: committing the last edit flips
              the phase to countdown in the same write, so the big screen goes
              straight to 3… 2… 1. This is the fallback for a client holding
              stale state, and for the mock, which parks a fixture in `turns`
              with every turn played. It states the fact rather than promising
              something is about to happen, because nothing on this screen would
              make that true. */}
          <Typography
            sx={{
              fontFamily: font.display,
              fontWeight: 600,
              fontSize: "0.95rem",
              color: color.paper,
            }}
          >
            {activeSeat ? t("canvas.playerTurn", { name: activeSeat.name }) : t("canvas.turnsDone")}
          </Typography>
        </>
      }
    >
      <BoardPanel edits={round.edits} seats={seats} />
    </RoundLayout>
  );
}
