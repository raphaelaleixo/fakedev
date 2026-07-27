import { useState } from "react";
import { Box, Button, ButtonGroup, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ControllerShell from "../components/controller/ControllerShell";
import Composer from "../components/controller/Composer";
import { getSecret } from "../game/content/deck";
import { seatColorFor } from "../game/match";
import { MOCK_SEATS, mockRound } from "../mocks/fixtures";
import type { Edit } from "../game/types";
import { color, font } from "../theme/tokens";

/**
 * DEV-only. The controller with no live room, so the composer can be built and
 * the two role headers compared side by side.
 */
export default function MockController() {
  const { t } = useTranslation();
  const [seat, setSeat] = useState(1);
  const [committed, setCommitted] = useState<Edit[]>([]);

  const round = mockRound();
  const player = MOCK_SEATS.find((s) => s.id === seat)!;
  const isChameleon = round.chameleonId === seat;
  const secret = getSecret(round.secretId);

  return (
    <Box>
      <ControllerShell
        isChameleon={isChameleon}
        secretLabel={secret ? t(secret.labelKey) : undefined}
        seatName={player.name}
        seatColor={player.color ?? seatColorFor(seat)}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          {t("controller.yourTurn")}
        </Typography>
        <Composer
          playerId={seat}
          turnIndex={round.turnIndex}
          edits={[...round.edits, ...committed]}
          onCommit={(edit) => setCommitted((prev) => [...prev, edit])}
        />

        {committed.length > 0 && (
          <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${color.inkRule}` }}>
            <Typography variant="caption" sx={{ color: color.muted }}>
              committed this session (mock only)
            </Typography>
            {committed.map((edit) => (
              <Box key={edit.id + edit.value} sx={{ fontFamily: font.mono, fontSize: "0.85rem" }}>
                {edit.target} · {edit.kind} · {"key" in edit ? `${edit.key}: ` : ""}
                {edit.value}
              </Box>
            ))}
          </Box>
        )}
      </ControllerShell>

      <Stack
        spacing={1}
        sx={{
          position: "fixed",
          bottom: 12,
          right: 12,
          p: 1.5,
          backgroundColor: color.inkPanel,
          border: `1px solid ${color.inkRule}`,
          zIndex: 10,
        }}
      >
        <Typography variant="caption" sx={{ color: color.muted }}>
          seat (4 is the Chameleon)
        </Typography>
        <ButtonGroup size="small">
          {MOCK_SEATS.map((s) => (
            <Button
              key={s.id}
              variant={s.id === seat ? "contained" : "outlined"}
              onClick={() => setSeat(s.id)}
            >
              {s.id}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>
    </Box>
  );
}
