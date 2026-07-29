import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import { color, font } from "../../theme/tokens";

/**
 * The shape of a round on the big screen: which round it is, the board, and a
 * column beside it.
 *
 * Shared by the turns screen and the vote so the two cannot drift. The column
 * changes — contributors while people are editing, who has locked in while they
 * are voting — but the geometry does not, so starting the vote moves one panel
 * rather than rearranging the room.
 *
 * One grid of two rows rather than two stacked columns, so the two headings are
 * *siblings in the same row* and can share a baseline. Nesting each heading
 * inside its own column would leave them aligned at the top instead, which at
 * two different sizes is not aligned at all.
 *
 * "Round N" is the heading for both phases, which is why the column's own title
 * is an h2: the view is the round, and whatever the column is doing happens
 * within it. It sits outside the `aside` so it can share that row, so the
 * `aside` is named by it rather than containing it.
 *
 * It deliberately carries no transition name. It belongs to the board — when
 * the round ends the two of them leave together, and a name would have pinned
 * it in place while everything under it slid away.
 */
export default function RoundLayout({
  roundNumber,
  asideTitle,
  aside,
  children,
}: {
  roundNumber: number;
  /**
   * The column's heading, rendered here rather than by the caller so the two
   * phases cannot end up styling it differently — "Contributors" and "Who's
   * the fake dev?" are the same thing in the same place, one phase apart.
   */
  asideTitle: string;
  aside: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        backgroundColor: color.ink,
        color: color.paper,
        display: "grid",
        // The board takes the room; the column beside it stays put. On a phone
        // they stack, board first, because the board is what is being read.
        gridTemplateColumns: { xs: "1fr", md: "1fr minmax(220px, 20rem)" },
        gridTemplateRows: { md: "auto 1fr" },
        columnGap: { xs: 2, md: 3 },
        rowGap: 2,
        p: { xs: 2, md: 3 },
        height: "100%",
      }}
    >
      {/* Which round this is, and nothing else — the file below says what is
          being built, which is a thing with no name. Nothing about the answer
          is public; the Chameleon learns from their own controller that a guess
          is two halves, so neither has to say so.

          Sentence case, against the theme's uppercase h2. */}
      <Typography
        variant="h2"
        component="h1"
        sx={{
          alignSelf: "baseline",
          fontSize: "clamp(1.2rem, 2.6vw, 2rem)",
          textTransform: "none",
          color: color.paper,
        }}
      >
        {t("canvas.round", { number: roundNumber })}
      </Typography>

      <Typography
        component="h2"
        id={titleId}
        sx={{
          alignSelf: "baseline",
          fontFamily: font.display,
          fontWeight: 600,
          // Between the label it was and the question it becomes: big enough to
          // head a column, small enough not to compete with the round.
          fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
          lineHeight: 1.2,
          color: color.paper,
        }}
      >
        {asideTitle}
      </Typography>

      <Box sx={{ minWidth: 0, minHeight: 0, display: "grid" }}>{children}</Box>

      {/* `alignContent: start` because the row is `1fr` — the board has to
          stretch into it, and without this the column's own grid stretches too
          and pushes its rows apart down the height of the screen. */}
      <Box
        component="aside"
        aria-labelledby={titleId}
        sx={{ display: "grid", gap: 1.5, alignContent: "start" }}
      >
        {aside}
      </Box>
    </Box>
  );
}
