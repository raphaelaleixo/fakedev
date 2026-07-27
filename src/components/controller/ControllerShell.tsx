import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { SEAT_COLORS } from "../../game/constants";
import type { SeatColor } from "../../game/types";
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
  secretLabel,
  isChameleon,
  seatName,
  seatColor,
  children,
}: {
  /** The Secret's label, or undefined for the Chameleon. */
  secretLabel?: string;
  isChameleon: boolean;
  seatName: string;
  seatColor: SeatColor;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const tint = SEAT_COLORS[seatColor];

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${color.rule}`,
          borderLeft: `6px solid ${tint}`,
          backgroundColor: isChameleon ? color.ink : color.chrome,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: isChameleon ? color.rule : color.muted, display: "block" }}
        >
          {isChameleon ? t("controller.yourRole") : t("controller.theSecret")}
        </Typography>
        <Typography
          sx={{
            fontFamily: isChameleon ? font.mono : font.display,
            fontWeight: isChameleon ? 700 : 600,
            fontSize: isChameleon ? "1.5rem" : "1.6rem",
            letterSpacing: isChameleon ? "0.14em" : "-0.01em",
            color: isChameleon ? "#ffffff" : color.ink,
          }}
        >
          {isChameleon ? t("controller.fakeDev") : secretLabel}
        </Typography>
        <Typography variant="caption" sx={{ color: tint }}>
          {seatName}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, p: 2, maxWidth: 640, width: "100%", mx: "auto" }}>{children}</Box>
    </Box>
  );
}
