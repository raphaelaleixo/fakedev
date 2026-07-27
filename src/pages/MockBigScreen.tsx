import { useState } from "react";
import { Box, Button, ButtonGroup, Slider, Stack, Typography } from "@mui/material";
import { createInitialRoom, joinPlayer, type RoomState } from "react-gameroom";
import Lobby from "../components/Lobby";
import Canvas from "../components/canvas/Canvas";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import { seatColorFor } from "../game/match";
import type { FakeDevPlayerData } from "../game/types";
import { MOCK_EDITS, MOCK_SEATS, mockRound } from "../mocks/fixtures";
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
export default function MockBigScreen() {
  const [view, setView] = useState<"lobby" | "canvas">("canvas");
  const [count, setCount] = useState(3);
  const [turns, setTurns] = useState(MOCK_EDITS.length);

  return (
    <Box>
      {view === "lobby" ? (
        <Lobby roomState={roomWith(count)} onStart={() => setView("canvas")} />
      ) : (
        <Canvas round={mockRound(turns)} seats={MOCK_SEATS} />
      )}

      <Stack
        spacing={1}
        sx={{
          position: "fixed",
          bottom: 12,
          left: 12,
          p: 1.5,
          minWidth: 260,
          backgroundColor: color.paper,
          border: `1px solid ${color.rule}`,
          zIndex: 10,
        }}
      >
        <ButtonGroup size="small" fullWidth>
          <Button
            variant={view === "lobby" ? "contained" : "outlined"}
            onClick={() => setView("lobby")}
          >
            lobby
          </Button>
          <Button
            variant={view === "canvas" ? "contained" : "outlined"}
            onClick={() => setView("canvas")}
          >
            canvas
          </Button>
        </ButtonGroup>

        {view === "lobby" ? (
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
        ) : (
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
