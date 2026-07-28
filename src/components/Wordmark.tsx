import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { color, font } from "../theme/tokens";

/**
 * The compact mark, for the masthead.
 *
 * The full name over two lines, all flame, one hard left edge. It reads as a
 * logo rather than as a truncated title.
 *
 * It breaks in a different place from the cover — "A FAKE DEV GOES / TO
 * AMSTERDAM" rather than the cover's "A FAKE DEV / GOES TO AMSTERDAM" — so it
 * carries its own copy instead of reusing the cover's. Two lines of nearly
 * equal length is what makes a small mark read as a block; the cover can afford
 * a long line under a short one because its type is thirty times bigger.
 *
 * One size and one colour throughout: at masthead scale a second type size or a
 * second colour is too small a difference to register as deliberate.
 *
 * The space between the lines collapses visually — they are blocks — but keeps
 * the accessible name from running the words together, which matters here
 * because this text is what names the link home.
 */
export function Wordmark({ size = 16 }: { size?: number }) {
  const { t } = useTranslation();

  return (
    <Box
      component="span"
      sx={{
        display: "block",
        fontFamily: font.display,
        fontWeight: 800,
        textTransform: "uppercase",
        color: color.flame,
        fontSize: size,
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      <Box component="span" sx={{ display: "block" }}>
        {t("header.wordmarkTop")}
      </Box>{" "}
      <Box component="span" sx={{ display: "block" }}>
        {t("header.wordmarkBottom")}
      </Box>
    </Box>
  );
}
