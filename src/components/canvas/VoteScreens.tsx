import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SEAT_COLORS } from "../../game/constants";
import { tallyVotes } from "../../game/round";
import { getComponent, getStyle } from "../../game/content/deck";
import { foldEdits } from "../../game/fold";
import RenderWindow from "./RenderWindow";
import type { Round } from "../../game/types";
import { color, dim, font } from "../../theme/tokens";
import type { SeatInfo } from "./LiveInspector";

/**
 * The screens between the last turn and the next round.
 *
 * Everything hidden becomes public here and nowhere earlier: the Chameleon is
 * revealed whether or not they were caught, and the Secret is revealed either
 * way too.
 */

/**
 * Ceremony happens on the ink field. The working screens are white because a
 * render has to read as real UI; these aren't working screens, so the duotone
 * takes them completely.
 */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        backgroundColor: color.ink,
        color: color.paper,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        p: 4,
        textAlign: "center",
      }}
    >
      {children}
    </Box>
  );
}

/** 3… 2… 1… Point! Then the vote opens on its own. */
export function CountdownScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [tick, setTick] = useState(3);

  useEffect(() => {
    if (tick <= 0) {
      const done = setTimeout(onDone, 700);
      return () => clearTimeout(done);
    }
    const timer = setTimeout(() => setTick((n) => n - 1), 900);
    return () => clearTimeout(timer);
  }, [tick, onDone]);

  return (
    <Stage>
      <Typography
        key={tick}
        variant="h1"
        sx={{
          fontSize: "clamp(6rem, 22vw, 18rem)",
          color: tick > 0 ? color.paper : color.flame,
          animation: "pop 220ms ease-out",
          "@keyframes pop": {
            from: { transform: "scale(0.7)", opacity: 0 },
            to: { transform: "scale(1)", opacity: 1 },
          },
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        {tick > 0 ? tick : t("vote.point")}
      </Typography>
    </Stage>
  );
}

/** Who has locked a vote — never who they picked. */
export function VotingScreen({ round, seats }: { round: Round; seats: SeatInfo[] }) {
  const { t } = useTranslation();
  const votes = round.votes ?? {};

  return (
    <Stage>
      <Typography variant="h2" sx={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}>
        {t("vote.heading")}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
        {seats.map((seat) => {
          const locked = votes[seat.id] !== undefined;
          return (
            <Box
              key={seat.id}
              sx={{
                px: 3,
                py: 2,
                minWidth: 150,
                fontFamily: font.mono,
                fontSize: "1.3rem",
                border: `2px solid ${
                  locked ? SEAT_COLORS[seat.color] : dim(SEAT_COLORS[seat.color], 50)
                }`,
                backgroundColor: locked ? SEAT_COLORS[seat.color] : "transparent",
                color: locked ? color.ink : dim(color.paper, 50),
              }}
            >
              {seat.name}
              {/* Quieter than the name, mixed toward whatever it sits on —
                  the seat's fill once locked, the ink field before. */}
              <Box
                sx={{
                  fontSize: "0.75rem",
                  color: locked
                    ? dim(color.ink, 85, SEAT_COLORS[seat.color])
                    : dim(color.paper, 42),
                }}
              >
                {locked ? t("vote.locked") : t("vote.thinking")}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Stage>
  );
}

/** Every vote at once, as arrows from voter to suspect. */
export function RevealScreen({
  round,
  seats,
  onDone,
}: {
  round: Round;
  seats: SeatInfo[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const votes = round.votes ?? {};
  const { counts } = tallyVotes(votes);
  const nameOf = (id: number) => seats.find((s) => s.id === id)?.name ?? `#${id}`;

  useEffect(() => {
    const timer = setTimeout(onDone, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Stage>
      <Typography variant="h2" sx={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}>
        {t("vote.revealHeading")}
      </Typography>
      <Box sx={{ display: "grid", gap: 1, fontFamily: font.mono, fontSize: "1.4rem" }}>
        {seats.map((seat) => (
          <Box key={seat.id} sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
            <Box component="span" sx={{ color: color.paper, minWidth: "8ch", textAlign: "right" }}>
              {seat.name}
            </Box>
            <Box component="span" sx={{ color: color.muted }}>→</Box>
            <Box component="span" sx={{ minWidth: "8ch", textAlign: "left" }}>
              {votes[seat.id] !== undefined ? nameOf(votes[seat.id]) : "—"}
            </Box>
            <Box component="span" sx={{ color: color.flame, fontSize: "0.9rem" }}>
              {counts[seat.id] ? `(${counts[seat.id]})` : ""}
            </Box>
          </Box>
        ))}
      </Box>
    </Stage>
  );
}

/** The caught Chameleon is guessing. The table waits. */
export function StealScreen({ round, seats }: { round: Round; seats: SeatInfo[] }) {
  const { t } = useTranslation();
  const name = seats.find((s) => s.id === round.chameleonId)?.name ?? "";

  return (
    <Stage>
      <Typography variant="h2" sx={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}>
        {t("steal.caught", { name })}
      </Typography>
      <Typography sx={{ color: color.muted, fontSize: "1.4rem" }}>
        {t("steal.guessing")}
      </Typography>
    </Stage>
  );
}

/**
 * Chameleon revealed — always — the Secret revealed, points, scoreboard, and
 * the render.
 *
 * The render lives here rather than on the canvas: the round is spent reading
 * code, and this is the first time anyone sees what they actually built. It's
 * the payoff, so it gets the reveal rather than a corner of the working screen.
 */
export function ResultScreen({
  round,
  seats,
  scores,
  finished,
  winnerIds,
  onNext,
}: {
  round: Round;
  seats: SeatInfo[];
  scores: Record<number, number>;
  finished: boolean;
  winnerIds?: number[];
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const outcome = round.outcome;
  const chameleon = seats.find((s) => s.id === round.chameleonId);
  const style = getStyle(round.styleId);
  const component = getComponent(round.componentId);
  const halves = outcome?.steal
    ? Number(outcome.steal.style) + Number(outcome.steal.component)
    : 0;

  const headline = !outcome
    ? ""
    : outcome.steal
      ? t(
          halves === 2 ? "result.stolen" : halves === 1 ? "result.half" : "result.guessedNothing",
          { name: chameleon?.name },
        )
      : outcome.tied
        ? t("result.tied", { name: chameleon?.name })
        : t("result.escaped", { name: chameleon?.name });

  return (
    <Stage>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "auto 1fr" },
          alignItems: "center",
          gap: { xs: 3, md: 5 },
        }}
      >
        <Box sx={{ width: { xs: "100%", md: 420 }, height: { xs: 220, md: 260 } }}>
          <RenderWindow tree={foldEdits(round.edits)} title={t("canvas.renderWindow")} />
        </Box>
        <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
          <Typography variant="caption" sx={{ color: color.muted, display: "block" }}>
            {t("result.theSecretWas")}
          </Typography>
          <Typography
            variant="h1"
            sx={{ fontSize: "clamp(1.6rem, 4vw, 3.2rem)", color: color.flame }}
          >
            {style ? t(style.labelKey) : round.styleId}
          </Typography>
          <Typography
            variant="h1"
            sx={{ fontSize: "clamp(1.6rem, 4vw, 3.2rem)", color: color.paper }}
          >
            {component ? t(component.labelKey) : round.componentId}
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontFamily: font.mono, fontSize: "clamp(1.1rem, 2.4vw, 1.8rem)" }}>
        {headline}
      </Typography>

      {round.stealGuess && halves < 2 && (
        <Typography sx={{ color: color.muted, fontFamily: font.mono }}>
          {t("result.guessed", {
            guess: [
              getStyle(round.stealGuess.styleId),
              getComponent(round.stealGuess.componentId),
            ]
              .map((card, i) =>
                card ? t(card.labelKey) : [round.stealGuess!.styleId, round.stealGuess!.componentId][i],
              )
              .join(" · "),
          })}
        </Typography>
      )}

      <Box sx={{ display: "grid", gap: 0.5, fontFamily: font.mono, fontSize: "1.3rem" }}>
        {[...seats]
          .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
          .map((seat) => {
            const gained = outcome?.awards?.[seat.id] ?? 0;
            const won = winnerIds?.includes(seat.id);
            return (
              <Box
                key={seat.id}
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  minWidth: 320,
                  px: 1.5,
                  py: 0.5,
                  borderLeft: `4px solid ${SEAT_COLORS[seat.color]}`,
                  backgroundColor: won ? color.flame : "transparent",
                  color: won ? color.ink : "inherit",
                }}
              >
                <Box component="span">{seat.name}</Box>
                <Box component="span">
                  {gained > 0 && (
                    <Box component="span" sx={{ color: color.flame, mr: 1.5 }}>
                      +{gained}
                    </Box>
                  )}
                  <strong>{scores[seat.id] ?? 0}</strong>
                </Box>
              </Box>
            );
          })}
      </Box>

      {finished ? (
        <Typography variant="h2" sx={{ fontSize: "clamp(1.6rem, 4vw, 3rem)" }}>
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
    </Stage>
  );
}
