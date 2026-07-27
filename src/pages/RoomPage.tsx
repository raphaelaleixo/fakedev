import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useGame } from "../contexts/GameContext";
import Lobby from "../components/Lobby";
import Canvas from "../components/canvas/Canvas";
import type { SeatInfo } from "../components/canvas/LiveInspector";
import { seatColorFor } from "../game/match";
import { color } from "../theme/tokens";

/** The big screen. Lobby until the match starts, then the canvas. */
export default function RoomPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { roomState, matchState, loading, notFound, loadRoom, startTheMatch } = useGame();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (id) loadRoom(id);
  }, [id, loadRoom]);

  if (notFound) return <Centered>{t("room.notFound", { code: id })}</Centered>;
  if (loading || !roomState) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  if (roomState.status === "lobby") {
    return (
      <Lobby
        roomState={roomState}
        starting={starting}
        onStart={async () => {
          setStarting(true);
          try {
            await startTheMatch();
          } finally {
            setStarting(false);
          }
        }}
      />
    );
  }

  const round = matchState?.round;
  if (!round) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  const seats: SeatInfo[] = roomState.players
    .filter((p) => p.status === "ready")
    .map((p) => ({
      id: p.id,
      name: p.name ?? `#${p.id}`,
      color: p.data?.color ?? seatColorFor(p.id),
    }));

  if (round.phase === "turns") return <Canvas round={round} seats={seats} />;

  // TODO: countdown, vote reveal, steal and resolution screens.
  return (
    <Centered>
      {t("room.roundPlaceholder", {
        category: round.categoryId,
        phase: round.phase,
      })}
    </Centered>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
      }}
    >
      <Typography sx={{ color: color.muted }}>{children}</Typography>
    </Box>
  );
}
