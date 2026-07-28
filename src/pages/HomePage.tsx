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
 * The type scales on **container** query units. `cqi` is a percentage of the
 * container's *content* box, so with the `bleed` padding below it resolves
 * against the text column rather than the window — and the column stops at
 * 1100px where the viewport doesn't. Every `clamp` keeps its max under 2.5× its
 * min so the page still reflows under browser zoom.
 *
 * The `min` of each clamp is doing real work, not just guarding: a single
 * proportional ramp cannot both fill a 340px column and stop growing on a
 * 1100px one, because small screens want type that is *relatively* larger. The
 * floors are set so the two title lines come out near enough the same width on
 * a phone — which is what makes them read as one block — and so that neither
 * wraps at 320px, the narrowest width worth supporting.
 */

/**
 * Full-bleed background, centred column, one element.
 *
 * `max(gutter, (100% - column) / 2)` is the whole trick: below 1100px the
 * gutter wins and the content is inset by it; above, the leftover space splits
 * evenly and centres the column. That's what an outer padded box plus an inner
 * `max-width: 1100; margin: auto` box did, minus the inner box.
 */
const bleed = {
  paddingInline: {
    xs: "max(1.5rem, (100% - 1100px) / 2)",
    md: "max(4rem, (100% - 1100px) / 2)",
  },
} as const;

/**
 * The houses, at 60% of the headline's width.
 *
 * "A FAKE DEV" measures about 5.6em in this face, so 0.6 × 5.6 ≈ 3.4 × the
 * title's font size. That ramp is `clamp(2.75rem, 7.8cqi, 5.4rem)`, so this is
 * the same ramp times 3.4 — the ratio then holds at every width instead of
 * only at the one I happened to check.
 *
 * Two departures, both deliberate. The floor is higher than 3.4 × 2.75rem
 * because a phone wants the drawing present rather than proportional. And
 * `42dvh` caps it on a short screen, since the cover has to fit in one
 * viewport and the houses are the part that can give.
 */
const HOUSES_WIDTH = "min(clamp(13rem, 26.5cqi, 18.4rem), 42dvh)";

/**
 * The flame band is drawn by two elements — `main` ends where `footer` begins —
 * and any two boxes that merely touch show a subpixel seam at some zoom levels.
 * Everything painted flame therefore overlaps its neighbour by a hair. The
 * houses do the same for the same reason: their ground bar is flame, so the
 * overlap is invisible and the two read as one surface.
 */
const SEAM_OVERLAP = "-2px";
const flame = { backgroundColor: color.flame, color: color.ink, ...bleed } as const;

/** The small print, in one voice: mono, tight, and quiet against the flame. */
const fine = {
  fontFamily: font.mono,
  fontSize: "0.72rem",
  lineHeight: 1.5,
  letterSpacing: "0.06em",
  color: color.onFlame,
  opacity: 0.75,
} as const;

/** Links have to be findable without colour, and inherit is all we give them. */
const inherited = {
  color: "inherit",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
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
      // `flushSync` is not decoration. Every other way out of the cover is a
      // <Link>, which navigates from inside a click handler; this one lands
      // after an await, where React treats the update as non-urgent and can
      // defer the render past the point the browser snapshots the new state —
      // so the transition runs against a page that has not changed yet.
      // flushSync commits it synchronously inside the transition callback,
      // which is what the API expects.
      navigate(`/room/${await createRoom()}`, { viewTransition: true, flushSync: true });
    } catch {
      setOpening(false);
      setFailed(true);
    }
  }

  return (
    <>
      <Box
        component="main"
        sx={{
          // Takes the slack the footer leaves, and never less than its
          // content — a short landscape viewport should scroll, a phone in
          // portrait should not.
          flex: "1 0 auto",
          backgroundColor: color.ink,
          color: color.flame,
          display: "flex",
          flexDirection: "column",
          // Everything sits at the bottom; the space above is the empty half.
          justifyContent: "flex-end",
        }}
      >
        {/* A container here too, so `cqi` inside it measures the same column
            the title does — that is what lets the houses be expressed as a
            fraction of the headline rather than as a guess in rems. */}
        <Box
          sx={{
            ...bleed,
            containerType: "inline-size",
            mb: SEAM_OVERLAP,
            viewTransitionName: "cover-art",
          }}
        >
          <Skyline maxWidth={HOUSES_WIDTH} />
        </Box>

        <Box
          sx={{
            ...flame,
            pt: { xs: 3, md: 4 },
            containerType: "inline-size",
            viewTransitionName: "cover-band",
          }}
        >
          <Typography
            variant="h1"
            sx={{ fontFamily: font.display, fontWeight: 800, textTransform: "uppercase", m: 0 }}
          >
            {/* Two lines for the look, one name for the meaning. The space
                between the spans collapses visually — they are blocks — but
                keeps the accessible name from running the words together. */}
            <Box
              component="span"
              sx={{
                display: "block",
                fontSize: "clamp(2.75rem, 7.8cqi, 5.4rem)",
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
                fontSize: "clamp(1.15rem, 3cqi, 2.1rem)",
                lineHeight: 1,
                letterSpacing: "0.12em",
                mt: "-0.12em",
              }}
            >
              {t("home.titleTail")}
            </Box>
          </Typography>

          {/* Attribution sits with the title, not in the small print: it names
              the work this game adapts, which is what <cite> is for. */}
          <Typography
            sx={{
              ...fine,
              // JetBrains Mono ships 400/500/700 here; 700 is a real face, not
              // a synthesised one.
              fontWeight: 700,
              fontSize: "clamp(0.8rem, 1.45cqi, 1rem)",
              // Progressive enhancement: evens the two wrapped lines where
              // supported, ignored entirely where it isn't.
              textWrap: "balance",
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

          {/* Sized to their labels, not to the screen. Full-width buttons with
              centred text fight the hard-left rhythm of everything above. */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: { xs: 3, md: 4 }, alignItems: "flex-start" }}
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
              viewTransition
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
              viewTransition
              size="large"
              sx={{ color: color.ink, "&:hover": { textDecoration: "underline" } }}
            >
              {t("home.howToPlay")}
            </Button>
          </Stack>

          {/* Losing the room stops you dead, so it interrupts. The "Opening…"
              state deliberately does not — interstitial announcements are noise. */}
          {failed && (
            <Typography role="alert" sx={{ ...fine, fontWeight: 700, mt: 1.5 }}>
              {t("home.newGameFailed")}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Outside <main> so it lands as a contentinfo landmark. It carries the
          band's bottom padding, which keeps the flame continuous. The mark
          spans both rows rather than sitting in a wrapper of its own. */}
      <Box
        component="footer"
        sx={{
          ...flame,
          viewTransitionName: "cover-foot",
          mt: SEAM_OVERLAP,
          pt: { xs: 3, md: 4 },
          pb: { xs: 7, md: 10 },
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "center",
          columnGap: 1.5,
        }}
      >
        <Ludoratory
          size={30}
          sx={{ gridRow: "1 / 3", color: color.onFlame, opacity: 0.75 }}
        />
        <Typography sx={fine}>
          {t("footer.madeByPrefix")}
          <Link href="https://ludoratory.com" target="_blank" rel="noopener noreferrer" sx={inherited}>
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
            sx={inherited}
          >
            {t("footer.licenseLink")}
          </Link>
          {t("footer.licenseSuffix")}
        </Typography>
      </Box>
    </>
  );
}
