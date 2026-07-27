import { useState } from "react";
import { Box, Button, ButtonGroup, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ControllerShell from "../components/controller/ControllerShell";
import Composer from "../components/controller/Composer";
import { StealPicker, VotePicker } from "../components/controller/VoteControls";
import { getComponent, getStyle } from "../game/content/deck";
import { seatColorFor } from "../game/match";
import { MOCK_SEATS, MOCK_SLATE, MOCK_VOTES, mockRound } from "../mocks/fixtures";
import type { Edit, StealGuess } from "../game/types";
import { color, font } from "../theme/tokens";

/**
 * DEV-only. Every state a controller can be in, without a live room.
 *
 * The seat switcher matters as much as the view switcher: seat 4 is the
 * Chameleon, so flipping to it shows the FAKE DEV header and the steal — and
 * flipping away shows what everybody else sees at the same moment.
 */
const VIEWS = ["turn", "waiting", "vote", "voted", "steal", "lookUp"] as const;
type View = (typeof VIEWS)[number];

export default function MockController() {
  const { t } = useTranslation();
  const [seat, setSeat] = useState(1);
  const [view, setView] = useState<View>("turn");
  const [committed, setCommitted] = useState<Edit[]>([]);
  const [picked, setPicked] = useState<StealGuess | null>(null);

  const round = mockRound();
  const player = MOCK_SEATS.find((s) => s.id === seat)!;
  const isChameleon = round.chameleonId === seat;
  const style = getStyle(round.styleId);
  const component = getComponent(round.componentId);

  function body() {
    switch (view) {
      case "turn":
        return (
          <>
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
                  <Box
                    key={edit.id + (edit.value ?? "")}
                    sx={{ fontFamily: font.mono, fontSize: "0.85rem" }}
                  >
                    {edit.target} · {edit.kind} · {"key" in edit ? edit.key : ""}
                    {edit.value ? `: ${edit.value}` : ""}
                  </Box>
                ))}
              </Box>
            )}
          </>
        );

      case "waiting":
        return <Waiting>{t("controller.otherTurn", { name: "Ana" })}</Waiting>;

      case "vote":
        return (
          <VotePicker
            seats={MOCK_SEATS}
            voterId={seat}
            onVote={(suspectId) => alert(`voted for ${suspectId} (mock)`)}
          />
        );

      case "voted":
        return (
          <VotePicker
            seats={MOCK_SEATS}
            voterId={seat}
            locked={MOCK_VOTES[seat]}
            onVote={() => undefined}
          />
        );

      case "steal":
        // Only the caught Chameleon sees the slate. Everyone else waits.
        return isChameleon ? (
          <StealPicker slate={MOCK_SLATE} edits={round.edits} onSteal={setPicked} />
        ) : (
          <Waiting>{t("controller.stealWait")}</Waiting>
        );

      case "lookUp":
        return <Waiting>{t("controller.lookUp")}</Waiting>;
    }
  }

  return (
    <Box>
      <ControllerShell
        isChameleon={isChameleon}
        secret={
          style && component
            ? { style: t(style.labelKey), component: t(component.labelKey) }
            : undefined
        }
        seatName={player.name}
        seatColor={player.color ?? seatColorFor(seat)}
      >
        {body()}
        {picked && (
          <Typography sx={{ mt: 3, color: color.flame, fontFamily: font.mono }}>
            guessed: {picked.styleId} · {picked.componentId}
          </Typography>
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

        <Typography variant="caption" sx={{ color: color.muted }}>
          screen
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 260 }}>
          {VIEWS.map((v) => (
            <Button
              key={v}
              size="small"
              variant={v === view ? "contained" : "outlined"}
              onClick={() => {
                setView(v);
                setPicked(null);
              }}
            >
              {v}
            </Button>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

function Waiting({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography sx={{ color: color.muted, fontSize: "1.2rem" }}>{children}</Typography>
    </Box>
  );
}
