import { useEffect, useId, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { useTranslation } from "react-i18next";
import { getComponent, getStyle } from "../../game/content/deck";
import { foldEdits } from "../../game/fold";
import { tallyVotes } from "../../game/round";
import type { Round, RoundPhase } from "../../game/types";
import { useTransitionSettled } from "../../hooks/useViewTransition";
import { color, dim, font, motion, pulse } from "../../theme/tokens";
import BoardPanel from "./BoardPanel";
import FilePanel from "./FilePanel";
import type { SeatInfo } from "./LiveInspector";
import RenderWindow from "./RenderWindow";
import SeatAvatar from "./SeatAvatar";
import { SeatList, SeatRow } from "./SeatList";

/** How long the tally sits before the Impostor is named. */
const TALLY_MS = 3200;
/** And how long they are named for before the round resolves. */
const NAMED_MS = 2600;

/** Which phases this screen owns. The turns and the countdown are the canvas. */
export type ResolutionPhase = Extract<RoundPhase, "voting" | "reveal" | "steal" | "result">;

/**
 * How a round resolves: the vote, the tally, the Impostor, the answer.
 *
 * **One component for all four, changing props — not four screens handing off
 * to each other.** That is the whole design of this file, and it is worth
 * saying why, because the obvious structure is a screen per phase.
 *
 * The list of people is the thing that never leaves. It appears when the vote
 * opens and is still there when the points are awarded, growing out of its
 * column to take the screen and shrinking back beside the render at the end.
 * Built as separate screens, that continuity has to be *reconstructed*: the
 * browser photographs one list, photographs the next, and interpolates between
 * the pictures. Everything that can go wrong with a picture then does — a row
 * stretched to a new width turns its avatars into ovals, a snapshot whose
 * animation ends without a fill mode reappears at full opacity and ghosts under
 * its own replacement, and two images of one row blended additively saturate to
 * white.
 *
 * None of that is reachable from here. The rows are the same DOM nodes
 * throughout, so there is nothing to photograph and nothing to blend: the
 * column changes width, the browser reflows, and a CSS transition carries it.
 * The only thing that genuinely leaves is the board, and it leaves by sliding.
 *
 * The beats:
 *
 *  1. **The vote.** The board is still on the table — in the paper game the
 *     drawing does not go away while everyone points at each other, and the
 *     whole question of the vote is answered by what is on it.
 *  2. **The tally.** Who pointed at whom, counted on the row of the person who
 *     received them, which is where the number always belonged.
 *  3. **The Impostor**, named whether or not they were caught. This is the
 *     moment the round has been building to, so it gets a beat of its own.
 *  4. **The steal**, only if they were caught, then **the answer**: the render
 *     arrives in the panel the board left, the file gets its real name, and the
 *     votes become points.
 *
 * Seat order holds throughout and nothing here ranks it. Re-sorting would
 * scramble the list at the moment it is widening, and at the tally it would be
 * sorting by votes the room has not been shown yet — the order would give the
 * count away before the counting.
 */
export default function ResolutionScreen({
  round,
  phase,
  seats,
  scores,
  finished,
  winnerIds,
  onRevealDone,
  onNext,
}: {
  round: Round;
  phase: ResolutionPhase;
  seats: SeatInfo[];
  scores: Record<number, number>;
  finished: boolean;
  winnerIds?: number[];
  onRevealDone: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const [named, setNamed] = useState(false);
  const listTitleId = useId();

  const votes = round.votes ?? {};
  const { counts } = tallyVotes(votes);
  const impostor = seats.find((s) => s.id === round.chameleonId);
  const style = getStyle(round.styleId);
  const component = getComponent(round.componentId);

  const voting = phase === "voting";
  const answered = phase === "result";
  /** The board on the way in, the render on the way out, nothing in between. */
  const showPanel = voting || answered;

  /**
   * Nothing is timed against the commit that starts a movement — see
   * `useTransitionSettled`. A timer armed inside a transition counts through
   * the choreography rather than after it, and whatever it changes lands
   * mid-flight.
   */
  const settled = useTransitionSettled();

  useEffect(() => {
    if (phase !== "reveal" || !settled) return;
    const toNamed = setTimeout(() => setNamed(true), TALLY_MS);
    const onward = setTimeout(onRevealDone, TALLY_MS + NAMED_MS);
    return () => {
      clearTimeout(toNamed);
      clearTimeout(onward);
    };
  }, [phase, settled, onRevealDone]);

  const secret = [
    style ? t(style.labelKey) : round.styleId,
    component ? t(component.labelKey) : round.componentId,
  ];

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        backgroundColor: color.ink,
        color: color.paper,
        // The panel's own width is measured against this rather than against
        // the viewport, so it stays exactly the width of its track while the
        // track is collapsing — see `departing`.
        containerType: "inline-size",
        display: "grid",
        /**
         * One track that opens and closes, rather than two layouts.
         *
         * `--panel` is the only thing that changes: the left column is 62% of
         * the row while there is something in it and 0% while there is not, and
         * the list takes whatever is left. Transitioning the track itself is
         * what makes the list *grow* — it is real layout the whole way, so the
         * rows reflow into the new width instead of being stretched into it.
         */
        "--panel": showPanel ? "62%" : "0%",
        gridTemplateColumns: { xs: "1fr", md: "var(--panel) minmax(0, 1fr)" },
        gridTemplateRows: "auto 1fr",
        transition: "grid-template-columns var(--motion-slow) var(--motion-enter)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        columnGap: { xs: 2, md: 3 },
        rowGap: 2,
        p: { xs: 2, md: 3 },
        height: "100%",
      }}
    >
      {/* The heading belongs to the panel below it and travels with it: "Round
          N" is the board's, the Secret is the render's. Neither is ever the
          list's, which is why the list keeps its own h2 instead. */}
      <Box aria-hidden={!showPanel} sx={departing(showPanel)}>
        <Box sx={panel(showPanel)}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontSize: "clamp(1.2rem, 2.6vw, 2rem)",
              textTransform: "none",
              whiteSpace: "nowrap",
              color: answered ? color.flame : color.paper,
            }}
          >
            {/* Sentence case, against the theme's uppercase h2. Nothing about
                the answer is public until it is — then the name nobody was
                allowed to say all round takes the place the number had. */}
            {answered ? secret.join(" · ") : t("canvas.round", { number: round.index + 1 })}
          </Typography>
        </Box>
      </Box>

      <Typography
        component="h2"
        id={listTitleId}
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
        {/* The question, then what answered it, then what it cost. Same
            element throughout, so the column is never re-titled from scratch. */}
        {t(voting ? "vote.heading" : answered ? "result.standings" : "vote.revealHeading")}
      </Typography>

      <Box aria-hidden={!showPanel} sx={{ ...departing(showPanel), minHeight: 0 }}>
        <Box sx={{ ...panel(showPanel), display: "grid", minHeight: 0, height: "100%" }}>
          {/* The same frame holds the code and the thing it turned out to be,
              so the payoff arrives where the room has been looking all round
              rather than as a picture from somewhere else. */}
          {answered ? (
            <FilePanel name={`${round.styleId}-${round.componentId}.html`}>
              <RenderWindow tree={foldEdits(round.edits)} title={t("canvas.renderWindow")} />
            </FilePanel>
          ) : (
            <BoardPanel edits={round.edits} seats={seats} />
          )}
        </Box>
      </Box>

      <Box
        component="aside"
        aria-labelledby={listTitleId}
        sx={{ display: "grid", gap: 1.5, alignContent: "start", minHeight: 0 }}
      >
        {/* Unnamed: the region around it already carries the heading, and
            naming both makes a screen reader say it twice on the way in. */}
        <SeatList>
          {seats.map((seat, index) => (
            <SeatRow
              key={seat.id}
              seat={seat}
              // Waiting on somebody is the only state that dims a row. Once the
              // vote is in, everyone is equally in the round.
              lit={!voting || votes[seat.id] !== undefined}
              // Named from the moment the tally has had its beat, and stays
              // named through the steal and the answer.
              ringed={named && seat.id === round.chameleonId}
              trailing={
                voting ? (
                  <Waiting locked={votes[seat.id] !== undefined} row={index} />
                ) : answered ? (
                  <Points
                    gained={round.outcome?.awards?.[seat.id] ?? 0}
                    total={scores[seat.id] ?? 0}
                    won={winnerIds?.includes(seat.id)}
                  />
                ) : (
                  <Pointed
                    voters={seats.filter((other) => votes[other.id] === seat.id)}
                    count={counts[seat.id] ?? 0}
                    row={index}
                  />
                )
              }
            />
          ))}
        </SeatList>

        {/* One slot under the list, for whatever the round is currently saying.
            The count is taken out of flow so that it can fade without holding
            the space the beat lines are about to use. */}
        <Box sx={{ position: "relative", display: "grid", gap: 1.5 }}>
          <Typography
            role="status"
            aria-hidden={!voting}
            sx={{
              position: "absolute",
              insetInline: 0,
              opacity: voting ? 1 : 0,
              transition: "opacity var(--motion-quick) var(--motion-exit)",
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
              fontFamily: font.display,
              fontWeight: 600,
              fontSize: "0.85rem",
              letterSpacing: "0.04em",
              color: color.muted,
            }}
          >
            {/* The one number that tells the room when to look up, rather than
                making everybody count ten cards. */}
            {t("vote.lockedCount", {
              locked: seats.filter((seat) => votes[seat.id] !== undefined).length,
              total: seats.length,
            })}
          </Typography>

          {named && !answered && (
            <Typography role="status" sx={{ ...beatLine, color: color.flame }}>
              {t("result.wasImpostor", { name: impostor?.name ?? "" })}
            </Typography>
          )}

          {phase === "steal" && (
            <Typography role="status" sx={{ ...beatLine, ...pulse(), color: color.muted }}>
              {t("steal.guessing")}
            </Typography>
          )}

          {answered && (
            <Answer
              round={round}
              seats={seats}
              finished={finished}
              winnerIds={winnerIds}
              onNext={onNext}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * The cell the panel lives in: it collapses, and clips whatever is still in it.
 *
 * `aria-hidden` while it is gone, because sliding something out of view is a
 * visual fact and nothing more — the board and the round's number are still
 * mounted, and a screen reader would otherwise be told the page is about
 * "Round 1" while the room is being told who the Impostor was.
 *
 * On a phone the two stack and there is nothing to collapse, so the cell is
 * simply not rendered once the panel has gone.
 */
const departing = (showing: boolean) =>
  ({
    display: { xs: showing ? "block" : "none", md: "block" },
    overflow: "hidden",
    minWidth: 0,
  }) as const;

/**
 * And the panel itself, which slides rather than shrinks.
 *
 * Left to itself it would be squeezed out as its track closes — the board
 * reflowing narrower and narrower on its way off screen, which reads as being
 * crushed rather than leaving. Holding it at the track's *open* width in
 * container units keeps it whole, and the cell above clips what has left.
 */
const panel = (showing: boolean) =>
  ({
    width: { xs: "100%", md: "62cqi" },
    translate: { xs: "none", md: showing ? "0" : "-105%" },
    transition: "translate var(--motion-slow) var(--motion-enter)",
    "@media (prefers-reduced-motion: reduce)": { transition: "none" },
  }) as const;

const beatLine = {
  fontFamily: font.display,
  fontWeight: 600,
  fontSize: "clamp(1.1rem, 2.2vw, 1.6rem)",
} as const;

/**
 * Whether this person has voted, in words.
 *
 * Never colour alone. Deciding breathes, at the same rate as the lobby's
 * waiting line — the room is waiting on a person in both cases, and a label
 * that only sits there looks the same whether somebody is thinking or has
 * walked off. Offset per row, so four people still thinking read as four people
 * rather than as one alarm.
 */
function Waiting({ locked, row }: { locked: boolean; row: number }) {
  const { t } = useTranslation();
  return (
    <Box
      component="span"
      sx={{
        flex: "none",
        fontFamily: font.display,
        fontWeight: 600,
        fontSize: "0.75rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: locked ? color.flame : dim(color.paper, 45),
        ...(locked ? {} : pulse(motion.waiting, `${row * -0.4}s`)),
      }}
    >
      {locked ? t("vote.locked") : t("vote.thinking")}
    </Box>
  );
}

/**
 * Who pointed here, and how many — on the row of the person they pointed at.
 *
 * Lands one row after another, and *after* the list has finished growing. A
 * tally that appears all at once reads as a table; arriving in sequence reads
 * as counting.
 */
function Pointed({ voters, count, row }: { voters: SeatInfo[]; count: number; row: number }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 1,
        animation: `count-in var(--motion-base) calc(var(--motion-slow) + ${row * 90}ms) var(--motion-enter) both`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {voters.map((voter) => (
          <SeatAvatar key={voter.id} seat={voter} lit size={22} />
        ))}
      </Box>
      <Box
        component="span"
        sx={{
          minWidth: "2ch",
          textAlign: "right",
          fontFamily: font.display,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: count ? color.flame : "transparent",
        }}
      >
        <span aria-hidden>{count}</span>
        {count > 0 && (
          <Box component="span" sx={visuallyHidden}>
            {t("vote.received", { count })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Points({ gained, total, won }: { gained: number; total: number; won?: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        flex: "none",
        display: "flex",
        gap: 1.5,
        alignItems: "baseline",
        fontFamily: font.display,
        fontWeight: 800,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Box component="span" sx={{ color: gained ? color.flame : "transparent" }}>
        +{gained}
      </Box>
      <Box component="span" sx={{ color: won ? color.flame : color.paper }}>
        {total}
      </Box>
    </Box>
  );
}

/** What it came to, and the way on. */
function Answer({
  round,
  seats,
  finished,
  winnerIds,
  onNext,
}: {
  round: Round;
  seats: SeatInfo[];
  finished: boolean;
  winnerIds?: number[];
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const outcome = round.outcome;
  const impostor = seats.find((s) => s.id === round.chameleonId);
  const halves = outcome?.steal ? Number(outcome.steal.style) + Number(outcome.steal.component) : 0;

  const headline = !outcome
    ? ""
    : outcome.steal
      ? t(halves === 2 ? "result.stolen" : halves === 1 ? "result.half" : "result.guessedNothing", {
          name: impostor?.name,
        })
      : outcome.tied
        ? t("result.tied", { name: impostor?.name })
        : t("result.escaped", { name: impostor?.name });

  return (
    <Box sx={{ display: "grid", gap: 1.5, justifyItems: "start" }}>
      <Typography sx={beatLine}>{headline}</Typography>

      {round.stealGuess && halves < 2 && (
        <Typography sx={{ color: color.muted, fontFamily: font.display }}>
          {t("result.guessed", {
            guess: [getStyle(round.stealGuess.styleId), getComponent(round.stealGuess.componentId)]
              .map(
                (card, i) =>
                  (card && t(card.labelKey)) ??
                  [round.stealGuess?.styleId, round.stealGuess?.componentId][i],
              )
              .join(" · "),
          })}
        </Typography>
      )}

      {finished ? (
        <Typography sx={{ ...beatLine, color: color.flame }}>
          {t("result.matchWinner", {
            names: (winnerIds ?? [])
              .map((id) => seats.find((s) => s.id === id)?.name ?? `#${id}`)
              .join(" & "),
          })}
        </Typography>
      ) : (
        <Button variant="contained" size="large" onClick={onNext}>
          {t("result.nextRound")}
        </Button>
      )}
    </Box>
  );
}
