import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useGame } from "../contexts/GameContext";
import Lobby from "../components/Lobby";
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

  // TODO: the canvas — Render Window + Live Inspector, turn rail, vote, resolution.
  return (
    <Centered>
      {t("room.roundPlaceholder", {
        category: matchState?.round?.categoryId ?? "—",
        phase: matchState?.round?.phase ?? "—",
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
