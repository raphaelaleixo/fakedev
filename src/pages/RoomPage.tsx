import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Typography } from "@mui/material";
import type { RoomState } from "react-gameroom";
import { useGame } from "../contexts/GameContext";
import { useViewTransition } from "../hooks/useViewTransition";
import Lobby from "../components/Lobby";
import Canvas from "../components/canvas/Canvas";
import type { SeatInfo } from "../components/canvas/LiveInspector";
import type { FakeDevPlayerData } from "../game/types";
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

  /**
   * The round starting is not a navigation — same URL, same page, a status
   * arriving from Firebase — so React Router's `viewTransition` cannot see it.
   * Holding the phase one commit behind the real one lets the browser own the
   * swap. See useViewTransition.
   */
  const phase = useViewTransition(
    roomState?.status === "lobby" ? "lobby" : "playing",
    "round-start",
  );

  useEffect(() => {
    if (id) loadRoom(id);
  }, [id, loadRoom]);

  /**
   * One `Shell`, always, with only its contents swapping.
   *
   * This used to return `<Centered>` while loading and `<Shell>` once loaded.
   * Those are different component types in the same position, so React tore the
   * whole subtree down and built a new one the moment the room arrived —
   * including the masthead. That is invisible in normal use and fatal to a view
   * transition: the browser skips the whole thing when an element it captured
   * is removed, so arriving here killed the animation a few hundred
   * milliseconds in, while every other route was fine.
   */
  const seats = (room: RoomState<FakeDevPlayerData>): SeatInfo[] =>
    room.players
      .filter((p) => p.status === "ready")
      .map((p) => ({
        id: p.id,
        name: p.name ?? `#${p.id}`,
        color: p.data?.color ?? seatColorFor(p.id),
      }));

  // The big screen drives every phase transition. The domain helpers throw when
  // the round isn't in the expected phase, so a second screen open on the same
  // room is harmless rather than a double advance.
  const body = () => {
    if (notFound) return <Centered>{t("room.notFound", { code: id })}</Centered>;
    if (loading || !roomState) {
      return (
        <Centered>
          <CircularProgress />
        </Centered>
      );
    }

    if (phase === "lobby" && roomState.status === "lobby") {
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

    switch (round.phase) {
      case "turns":
        return <Canvas round={round} seats={seats(roomState)} />;
      case "countdown":
        return <CountdownScreen onDone={() => id && openVoting(id)} />;
      case "voting":
        return <VotingScreen round={round} seats={seats(roomState)} />;
      case "reveal":
        return (
          <RevealScreen
            round={round}
            seats={seats(roomState)}
            onDone={() => id && closeVoting(id)}
          />
        );
      case "steal":
        return <StealScreen round={round} seats={seats(roomState)} />;
      case "result":
        return (
          <ResultScreen
            round={round}
            seats={seats(roomState)}
            scores={matchState?.scores ?? {}}
            finished={matchState?.status === "finished"}
            winnerIds={matchState?.winnerIds}
            onNext={() => id && nextRound(id)}
          />
        );
    }
  };

  return <Shell roomState={roomState ?? undefined}>{body()}</Shell>;
}

/**
 * Masthead plus whatever the phase is showing, filling the viewport. It must
 * stay mounted across every phase change — see the note above `body`.
 */
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
      <Box component="main" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
}

/** Just the centring; the shell is supplied by the caller, once. */
function Centered({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}
    >
      <Typography sx={{ color: color.muted }}>{children}</Typography>
    </Box>
  );
}
