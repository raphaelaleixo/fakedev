import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { Skyline } from "../components/Skyline";
import { Ludoratory } from "../components/Ludoratory";
import { useGame } from "../contexts/GameContext";
import { color, font } from "../theme/tokens";

/**
 * The cover.
 *
 * Two colours, flat shapes, and most of the screen left empty above the
 * houses — the emptiness is what makes it read as confident rather than busy.
 * An homage to the game this adapts, not a reproduction of it: our own
 * silhouette, our own typeface, and the original credited below.
 *
 * The type scales on **container** query units, not viewport units: `cqi` is a
 * percentage of the text column, which is the thing the type actually has to
 * fit inside. On a wide screen the column stops growing at 1100px and so does
 * the headline, which `vw` could never express. Every `clamp` keeps its max
 * under 2.5× its min so the page still reflows under browser zoom.
 */

/** The shared gutter and column, so the houses and the type share one edge. */
const gutters = { px: { xs: 3, md: 8 } } as const;
const column = { maxWidth: 1100, mx: "auto", width: "100%" } as const;

/**
 * The flame band is drawn by two elements — `main` ends where `footer` begins —
 * and any two boxes that merely touch will show a subpixel seam at some zoom
 * levels. Everything painted flame therefore overlaps its neighbour by a hair.
 * The houses do the same thing for the same reason: their ground bar is flame,
 * so the overlap is invisible and the two read as one surface.
 */
const SEAM_OVERLAP = "-2px";
const flame = { backgroundColor: color.flame, color: color.ink, ...gutters } as const;

/** The small print, in one voice: mono, tight, and quiet against the flame. */
const fine = {
  fontFamily: font.mono,
  fontSize: "0.72rem",
  lineHeight: 1.5,
  letterSpacing: "0.06em",
  color: color.onFlame,
  opacity: 0.75,
} as const;

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createRoom } = useGame();
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);

  /**
   * The cover's primary action opens a room outright. Asking for a code first
   * is backwards for the one person who doesn't have one yet — they're the
   * person the code comes *from*.
   *
   * The in-flight guard is here rather than on the button's `disabled`, because
   * disabling an element you just pressed throws the user's focus back to the
   * document body.
   */
  async function openRoom() {
    if (opening) return;
    setOpening(true);
    setFailed(false);
    try {
      navigate(`/room/${await createRoom()}`);
    } catch {
      setOpening(false);
      setFailed(true);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: color.ink,
        color: color.flame,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box component="main" sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
        {/* The empty half. Nothing in it — that is the whole idea. */}
        <Box sx={{ flex: "1 1 auto", minHeight: 120 }} />

        {/* The houses overlap the band by a hair. Two adjacent boxes leave a
            subpixel seam at most zoom levels, and since the drawing's ground
            bar is flame and the band is flame, overlapping hides it and lets
            the two read as one shape. */}
        <Box sx={{ flex: "0 0 auto", ...gutters, mb: SEAM_OVERLAP }}>
          <Box sx={column}>
            <Skyline />
          </Box>
        </Box>

        <Box sx={{ flex: "0 0 auto", ...flame, pt: { xs: 3, md: 4 } }}>
          <Box sx={{ ...column, containerType: "inline-size" }}>
            <Typography
              variant="h1"
              sx={{
                fontFamily: font.display,
                fontWeight: 800,
                textTransform: "uppercase",
                m: 0,
              }}
            >
              {/* Two lines for the look, one name for the meaning. The space
                  between the spans collapses visually — they are blocks — but
                  keeps the accessible name from running the words together. */}
              <Box
                component="span"
                sx={{
                  display: "block",
                  fontSize: "clamp(2.2rem, 7.8cqi, 5.4rem)",
                  lineHeight: 0.86,
                  letterSpacing: "-0.035em",
                }}
              >
                {t("home.titleMain")}
              </Box>{" "}
              <Box
                component="span"
                sx={{
                  display: "block",
                  fontSize: "clamp(0.95rem, 3cqi, 2.1rem)",
                  lineHeight: 1,
                  letterSpacing: "0.12em",
                  mt: "-0.12em",
                }}
              >
                {t("home.titleTail")}
              </Box>
            </Typography>

            {/* Attribution sits with the title, not in the small print: it
                names the work this game is an adaptation of, which is what
                <cite> is for. */}
            <Typography
              sx={{
                ...fine,
                // JetBrains Mono ships 400/500/700 here; 700 is a real face,
                // not a synthesised one.
                fontWeight: 700,
                fontSize: "clamp(0.8rem, 1.45cqi, 1rem)",
                opacity: 0.9,
                mt: { xs: 2, md: 2.5 },
              }}
            >
              {t("home.creditPrefix")}
              <Box component="cite" sx={{ fontStyle: "normal" }}>
                {t("home.creditWork")}
              </Box>
              {t("home.creditSuffix")}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: { xs: 3, md: 4 } }}
            >
              <Button
                onClick={openRoom}
                aria-disabled={opening}
                size="large"
                sx={{
                  backgroundColor: color.ink,
                  color: color.flame,
                  "&:hover": { backgroundColor: "#000" },
                  '&[aria-disabled="true"]': { opacity: 0.6, cursor: "progress" },
                }}
              >
                {opening ? t("home.newGamePending") : t("home.newGame")}
              </Button>
              <Button
                component={RouterLink}
                to="/join"
                size="large"
                sx={{
                  border: `2px solid ${color.ink}`,
                  color: color.ink,
                  "&:hover": { backgroundColor: color.ink, color: color.flame },
                }}
              >
                {t("home.resumeGame")}
              </Button>
              <Button
                component={RouterLink}
                to="/how-to-play"
                size="large"
                sx={{ color: color.ink, "&:hover": { textDecoration: "underline" } }}
              >
                {t("home.howToPlay")}
              </Button>
            </Stack>

            {/* Losing the room is the kind of failure that stops you dead, so
                it interrupts. The "Opening…" state deliberately does not — an
                interstitial announcement is noise. */}
            {failed && (
              <Typography role="alert" sx={{ ...fine, fontWeight: 700, mt: 1.5 }}>
                {t("home.newGameFailed")}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Outside <main> so it lands as a contentinfo landmark. It carries the
          band's bottom padding, which keeps the flame continuous. */}
      <Box
        component="footer"
        sx={{ ...flame, mt: SEAM_OVERLAP, pt: { xs: 3, md: 4 }, pb: { xs: 7, md: 10 } }}
      >
        <Stack direction="row" spacing={1.5} sx={{ ...column, alignItems: "center" }}>
          <Ludoratory size={30} sx={{ flex: "none", color: color.onFlame, opacity: 0.75 }} />
          <Box>
            <Typography sx={fine}>
              {t("footer.madeByPrefix")}
              <Link
                href="https://ludoratory.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "inherit" }}
              >
                {t("footer.madeByLink")}
              </Link>
              {t("footer.madeBySuffix")}
            </Typography>
            <Typography sx={fine}>
              {t("footer.licensePrefix")}
              <Link
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "inherit" }}
              >
                {t("footer.licenseLink")}
              </Link>
              {t("footer.licenseSuffix")}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
