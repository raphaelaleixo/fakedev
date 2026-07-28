import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { foldEdits } from "../../game/fold";
import { activePlayerId, totalTurns } from "../../game/round";
import type { Round } from "../../game/types";
import { color, font } from "../../theme/tokens";
import LiveInspector, { type SeatInfo } from "./LiveInspector";
import TurnRail from "./TurnRail";

/**
 * The big screen during a round.
 *
 * Nothing about the Secret is public — the header only names the *shape* of the
 * answer, `style × component`, so everyone knows what the Chameleon must guess.
 *
 * **The canvas shows code, not the render.** Finishing the component was never
 * the goal — the table is watching who is working toward it — and half the
 * moves under the split (naming a property) change nothing visually at all. A
 * live render would show the least interesting thing on screen while making
 * every other turn look like a no-op. The render is the payoff instead, and it
 * lands at resolution beside the Chameleon and the Secret.
 */
export default function Canvas({
  round,
  seats,
  scores,
}: {
  round: Round;
  seats: SeatInfo[];
  /** Running match totals, so the sidebar reads as a standings board too. */
  scores: Record<number, number>;
}) {
  const { t } = useTranslation();
  const tree = foldEdits(round.edits);
  const active = activePlayerId(round);
  const activeSeat = seats.find((s) => s.id === active);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        backgroundColor: color.ink,
        color: color.paper,
        display: "grid",
        // The board takes the room; the people take what they need. On a phone
        // they stack, board first, because the board is the thing being read.
        gridTemplateColumns: { xs: "1fr", md: "1fr minmax(180px, 15rem)" },
        alignItems: "start",
        gap: { xs: 2, md: 3 },
        p: { xs: 2, md: 3 },
        height: "100%",
      }}
    >
      <Box sx={{ minWidth: 0, display: "grid", gridTemplateRows: "auto 1fr", gap: 2, height: "100%", minHeight: 0 }}>
        {/* Which round this is, and nothing else — the heading says where you
            are in the match, and the file below says what is being built, which
            is a thing with no name. Nothing about the answer is public; the
            Chameleon learns from their own controller that a guess is two
            halves, so neither has to say so.

            Sentence case, against the theme's uppercase h2. */}
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontSize: "clamp(1.2rem, 2.6vw, 2rem)",
            textTransform: "none",
            color: color.paper,
          }}
        >
          {t("canvas.round", { number: round.index + 1 })}
        </Typography>

        {/* One panel with a header, the way a file reads on a repository: the
            name of the thing above the thing. It also gives the board a top
            edge, which it lacked — the code used to start against the page. */}
        <Box
          sx={{
            minHeight: 0,
            display: "grid",
            gridTemplateRows: "auto 1fr",
            border: `1px solid ${color.inkRule}`,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: `1px solid ${color.inkRule}`,
              backgroundColor: color.inkPanel,
              // Mono here is the exception that proves the rule: it is a file
              // name, which is part of the board rather than chrome around it.
              fontFamily: font.mono,
              fontSize: "0.8rem",
              color: color.muted,
            }}
          >
            {t("canvas.fileName")}
          </Box>
          {/* The header is the only lifted surface; the code sits straight on
              the page. A panel behind it would put a second box around
              something the border already encloses. */}
          <LiveInspector
            edits={round.edits}
            tree={tree}
            seats={seats}
            sx={{ border: "none", backgroundColor: "transparent" }}
          />
        </Box>
      </Box>

      {/* Who is building it, and whose turn it is. An aside: it accompanies the
          board rather than being part of it. */}
      <Box component="aside" sx={{ display: "grid", gap: 1.5 }}>
        <Typography
          variant="caption"
          component="h2"
          sx={{ color: color.muted, display: "block" }}
        >
          {t("canvas.contributors")}
        </Typography>

        <TurnRail
          seats={seats}
          turnOrder={round.turnOrder}
          activeId={active}
          turnIndex={Math.min(round.turnIndex, totalTurns(round) - 1)}
          totalTurns={totalTurns(round)}
          label={t("canvas.contributors")}
          scores={scores}
        />

        {/* A round never actually rests here: committing the last edit flips
            the phase to countdown in the same write, so the big screen goes
            straight to 3… 2… 1. This is the fallback for a client holding
            stale state, and for the mock, which parks a fixture in `turns`
            with every turn played. It states the fact rather than promising
            something is about to happen, because nothing on this screen would
            make that true. */}
        <Typography
          sx={{
            fontFamily: font.display,
            fontWeight: 600,
            fontSize: "0.95rem",
            color: color.paper,
          }}
        >
          {activeSeat ? t("canvas.playerTurn", { name: activeSeat.name }) : t("canvas.turnsDone")}
        </Typography>
      </Box>
    </Box>
  );
}
