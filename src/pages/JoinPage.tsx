import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import PageShell from "../components/PageShell";
import { useOpenRoom } from "../hooks/useOpenRoom";
import { color, font } from "../theme/tokens";

/**
 * Room codes are five characters from `react-gameroom`'s alphabet — A–Z and
 * 0–9, no lower case. Saying so in the markup means the browser can do the
 * validating, the phone can raise the right keyboard, and nobody has to be told
 * the rule twice.
 */
const CODE_LENGTH = 5;
const CODE_PATTERN = `[A-Z0-9]{${CODE_LENGTH}}`;

/** Room code entry. The big screen creates rooms; this is how a player finds one. */
export default function JoinPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { open: openRoom, opening, failed } = useOpenRoom();
  const [code, setCode] = useState("");

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/room/${code.trim().toUpperCase()}/player`, { viewTransition: true });
  }

  return (
    <PageShell fill>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          p: 3,
          fontFamily: font.mono,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 460, mx: "auto" }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {t("join.heading")}
          </Typography>

          {/* No `action`: the room lives in the URL, so joining is a client-side
              route change rather than a request. `noValidate` is deliberately
              absent — the browser's own constraint reporting is better than
              anything hand-rolled here, and the constraints are declared below. */}
          <Box component="form" onSubmit={handleJoin}>
            <Stack spacing={2}>
              {/* A real label above the field rather than MUI's floating one.
                  It never moves, never overlaps the value, and never needs a
                  notch cut in the outline to sit in — and a label you can read
                  while the field has content is the point of having one. The
                  gap to the input is deliberately tighter than the gap to the
                  button, so the pair reads as one group. */}
              <Stack spacing={0.75}>
                <Typography
                  variant="caption"
                  component="label"
                  htmlFor="room-code"
                  sx={{ color: color.muted }}
                >
                  {t("join.codeLabel")}
                </Typography>
                <TextField
                  id="room-code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  helperText={t("join.codeHint", { count: CODE_LENGTH })}
                  required
                  autoFocus
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      maxLength: CODE_LENGTH,
                      minLength: CODE_LENGTH,
                      pattern: CODE_PATTERN,
                      // A code is neither a word nor a number: no autocorrect,
                      // no capitalisation guessing, and a keyboard with both
                      // letters and digits on it.
                      autoComplete: "off",
                      autoCapitalize: "characters",
                      autoCorrect: "off",
                      spellCheck: false,
                      inputMode: "text",
                      enterKeyHint: "go",
                    },
                  }}
                  sx={{
                    // Sized on the root, so the outline scales with the text
                    // instead of staying at the default and leaving a gap
                    // under it.
                    "& .MuiOutlinedInput-root": { fontSize: "1.5rem", letterSpacing: "0.3em" },
                  }}
                />
              </Stack>
              {/* Not disabled until valid: a dead button gives no reason. The
                  constraints above let the browser say what is wrong instead. */}
              <Button type="submit" variant="contained" size="large">
                {t("join.submit")}
              </Button>
            </Stack>
          </Box>

          <Typography
            variant="caption"
            component="p"
            sx={{ display: "block", color: color.muted, mt: 5, mb: 1 }}
          >
            {t("join.hostPrompt")}
          </Typography>
          <Button
            variant="outlined"
            onClick={openRoom}
            aria-disabled={opening}
            fullWidth
            sx={{ '&[aria-disabled="true"]': { cursor: "progress" } }}
          >
            {opening ? t("join.creating") : t("join.create")}
          </Button>
          {failed && (
            <Typography role="alert" sx={{ mt: 1.5, color: color.flame }}>
              {t("home.newGameFailed")}
            </Typography>
          )}
        </Box>
      </Box>
    </PageShell>
  );
}
