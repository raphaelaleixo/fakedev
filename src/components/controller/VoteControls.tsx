import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SEAT_COLORS } from "../../game/constants";
import { getComponent, getStyle } from "../../game/content/deck";
import { foldEdits } from "../../game/fold";
import RenderWindow from "../canvas/RenderWindow";
import type { Card, Edit, StealGuess } from "../../game/types";
import { color, font } from "../../theme/tokens";
import type { SeatInfo } from "../canvas/LiveInspector";

/**
 * Pick a player, confirm, locked. Everyone votes, the Chameleon included —
 * they point to blend in, exactly as the fake artist does on paper.
 */
export function VotePicker({
  seats,
  voterId,
  locked,
  onVote,
  busy,
}: {
  seats: SeatInfo[];
  voterId: number;
  /** Whom this player already voted for, if they have. */
  locked?: number;
  onVote: (suspectId: number) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number | null>(null);

  if (locked !== undefined) {
    const name = seats.find((s) => s.id === locked)?.name ?? `#${locked}`;
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography sx={{ color: color.muted }}>{t("vote.youPicked")}</Typography>
        <Typography variant="h3" sx={{ my: 1 }}>
          {name}
        </Typography>
        <Typography sx={{ color: color.muted }}>{t("vote.lockedIn")}</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4">{t("vote.heading")}</Typography>
      <Stack spacing={1}>
        {seats
          // You cannot point at yourself.
          .filter((seat) => seat.id !== voterId)
          .map((seat) => (
            <Button
              key={seat.id}
              onClick={() => setPicked(seat.id)}
              variant={picked === seat.id ? "contained" : "outlined"}
              size="large"
              sx={{
                justifyContent: "flex-start",
                fontFamily: font.mono,
                fontSize: "1.1rem",
                // Seat color is the rule down the side; the name stays ink.
                borderColor: color.inkRule,
                borderLeft: `6px solid ${SEAT_COLORS[seat.color]}`,
                ...(picked === seat.id
                  ? { backgroundColor: color.flame, color: color.onFlame }
                  : { color: color.paper }),
              }}
            >
              {seat.name}
            </Button>
          ))}
      </Stack>
      <Button
        variant="contained"
        size="large"
        disabled={picked === null || busy}
        onClick={() => picked !== null && onVote(picked)}
      >
        {t("vote.confirm")}
      </Button>
    </Stack>
  );
}

/**
 * The caught Chameleon's guess: one answer per axis, from five of each.
 *
 * Splitting it is what keeps catching them worth doing. With both halves hidden
 * a single all-or-nothing guess would be 4% blind, so being caught would cost
 * the Chameleon almost nothing to recover from. Per-axis, each half is a real
 * 20% gamble and a good read on one is worth a point.
 *
 * **This is the one place a controller shows the render**, which `rules.md`
 * otherwise forbids. The exception keeps the steal as fair as the paper game's,
 * where the fake guesses while looking at the finished drawing. The Devs still
 * don't see it — the TV holds the render for resolution.
 */
export function StealPicker({
  slate,
  edits,
  onSteal,
  busy,
}: {
  slate: { styles: string[]; components: string[] };
  /** The round's log, so the Chameleon can see what the table built. */
  edits: Edit[];
  onSteal: (guess: StealGuess) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [styleId, setStyleId] = useState<string | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);

  return (
    <Stack spacing={2}>
      <Box sx={{ height: 240 }}>
        <RenderWindow tree={foldEdits(edits)} title={t("canvas.renderWindow")} />
      </Box>
      <Typography sx={{ color: color.muted }}>{t("steal.oneShot")}</Typography>

      <Slate
        heading={t("steal.headingStyle")}
        ids={slate.styles}
        resolve={getStyle}
        picked={styleId}
        onPick={setStyleId}
      />
      <Slate
        heading={t("steal.headingComponent")}
        ids={slate.components}
        resolve={getComponent}
        picked={componentId}
        onPick={setComponentId}
      />

      <Button
        variant="contained"
        size="large"
        disabled={!styleId || !componentId || busy}
        onClick={() => styleId && componentId && onSteal({ styleId, componentId })}
      >
        {t("steal.confirm")}
      </Button>
    </Stack>
  );
}

function Slate({
  heading,
  ids,
  resolve,
  picked,
  onPick,
}: {
  heading: string;
  ids: string[];
  resolve: (id: string) => Card | undefined;
  picked: string | null;
  onPick: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {heading}
      </Typography>
      <Stack spacing={0.5}>
        {ids.map((id) => {
          const card = resolve(id);
          return (
            <Button
              key={id}
              onClick={() => onPick(id)}
              variant={picked === id ? "contained" : "outlined"}
              sx={{ justifyContent: "flex-start", fontSize: "1.05rem" }}
            >
              {card ? t(card.labelKey) : id}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}
