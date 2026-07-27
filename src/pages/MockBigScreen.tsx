import { useState } from "react";
import { Box, Button, ButtonGroup, Slider, Stack, Typography } from "@mui/material";
import { createInitialRoom, joinPlayer, type RoomState } from "react-gameroom";
import AppHeader from "../components/AppHeader";
import Lobby from "../components/Lobby";
import Canvas from "../components/canvas/Canvas";
import {
  CountdownScreen,
  ResultScreen,
  RevealScreen,
  StealScreen,
  VotingScreen,
} from "../components/canvas/VoteScreens";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import { seatColorFor } from "../game/match";
import type { FakeDevPlayerData, RoundPhase } from "../game/types";
import { MOCK_EDITS, MOCK_SEATS, mockRound, mockRoundAt } from "../mocks/fixtures";
import { color } from "../theme/tokens";

const NAMES = ["Rafa", "Ana", "Tom", "Ines", "Joost", "Mira", "Dev", "Sanne", "Kai", "Noor"];

function roomWith(count: number): RoomState<FakeDevPlayerData> {
  let room = createInitialRoom<FakeDevPlayerData>({
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    requireFull: false,
  });
  for (let seat = 1; seat <= count; seat++) {
    room = joinPlayer(room, seat, NAMES[seat - 1], { color: seatColorFor(seat) });
  }
  return { ...room, roomId: "7KQP2" };
}

/**
 * DEV-only. Drives the big screen off fixture data so layout can be built
 * without a live room and a second device. The turn scrubber is the fastest way
 * to see the render and the inspector accumulate.
 */
const PHASES: (RoundPhase | "lobby")[] = [
  "lobby",
  "turns",
  "countdown",
  "voting",
  "reveal",
  "steal",
  "result",
];

const SCORES = { 1: 3, 2: 1, 4: 2, 5: 1 };

export default function MockBigScreen() {
  const [view, setView] = useState<RoundPhase | "lobby">("turns");
  const [count, setCount] = useState(3);
  const [turns, setTurns] = useState(MOCK_EDITS.length);
  const [steal, setSteal] = useState(0);

  // Cycles the three steal outcomes: both, one, neither.
  const guess = [
    { styleId: "flat-design", componentId: "progress-bar" },
    { styleId: "flat-design", componentId: "avatar" },
    { styleId: "wireframe", componentId: "avatar" },
  ][steal];

  function screen() {
    switch (view) {
      case "lobby":
        return <Lobby roomState={roomWith(count)} onStart={() => setView("turns")} />;
      case "turns":
        return <Canvas round={mockRound(turns)} seats={MOCK_SEATS} />;
      case "countdown":
        return <CountdownScreen onDone={() => setView("voting")} />;
      case "voting":
        return <VotingScreen round={mockRoundAt("voting")} seats={MOCK_SEATS} />;
      case "reveal":
        return (
          <RevealScreen
            round={mockRoundAt("reveal")}
            seats={MOCK_SEATS}
            onDone={() => setView("steal")}
          />
        );
      case "steal":
        return <StealScreen round={mockRoundAt("steal")} seats={MOCK_SEATS} />;
      case "result":
        return (
          <ResultScreen
            round={mockRoundAt("result", guess)}
            seats={MOCK_SEATS}
            scores={SCORES}
            finished={false}
            onNext={() => setView("turns")}
          />
        );
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: color.ink,
      }}
    >
      <AppHeader roomState={roomWith(count)} />
      {screen()}

      <Stack
        spacing={1}
        sx={{
          position: "fixed",
          bottom: 12,
          left: 12,
          p: 1.5,
          minWidth: 260,
          backgroundColor: color.inkPanel,
          border: `1px solid ${color.inkRule}`,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {PHASES.map((phase) => (
            <Button
              key={phase}
              size="small"
              variant={view === phase ? "contained" : "outlined"}
              onClick={() => setView(phase)}
            >
              {phase}
            </Button>
          ))}
        </Box>

        {view === "result" && (
          <Button size="small" variant="outlined" onClick={() => setSteal((s) => (s + 1) % 3)}>
            steal: {["both", "one", "neither"][steal]}
          </Button>
        )}

        {view === "lobby" && (
          <ButtonGroup size="small" fullWidth>
            {[0, 1, 3, 4, 7, 10].map((n) => (
              <Button
                key={n}
                variant={n === count ? "contained" : "outlined"}
                onClick={() => setCount(n)}
              >
                {n}
              </Button>
            ))}
          </ButtonGroup>
        )}

        {view === "turns" && (
          <Box>
            <Typography variant="caption" sx={{ color: color.muted }}>
              turns played: {turns}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={MOCK_EDITS.length}
              value={turns}
              onChange={(_, v) => setTurns(v as number)}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
