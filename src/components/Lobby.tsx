import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Stack, Typography } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { RoomQRCode, buildJoinUrl, useRoomState, type RoomState } from "react-gameroom";
import { MIN_PLAYERS, SEAT_COLORS } from "../game/constants";
import { seatColorFor } from "../game/match";
import type { FakeDevPlayerData } from "../game/types";
import { color, font, pulse } from "../theme/tokens";
import { Comment, MarkupLine, Pair, Punct, Swatch, Tag } from "./MarkupLine";

/**
 * The big-screen lobby.
 *
 * The room is rendered as the thing the game is actually about: a DOM node with
 * children. Players *are* nodes, seats *are* attributes, and the seat color is
 * previewed inline exactly as DevTools previews a color value. It teaches the
 * game's vocabulary before a single turn is played, and it's the one place the
 * design spends its boldness — everything around it stays quiet.
 */
export default function Lobby({
  roomState,
  onStart,
  starting,
}: {
  roomState: RoomState<FakeDevPlayerData>;
  onStart: () => void;
  starting?: boolean;
}) {
  const { t } = useTranslation();
  const { activePlayers, playerCount, canStart } = useRoomState(roomState);
  const newest = useNewestArrival(activePlayers.map((p) => p.id));

  const missing = Math.max(0, MIN_PLAYERS - playerCount);
  const ready = canStart && !starting;

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: color.ink,
        color: color.paper,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "auto 1fr" },
        alignItems: "start",
        gap: { xs: 4, md: 8 },
        p: { xs: 3, md: 6 },
      }}
    >
      {/* The masthead already carries the game's name; printing it again here
          said it twice on one screen. The heading stays because the view still
          needs naming — it is what RouteFocus lands on and what a screen reader
          announces on arrival — but it is not shown. It is out of flow, so it
          takes no grid cell, and it sits first so the reading order still opens
          with the heading after the columns were swapped. */}
      <Typography variant="h1" sx={visuallyHidden}>
        {t("lobby.heading", { code: roomState.roomId })}
      </Typography>

      <Stack spacing={2}>
        <Box
          sx={{
            p: 2,
            border: `4px solid ${color.paper}`,
            backgroundColor: color.paper,
            lineHeight: 0,
          }}
        >
          <RoomQRCode roomId={roomState.roomId} url={buildJoinUrl(roomState.roomId)} size={220} />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: color.muted, display: "block" }}>
            {t("lobby.joinAt")}
          </Typography>
          <Typography
            sx={{
              fontFamily: font.mono,
              fontSize: "2.5rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              // On the ink field flame is a text colour again.
              color: color.flame,
            }}
          >
            {roomState.roomId}
          </Typography>
        </Box>

        {/* `disabled` would drop this out of the tab order, so a keyboard
            user could never land on it to find out what they are waiting for.
            `aria-disabled` says the same thing and leaves it reachable; the
            label carries the reason, so no extra description is needed. */}
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            if (!ready) return;
            onStart();
          }}
          aria-disabled={!ready}
          sx={{
            '&[aria-disabled="true"]': {
              backgroundColor: "transparent",
              color: color.muted,
              borderColor: color.inkPunct,
              cursor: "not-allowed",
            },
          }}
        >
          {canStart ? t("lobby.start") : t("lobby.waiting", { count: missing })}
        </Button>
      </Stack>
      <Box sx={{ minWidth: 0 }}>
        <Box component="section" aria-label={t("lobby.treeLabel")}>
          <MarkupLine>
            <Punct>&lt;</Punct>
            <Tag>room</Tag>
            <Pair name="code">{roomState.roomId}</Pair>
            <Pair name="players">{String(playerCount)}</Pair>
            <Punct>&gt;</Punct>
          </MarkupLine>

          {activePlayers.map((slot) => (
            <MarkupLine key={slot.id} indent={1} highlight={slot.id === newest}>
              <Punct>&lt;</Punct>
              <Tag>dev</Tag>
              <Pair name="seat">{String(slot.id)}</Pair>
              <Pair name="name">{slot.name ?? ""}</Pair>
              <Pair name="color">
                <Swatch value={SEAT_COLORS[slot.data?.color ?? seatColorFor(slot.id)]} />
                {slot.data?.color ?? seatColorFor(slot.id)}
              </Pair>
              <Punct> /&gt;</Punct>
            </MarkupLine>
          ))}

          {missing > 0 && (
            <MarkupLine indent={1}>
              {/* The only thing on this screen that is waiting for something,
                  so it is the only thing that moves. Opacity rather than
                  colour because this is motion, not a palette decision, and
                  it is the one property a compositor animates for free. */}
              <Box
                component="span"
                sx={pulse()}
              >
                <Comment>{t("lobby.needMore", { count: missing })}</Comment>
              </Box>
            </MarkupLine>
          )}

          <MarkupLine>
            <Punct>&lt;/</Punct>
            <Tag>room</Tag>
            <Punct>&gt;</Punct>
          </MarkupLine>
        </Box>
      </Box>

    </Box>
  );
}

/**
 * The most recently arrived seat, so their line can flash the way DevTools
 * flashes a node that just entered the DOM. Clears itself so the wash is a
 * moment, not a state.
 */
function useNewestArrival(ids: number[]): number | null {
  const seen = useRef<Set<number> | null>(null);
  const [newest, setNewest] = useState<number | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    const current = new Set(ids);
    if (seen.current === null) {
      // First render of an existing room shouldn't flash everyone.
      seen.current = current;
      return;
    }
    const arrived = ids.find((id) => !seen.current!.has(id));
    seen.current = current;
    if (arrived === undefined) return;

    setNewest(arrived);
    const timer = setTimeout(() => setNewest(null), 1200);
    return () => clearTimeout(timer);
    // `key` is the stable projection of `ids`; depending on the array identity
    // would re-run on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return newest;
}
