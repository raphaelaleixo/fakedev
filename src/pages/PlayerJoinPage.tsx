import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { PlayerSlotsGrid, buildPlayerUrl } from "react-gameroom";
import { useGame } from "../contexts/GameContext";
import AppHeader from "../components/AppHeader";
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

  if (notFound) return <Shell>{t("room.notFound", { code: id })}</Shell>;
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
        <Typography variant="h3" gutterBottom>
          {t("playerJoin.rejoinHeading")}
        </Typography>
        <PlayerSlotsGrid
          players={roomState.players}
          filterEmpty
          buildSlotHref={(playerId) => buildPlayerUrl(roomState.roomId, playerId)}
          labels={{ join: t("playerJoin.rejoinLink") }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Typography variant="h3" gutterBottom>
        {t("playerJoin.heading")}
      </Typography>
      <Typography sx={{ color: color.muted, mb: 3 }}>
        {t("playerJoin.roomLine", { code: roomState.roomId })}
      </Typography>

      <Box component="form" onSubmit={handleJoin}>
        <Stack spacing={2}>
          <TextField
            label={t("playerJoin.nameLabel")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 16 } }}
            autoFocus
            fullWidth
            error={Boolean(error)}
            helperText={
              error ? t([`playerJoin.error.${error}`, "playerJoin.error.generic"]) : " "
            }
          />
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

function Shell({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: color.ink,
        color: color.paper,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppHeader />
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", p: 3 }}>
      <Box sx={{ width: "100%", maxWidth: 460, mx: "auto", fontFamily: font.mono }}>
        {children}
      </Box>
      </Box>
    </Box>
  );
}
