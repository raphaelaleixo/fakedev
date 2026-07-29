import { useEffect, useState } from "react";
import { Box, Button, ButtonGroup, Slider, Stack, Typography } from "@mui/material";
import { createInitialRoom, joinPlayer, type RoomState } from "react-gameroom";
import AppHeader from "../components/AppHeader";
import Lobby from "../components/Lobby";
import Canvas from "../components/canvas/Canvas";
import ResolutionScreen from "../components/canvas/ResolutionScreen";
import {
  CountdownOverlay,
} from "../components/canvas/VoteScreens";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import { seatColorFor } from "../game/match";
import type { FakeDevPlayerData, RoundPhase } from "../game/types";
import {
  MOCK_EDITS,
  MOCK_SEATS,
  MOCK_VOTES,
  mockRound,
  mockRoundAt,
  type MockVerdict,
} from "../mocks/fixtures";
import { roundStage, stageTransition } from "../game/round";
import { useViewTransition } from "../hooks/useViewTransition";
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
  // The same question the real screen asks, from the same function. Answering
  // it here instead is how the mock ended up animating things the game never
  // did.
  const stage = useViewTransition(
    roundStage(view === "lobby" ? "lobby" : "playing", view === "lobby" ? undefined : view),
    stageTransition,
  );
  const [count, setCount] = useState(3);
  const [turns, setTurns] = useState(MOCK_EDITS.length);
  const [steal, setSteal] = useState(0);
  const [lockedIn, setLockedIn] = useState(MOCK_SEATS.length);
  const [verdict, setVerdict] = useState<MockVerdict>("caught");
  const [slow, setSlow] = useState(false);

  // Scales every duration in the choreography at once, so the *order* of the
  // movements can be watched rather than guessed at.
  useEffect(() => {
    document.documentElement.classList.toggle("vt-slow", slow);
    return () => document.documentElement.classList.remove("vt-slow");
  }, [slow]);

  // Cycles the three steal outcomes: both, one, neither.
  const guess = [
    { styleId: "material", componentId: "primary-button" },
    { styleId: "material", componentId: "avatar" },
    { styleId: "wireframe", componentId: "avatar" },
  ][steal];

  function screen() {
    if (stage === "lobby") {
      return <Lobby roomState={roomWith(count)} onStart={() => setView("turns")} />;
    }
    switch (view === "lobby" ? "turns" : view) {
      case "turns":
        return <Canvas round={mockRound(turns)} seats={MOCK_SEATS} scores={SCORES} />;
      case "countdown":
        return (
          <>
            <Canvas round={mockRound(turns)} seats={MOCK_SEATS} scores={SCORES} />
            <CountdownOverlay onDone={() => setView("voting")} />
          </>
        );
      case "voting":
      case "reveal":
      case "steal":
      case "result": {
        const phase = view === "lobby" || view === "turns" || view === "countdown" ? "voting" : view;
        return (
          <ResolutionScreen
            round={{
              ...mockRoundAt(phase, phase === "result" ? guess : undefined, verdict),
              // The fixture has everybody voted, which is the one state the
              // vote is never in while it matters.
              ...(view === "voting"
                ? { votes: Object.fromEntries(Object.entries(MOCK_VOTES).slice(0, lockedIn)) }
                : {}),
            }}
            phase={phase}
            seats={MOCK_SEATS}
            scores={SCORES}
            finished={false}
            onRevealDone={() => setView("steal")}
            onNext={() => setView("turns")}
          />
        );
      }
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: color.ink,
        // Matches PageShell: the countdown covers the view without replacing it.
        position: "relative",
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
        <Button
          size="small"
          variant={slow ? "contained" : "outlined"}
          onClick={() => setSlow((on) => !on)}
        >
          slow motion: {slow ? "on" : "off"}
        </Button>

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

        {(view === "reveal" || view === "steal" || view === "result") && (
          <ButtonGroup size="small" fullWidth>
            {(["caught", "escaped", "tied"] as const).map((v) => (
              <Button
                key={v}
                variant={v === verdict ? "contained" : "outlined"}
                onClick={() => setVerdict(v)}
              >
                {v}
              </Button>
            ))}
          </ButtonGroup>
        )}

        {view === "result" && (
          <Button size="small" variant="outlined" onClick={() => setSteal((s) => (s + 1) % 3)}>
            steal: {["both", "one", "neither"][steal]}
          </Button>
        )}

        {view === "voting" && (
          <ButtonGroup size="small" fullWidth>
            {MOCK_SEATS.map((_, n) => (
              <Button
                key={n}
                variant={n === lockedIn ? "contained" : "outlined"}
                onClick={() => setLockedIn(n)}
              >
                {n}
              </Button>
            ))}
            <Button
              variant={lockedIn === MOCK_SEATS.length ? "contained" : "outlined"}
              onClick={() => setLockedIn(MOCK_SEATS.length)}
            >
              {MOCK_SEATS.length}
            </Button>
          </ButtonGroup>
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
