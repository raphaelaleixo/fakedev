import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useGame } from "../contexts/GameContext";
import AppHeader from "../components/AppHeader";
import { color, font } from "../theme/tokens";

/** Room code entry. The big screen creates rooms; this is how a player finds one. */
export default function JoinPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createRoom } = useGame();
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);

  function handleJoin(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) navigate(`/room/${trimmed}/player`);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      navigate(`/room/${await createRoom()}`);
    } catch {
      setCreating(false);
    }
  }

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
        <Typography variant="h3" component="h1" gutterBottom>
          {t("join.heading")}
        </Typography>

        <Box component="form" onSubmit={handleJoin}>
          <Stack spacing={2}>
            <TextField
              label={t("join.codeLabel")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              slotProps={{
                htmlInput: {
                  maxLength: 5,
                  autoCapitalize: "characters",
                  autoCorrect: "off",
                  spellCheck: false,
                  style: { letterSpacing: "0.3em", fontSize: "1.5rem" },
                },
              }}
              autoFocus
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={!code.trim()}>
              {t("join.submit")}
            </Button>
          </Stack>
        </Box>

        <Typography
          variant="caption"
          sx={{ display: "block", color: color.muted, mt: 5, mb: 1 }}
        >
          {t("join.hostPrompt")}
        </Typography>
        <Button variant="outlined" onClick={handleCreate} disabled={creating} fullWidth>
          {creating ? t("join.creating") : t("join.create")}
        </Button>
      </Box>
      </Box>
    </Box>
  );
}
