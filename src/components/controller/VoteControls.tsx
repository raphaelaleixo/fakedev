import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SEAT_COLORS } from "../../game/constants";
import { getSecret } from "../../game/content/deck";
import { foldEdits } from "../../game/fold";
import RenderWindow from "../canvas/RenderWindow";
import type { Edit } from "../../game/types";
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
      <Typography variant="h4">{t("vote.whoIsFake")}</Typography>
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
 * The caught Chameleon's one guess: the Secret plus its four nearest
 * neighbours, shuffled. One answer, no second attempt.
 *
 * **This is the one place a controller shows the render**, which `rules.md`
 * otherwise forbids outright. The exception is what keeps the steal as fair as
 * the paper game's: there, the fake artist guesses while looking at the
 * finished drawing, sitting on the table in front of everyone. The render is
 * that drawing. Withholding it until after the guess would make our steal
 * strictly harder than the source, and the 20% floor and the +3 payout were
 * balanced around a real chance.
 *
 * The Devs still don't see it — the TV holds the render for resolution, so the
 * reveal beat survives intact.
 */
export function StealPicker({
  slate,
  edits,
  onSteal,
  busy,
}: {
  slate: string[];
  /** The round's log, so the Chameleon can see what the table built. */
  edits: Edit[];
  onSteal: (secretId: string) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <Stack spacing={2}>
      <Typography variant="h4">{t("steal.heading")}</Typography>
      <Box sx={{ height: 240 }}>
        <RenderWindow tree={foldEdits(edits)} title={t("canvas.renderWindow")} />
      </Box>
      <Typography sx={{ color: color.muted }}>{t("steal.oneShot")}</Typography>
      <Stack spacing={1}>
        {slate.map((secretId) => {
          const secret = getSecret(secretId);
          return (
            <Button
              key={secretId}
              onClick={() => setPicked(secretId)}
              variant={picked === secretId ? "contained" : "outlined"}
              size="large"
              sx={{ justifyContent: "flex-start", fontSize: "1.05rem" }}
            >
              {secret ? t(secret.labelKey) : secretId}
            </Button>
          );
        })}
      </Stack>
      <Button
        variant="contained"
        size="large"
        disabled={picked === null || busy}
        onClick={() => picked && onSteal(picked)}
      >
        {t("steal.confirm")}
      </Button>
    </Stack>
  );
}
