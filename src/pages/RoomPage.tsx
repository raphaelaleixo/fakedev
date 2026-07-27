import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Typography } from "@mui/material";
import type { RoomState } from "react-gameroom";
import { useGame } from "../contexts/GameContext";
import Lobby from "../components/Lobby";
import Canvas from "../components/canvas/Canvas";
import type { SeatInfo } from "../components/canvas/LiveInspector";
import {
  CountdownScreen,
  ResultScreen,
  RevealScreen,
  StealScreen,
  VotingScreen,
} from "../components/canvas/VoteScreens";
import AppHeader from "../components/AppHeader";
import { seatColorFor } from "../game/match";
import { color } from "../theme/tokens";

/** The big screen. Lobby until the match starts, then the canvas. */
export default function RoomPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const {
    roomState,
    matchState,
    loading,
    notFound,
    loadRoom,
    startTheMatch,
    openVoting,
    closeVoting,
    nextRound,
  } = useGame();
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
      <Shell roomState={roomState}>
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
      </Shell>
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

  // The big screen drives every phase transition. The domain helpers throw when
  // the round isn't in the expected phase, so a second screen open on the same
  // room is harmless rather than a double advance.
  const screen = () => {
    switch (round.phase) {
      case "turns":
        return <Canvas round={round} seats={seats} />;
      case "countdown":
        return <CountdownScreen onDone={() => id && openVoting(id)} />;
      case "voting":
        return <VotingScreen round={round} seats={seats} />;
      case "reveal":
        return <RevealScreen round={round} seats={seats} onDone={() => id && closeVoting(id)} />;
      case "steal":
        return <StealScreen round={round} seats={seats} />;
      case "result":
        return (
          <ResultScreen
            round={round}
            seats={seats}
            scores={matchState.scores ?? {}}
            finished={matchState.status === "finished"}
            winnerIds={matchState.winnerIds}
            onNext={() => id && nextRound(id)}
          />
        );
    }
  };

  return <Shell roomState={roomState}>{screen()}</Shell>;
}

/** Masthead plus whatever the phase is showing, filling the viewport. */
function Shell({
  roomState,
  children,
}: {
  roomState?: RoomState;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: color.ink,
      }}
    >
      <AppHeader roomState={roomState} />
      {children}
    </Box>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Typography sx={{ color: color.muted }}>{children}</Typography>
      </Box>
    </Shell>
  );
}
