import { useState, type ReactNode } from "react";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { useTranslation } from "react-i18next";
import type { RoomState } from "react-gameroom";
import type { SeatColor } from "../../game/types";
import { COMPONENTS, STYLES } from "../../game/content/deck";
import AppHeader from "../AppHeader";
import { color, font } from "../../theme/tokens";

/**
 * The controller's persistent frame.
 *
 * The Secret appears here and nowhere else in the game — not on the TV, not on
 * another player's controller. The Chameleon's reads FAKE DEV instead.
 *
 * It sits along the bottom, where a thumb is. This is a phone held for a whole
 * round, and the one thing on it that is worth re-reading between turns should
 * not be at the far end of the reach — nor at the top of the screen where a
 * neighbour glancing over sees it first. Everything above it is the turn.
 *
 * Below that, the controller is a pure controller: no render mirror and no
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

      {/* No panel around the controls. A bordered card inside a page whose
          only content is that card is a box drawn around the whole screen —
          the controls sit on the field, and the header and the role bar are
          the two edges that frame them. */}
      <Box
        component="main"
        sx={{ flex: 1, p: { xs: 2, sm: 3 }, width: "100%", maxWidth: 680, mx: "auto" }}
      >
        {children}
      </Box>

      <RoleBar isChameleon={isChameleon} secret={secret} t={t} />
    </Box>
  );
}

/**
 * What this player is playing, along the bottom.
 *
 * Sticky, so it survives a composer long enough to scroll. The decks open
 * *upwards* out of it, which is why this is a button and a `Collapse` rather
 * than an accordion: an accordion pushes its contents down, and down from here
 * is off the screen.
 */
function RoleBar({
  isChameleon,
  secret,
  t,
}: {
  isChameleon: boolean;
  secret?: { style: string; component: string };
  t: (key: string) => string;
}) {
  const [openDecks, setOpenDecks] = useState(false);

  return (
    <Box
      component="footer"
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: 2,
        borderTop: `1px solid ${color.inkRule}`,
        backgroundColor: color.ink,
      }}
    >
      {isChameleon && (
        <Collapse in={openDecks}>
          <Decks t={t} />
        </Collapse>
      )}

      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: color.muted, display: "block" }}>
            {isChameleon ? t("controller.yourRole") : t("controller.theSecret")}
          </Typography>

          {isChameleon ? (
            <Typography
              sx={{
                fontFamily: font.display,
                fontWeight: 800,
                fontSize: "1.5rem",
                letterSpacing: "0.02em",
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

        {/* A question, which is what the Chameleon has. The label it used to
            carry is still its accessible name — a bare icon says nothing to a
            screen reader, and "?" is exactly the case where the picture and
            the name have to be supplied separately. */}
        {isChameleon && (
          <IconButton
            onClick={() => setOpenDecks((open) => !open)}
            aria-expanded={openDecks}
            aria-label={t("controller.decksHint")}
            sx={{
              flex: "none",
              color: openDecks ? color.ink : color.paper,
              backgroundColor: openDecks ? color.flame : "transparent",
              border: `1px solid ${openDecks ? color.flame : color.inkRule}`,
              "&:hover": { borderColor: color.flame, backgroundColor: openDecks ? color.flame : "transparent" },
            }}
          >
            <QuestionMarkIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        )}
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
 * Shut by default. Twenty-seven items is a lot to have open while it is your
 * turn, and the point is to consult it, not to read it.
 */
function Decks({ t }: { t: (key: string) => string }) {
  const list = (cards: { id: string; labelKey: string }[]) =>
    cards.map((card) => t(card.labelKey)).join(" · ");

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        maxHeight: "40dvh",
        overflowY: "auto",
        borderBottom: `1px solid ${color.inkRule}`,
        backgroundColor: color.inkPanel,
        fontFamily: font.display,
        fontSize: "0.85rem",
        lineHeight: 1.5,
      }}
    >
      <Typography variant="caption" sx={{ color: color.flame, display: "block" }}>
        {t("controller.styleLabel")}
      </Typography>
      <Box sx={{ color: color.paper, mb: 1.5 }}>{list(STYLES)}</Box>
      <Typography variant="caption" sx={{ color: color.flame, display: "block" }}>
        {t("controller.componentLabel")}
      </Typography>
      <Box sx={{ color: color.paper }}>{list(COMPONENTS)}</Box>
    </Box>
  );
}
