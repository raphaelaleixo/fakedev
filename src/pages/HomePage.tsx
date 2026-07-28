import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Plane, Skyline } from "../components/Skyline";
import { color, font } from "../theme/tokens";

/**
 * The cover.
 *
 * Two colours, flat shapes, and most of the screen left empty above the
 * horizon — the emptiness is what makes it read as confident rather than busy.
 * An homage to the game this adapts, not a reproduction of it: our own
 * silhouette, our own typeface, and the original credited below.
 */
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
      {/* The empty half, with one mark in it. */}
      <Box sx={{ flex: "1 1 auto", position: "relative", minHeight: 120 }}>
        <Box
          sx={{
            position: "absolute",
            top: { xs: "18%", md: "24%" },
            left: 0,
            animation: "drift 30s linear infinite",
            "@keyframes drift": {
              from: { transform: "translateX(-15vw)" },
              to: { transform: "translateX(105vw)" },
            },
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
              transform: "translateX(14vw)",
            },
          }}
        >
          <Plane size={54} />
        </Box>
      </Box>

      {/* Same gutters and column as the title band, so the houses stand on the
          same left edge as the "A" and their ground line meets the flame. */}
      <Box sx={{ flex: "0 0 auto", px: { xs: 3, md: 8 } }}>
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
          pb: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
          {/* Three scales, stacked. The article is tiny on purpose. */}
          <Typography
            component="p"
            sx={{
              fontFamily: font.display,
              fontWeight: 800,
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              lineHeight: 1,
            }}
          >
            A
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: font.display,
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "clamp(2.6rem, 11vw, 7rem)",
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
              mt: 0.5,
            }}
          >
            {t("home.titleTail")}
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

          <Typography
            sx={{
              mt: { xs: 3, md: 4 },
              fontFamily: font.mono,
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
              color: color.onFlame,
              opacity: 0.75,
            }}
          >
            {t("home.credit")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
