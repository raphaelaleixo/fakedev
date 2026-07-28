import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { Skyline } from "../components/Skyline";
import { Ludoratory } from "../components/Ludoratory";
import { color, font } from "../theme/tokens";

/**
 * The cover.
 *
 * Two colours, flat shapes, and most of the screen left empty above the
 * horizon — the emptiness is what makes it read as confident rather than busy.
 * An homage to the game this adapts, not a reproduction of it: our own
 * silhouette, our own typeface, and the original credited below.
 */
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

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: color.ink,
        color: color.flame,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* The empty half. Nothing in it — that is the whole idea. */}
      <Box sx={{ flex: "1 1 auto", minHeight: 120 }} />

      {/* Same gutters and column as the title band, so the houses stand on the
          same left edge as the "A" and their ground line meets the flame. */}
      <Box sx={{ flex: "0 0 auto", px: { xs: 3, md: 8 }, mb: "-2px" }}>
        <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
          <Skyline />
        </Box>
      </Box>

      <Box
        sx={{
          flex: "0 0 auto",
          backgroundColor: color.flame,
          color: color.ink,
          px: { xs: 3, md: 8 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 7, md: 10 },
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
          {/* Two lines, two scales. */}
          <Typography
            component="h1"
            sx={{
              fontFamily: font.display,
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "clamp(2.1rem, 8.6vw, 5.4rem)",
              lineHeight: 0.86,
              letterSpacing: "-0.035em",
            }}
          >
            {t("home.titleMain")}
          </Typography>
          <Typography
            component="p"
            sx={{
              fontFamily: font.display,
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "clamp(0.95rem, 3.4vw, 2.1rem)",
              letterSpacing: "0.12em",
              lineHeight: 1,
              mt: "-0.12em",
            }}
          >
            {t("home.titleTail")}
          </Typography>

          {/* Attribution sits with the title, not in the small print: it names
              the game this one is an adaptation of. */}
          <Typography
            sx={{
              ...fine,
              // JetBrains Mono ships 400/500/700 here; 700 is a real face, not
              // a synthesised one.
              fontWeight: 700,
              fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
              opacity: 0.9,
              mt: { xs: 2, md: 2.5 },
            }}
          >
            {t("home.credit")}
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: { xs: 3, md: 4 } }}
          >
            <Button
              component={RouterLink}
              to="/join"
              size="large"
              sx={{
                backgroundColor: color.ink,
                color: color.flame,
                "&:hover": { backgroundColor: "#000" },
              }}
            >
              {t("home.newGame")}
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

          {/* The one part of the cover that belongs to the collection rather
              than to this game, so it is lifted verbatim from the others. */}
          <Stack direction="row" spacing={1.5} sx={{ mt: { xs: 3, md: 4 }, alignItems: "center" }}>
            <Ludoratory size={30} sx={{ flex: "none", color: color.onFlame, opacity: 0.75 }} />
            <Box>
              <Typography sx={fine}>
                {t("footer.madeByPrefix")}
                <Link href="https://ludoratory.com" target="_blank" rel="noopener noreferrer" sx={{ color: "inherit" }}>
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
    </Box>
  );
}
