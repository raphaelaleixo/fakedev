import { useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Stack } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { FullscreenToggle, RoomInfoModal, type RoomState } from "react-gameroom";
import type { SeatColor } from "../game/types";
import SeatAvatar from "./canvas/SeatAvatar";
import { color, font } from "../theme/tokens";
import { Wordmark } from "./Wordmark";

/**
 * The masthead, shared by every screen that isn't the cover.
 *
 * Same shape as the other games in this collection: wordmark home-link on the
 * left, a slot on the right carrying the room code and the fullscreen toggle.
 * `RoomInfoModal` and `FullscreenToggle` come from `react-gameroom` — the room
 * code opens the QR and the seat links, which is how a player who dropped
 * finds their way back mid-round.
 */
export default function AppHeader({
  roomState,
  seatName,
  seatColor,
  slot,
}: {
  roomState?: RoomState;
  /** Shown on a controller, so a player can tell which seat this device is. */
  seatName?: string;
  seatColor?: SeatColor;
  /** Extra right-hand content, if a screen needs it. */
  slot?: ReactNode;
}) {
  const { t } = useTranslation();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: { xs: 1.5, md: 3 },
        py: 1,
        backgroundColor: color.ink,
        borderBottom: `1px solid ${color.inkRule}`,
        viewTransitionName: "masthead",
      }}
    >
      {/* The wordmark's own text names this link — see Wordmark. */}
      <Box
        component={RouterLink}
        to="/"
        viewTransition
        sx={{ display: "inline-flex", textDecoration: "none" }}
      >
        <Wordmark />
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {slot}

        {/* The same avatar the big screen draws, so a player can find
            themselves in the contributors list without matching a colour to a
            swatch — it is one picture of a person, used everywhere.

            The avatar alone: the name is beside it on the TV and on the
            player's own device it answers a question nobody is asking. The
            initial and the colour are what identify a seat, and they are both
            in here. */}
        {seatName && (
          <Box sx={{ display: "inline-flex" }}>
            <SeatAvatar seat={{ id: -1, name: seatName, color: seatColor ?? "slate" }} lit size={24} />
            {/* Kept for anything that cannot see a coloured disc. `SeatAvatar`
                is decorative by contract — it is `aria-hidden`, and it says so
                on the grounds that a name always sits beside it. Taking the
                name away visually does not make that untrue, it just moves it
                out of sight. */}
            <Box component="span" sx={visuallyHidden}>
              {seatName}
            </Box>
          </Box>
        )}

        {roomState && (
          <Button
            onClick={() => setShowInfo(true)}
            sx={{
              fontFamily: font.mono,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: color.flame,
              border: `1px solid ${color.inkRule}`,
              px: 1.5,
              py: 0.5,
              minWidth: 0,
              "&:hover": { borderColor: color.flame, backgroundColor: "transparent" },
            }}
          >
            {roomState.roomId}
          </Button>
        )}

        <FullscreenToggle
          className="fullscreen-toggle"
          labels={{ enter: t("header.fullscreen"), exit: t("header.exitFullscreen") }}
        />
      </Stack>

      {roomState && (
        <RoomInfoModal
          roomState={roomState}
          open={showInfo}
          onClose={() => setShowInfo(false)}
          className="room-info-modal"
          labels={{
            close: t("header.close"),
            roomHeading: t("header.roomHeading"),
            joinLink: t("header.joinLink"),
            rejoinLink: t("playerJoin.rejoinLink"),
          }}
        />
      )}
    </Box>
  );
}
