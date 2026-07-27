import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { foldEdits } from "../../game/fold";
import { activePlayerId, totalTurns } from "../../game/round";
import type { Round } from "../../game/types";
import { color, font } from "../../theme/tokens";
import LiveInspector, { type SeatInfo } from "./LiveInspector";
import RenderWindow from "./RenderWindow";
import TurnRail from "./TurnRail";

/**
 * The big screen during a round.
 *
 * The Category is always up; the Secret never is, until resolution. The split
 * canvas is the heart of the screen — the Render Window is what the component
 * looks like, the Live Inspector is how it got that way.
 */
export default function Canvas({ round, seats }: { round: Round; seats: SeatInfo[] }) {
  const { t } = useTranslation();
  const tree = foldEdits(round.edits);
  const active = activePlayerId(round);
  const activeSeat = seats.find((s) => s.id === active);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 2,
        p: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: color.muted, display: "block" }}>
            {t("canvas.categoryLabel")}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: "clamp(1.5rem, 3.2vw, 2.75rem)" }}>
            {t(`deck.category.${round.categoryId}`)}
          </Typography>
        </Box>

        <Box sx={{ flex: "1 1 340px", maxWidth: 620 }}>
          <Typography
            sx={{
              fontFamily: font.mono,
              fontSize: "1rem",
              color: color.ink,
              mb: 0.5,
            }}
          >
            {activeSeat
              ? t("canvas.playerTurn", { name: activeSeat.name })
              : t("canvas.turnsDone")}
          </Typography>
          <TurnRail
            seats={seats}
            turnOrder={round.turnOrder}
            activeId={active}
            turnIndex={Math.min(round.turnIndex, totalTurns(round) - 1)}
            totalTurns={totalTurns(round)}
          />
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.35fr 1fr" },
          gap: 2,
        }}
      >
        <RenderWindow tree={tree} title={t("canvas.renderWindow")} />
        <LiveInspector edits={round.edits} tree={tree} seats={seats} />
      </Box>
    </Box>
  );
}
