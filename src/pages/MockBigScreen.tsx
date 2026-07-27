import { useState } from "react";
import { Box, Button, ButtonGroup } from "@mui/material";
import { createInitialRoom, joinPlayer, type RoomState } from "react-gameroom";
import Lobby from "../components/Lobby";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import { seatColorFor } from "../game/match";
import type { FakeDevPlayerData } from "../game/types";
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
 * without a live room and a second device.
 */
export default function MockBigScreen() {
  const [count, setCount] = useState(3);

  return (
    <Box>
      <Lobby roomState={roomWith(count)} onStart={() => undefined} />
      <ButtonGroup
        size="small"
        sx={{
          position: "fixed",
          bottom: 12,
          left: 12,
          backgroundColor: color.paper,
          zIndex: 10,
        }}
      >
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
    </Box>
  );
}
