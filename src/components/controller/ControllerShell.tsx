import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { SEAT_COLORS } from "../../game/constants";
import type { SeatColor } from "../../game/types";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import type { RoomState } from "react-gameroom";
import { COMPONENTS, STYLES } from "../../game/content/deck";
import AppHeader from "../AppHeader";
import { color, font } from "../../theme/tokens";

/**
 * The controller's persistent frame.
 *
 * The header is the only surface in the entire game where the Secret appears —
 * not the TV, not another player's controller. The Chameleon's reads FAKE DEV.
 *
 * Below it, the controller is a pure controller: no render mirror and no
 * inspector, deliberately. Heads stay up and the TV stays the social centre.
 */
export default function ControllerShell({
  secret,
  isChameleon,
  seatName,
  seatColor,
  roomState,
  children,
}: {
  /** Both halves of the Secret, or undefined for the Chameleon. */
  secret?: { style: string; component: string };
  isChameleon: boolean;
  seatName: string;
  seatColor: SeatColor;
  roomState?: RoomState;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const tint = SEAT_COLORS[seatColor];

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: color.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppHeader roomState={roomState} seatName={seatName} seatColor={seatColor} />

      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${color.inkRule}`,
          borderLeft: `6px solid ${tint}`,
          backgroundColor: color.ink,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: color.muted, display: "block" }}
        >
          {isChameleon ? t("controller.yourRole") : t("controller.theSecret")}
        </Typography>
        {isChameleon ? (
          <Typography
            sx={{
              fontFamily: font.mono,
              fontWeight: 700,
              fontSize: "1.5rem",
              letterSpacing: "0.14em",
              color: color.flame,
            }}
          >
            {t("controller.fakeDev")}
          </Typography>
        ) : (
          // Two halves, and the style leads — it's the half a Dev can signal
          // fastest, and the half the Chameleon can most easily read back.
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 1 }}>
            <Typography
              sx={{
                fontFamily: font.display,
                fontWeight: 600,
                fontSize: "1.5rem",
                color: color.flame,
              }}
            >
              {secret?.style}
            </Typography>
            <Typography
              sx={{
                fontFamily: font.display,
                fontWeight: 600,
                fontSize: "1.5rem",
                color: color.paper,
              }}
            >
              {secret?.component}
            </Typography>
          </Box>
        )}
      </Box>

      {isChameleon && <ChameleonDecks />}

      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, width: "100%", maxWidth: 680, mx: "auto" }}>
        <Box
          sx={{
            backgroundColor: color.inkPanel,
            border: `1px solid ${color.inkRule}`,
            p: { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Both decks, on the Chameleon's controller only.
 *
 * This leaks nothing — the decks are public knowledge in any game you've played
 * twice. What it buys is a *strategy*: pick a hypothesis privately, play toward
 * it consistently, and if you happened to guess the style right then half your
 * moves are genuinely correct. The paper game's fake can only improvise; ours
 * gets to have a theory.
 *
 * Collapsed by default. Thirty items is a lot to have open while it's your turn.
 */
function ChameleonDecks() {
  const { t } = useTranslation();
  const list = (cards: { id: string; labelKey: string }[]) =>
    cards.map((card) => t(card.labelKey)).join(" · ");

  return (
    <Accordion
      disableGutters
      sx={{
        backgroundColor: color.inkPanel,
        borderBottom: `1px solid ${color.inkRule}`,
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary sx={{ minHeight: 0 }}>
        <Typography variant="caption" sx={{ color: color.muted }}>
          {t("controller.decksHint")}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ fontFamily: font.mono, fontSize: "0.8rem" }}>
        <Typography variant="caption" sx={{ color: color.flame, display: "block" }}>
          {t("controller.styleLabel")}
        </Typography>
        <Box sx={{ color: color.paper, mb: 1.5 }}>{list(STYLES)}</Box>
        <Typography variant="caption" sx={{ color: color.flame, display: "block" }}>
          {t("controller.componentLabel")}
        </Typography>
        <Box sx={{ color: color.paper }}>{list(COMPONENTS)}</Box>
      </AccordionDetails>
    </Accordion>
  );
}
