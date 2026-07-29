import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { PlayerSlotsGrid, buildPlayerUrl } from "react-gameroom";
import { useGame } from "../contexts/GameContext";
import PageShell from "../components/PageShell";
import { color, font } from "../theme/tokens";

/**
 * The controller's front door. Detects state: a lobby with room takes a name,
 * a started match offers the seat links so a returning player lands back on
 * their own seat with their role and Secret intact.
 */
export default function PlayerJoinPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { roomState, loading, notFound, loadRoom, joinRoom } = useGame();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadRoom(id);
  }, [id, loadRoom]);

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    if (!id || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const seat = await joinRoom(id, name.trim());
      navigate(`/room/${id}/player/${seat}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "generic");
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <Shell>
        <Typography sx={{ color: color.muted }}>{t("room.notFound", { code: id })}</Typography>
      </Shell>
    );
  }
  if (loading || !roomState) {
    return (
      <Shell>
        <CircularProgress />
      </Shell>
    );
  }

  if (roomState.status === "started") {
    return (
      <Shell>
        <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
          {t("playerJoin.rejoinHeading")}
        </Typography>
        {/* Both halves of what somebody arriving here needs: which one to tap,
            and why there is no way in if none of them is theirs. Without the
            second half a latecomer reads a list of strangers and no
            explanation. */}
        <Typography sx={{ color: color.muted, mb: 3 }}>
          {t("playerJoin.rejoinNote")}
        </Typography>
        <PlayerSlotsGrid
          players={roomState.players}
          filterEmpty
          buildSlotHref={(playerId) => buildPlayerUrl(roomState.roomId, playerId)}
          className="seat-grid"
          slotClassName="seat-slot"
          // `ready`, not `join`: `join` is only rendered for empty slots, and
          // this grid filters those out — so the word being shown was the
          // library's default readiness text, which is lobby language on a
          // screen about going back to a round already in progress.
          labels={{ ready: t("playerJoin.rejoinLink") }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
        {t("playerJoin.heading")}
      </Typography>
      {/* The label is prose and the code is not — see the type rule. */}
      <Typography sx={{ color: color.muted, mb: 3 }}>
        {t("playerJoin.roomLine")}{" "}
        <Box component="span" sx={{ fontFamily: font.mono, color: color.paper }}>
          {roomState.roomId}
        </Box>
      </Typography>

      <Box component="form" onSubmit={handleJoin}>
        <Stack spacing={2}>
          {/* Label above the field rather than floating in it, so it is still
              readable once there is a name in there. */}
          <Stack spacing={0.75}>
            <Typography
              variant="caption"
              component="label"
              htmlFor="player-name"
              sx={{ color: color.muted }}
            >
              {t("playerJoin.nameLabel")}
            </Typography>
            <TextField
              id="player-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              slotProps={{
                htmlInput: {
                  maxLength: 16,
                  // A first name: capitalise it, do not spell-check it, and
                  // send the keyboard's action key to the form.
                  autoComplete: "given-name",
                  autoCapitalize: "words",
                  autoCorrect: "off",
                  spellCheck: false,
                  enterKeyHint: "go",
                },
              }}
              autoFocus
              fullWidth
              error={Boolean(error)}
              helperText={
                error ? t([`playerJoin.error.${error}`, "playerJoin.error.generic"]) : " "
              }
            />
          </Stack>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || !name.trim()}
          >
            {submitting ? t("playerJoin.joining") : t("playerJoin.submit")}
          </Button>
        </Stack>
      </Box>
    </Shell>
  );
}

/**
 * The panel, centred. Not set in mono: this is chrome around the game rather
 * than any part of the board, and the one thing on it that *is* code — the room
 * code — says so itself.
 */
function Shell({ children }: { children: ReactNode }) {
  return (
    <PageShell fill>
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", p: 3 }}>
        <Box sx={{ width: "100%", maxWidth: 460, mx: "auto" }}>{children}</Box>
      </Box>
    </PageShell>
  );
}
