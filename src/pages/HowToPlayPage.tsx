import type { ComponentProps, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Link, Stack, Typography } from "@mui/material";
import PageShell from "../components/PageShell";
import LiveInspector, { type SeatInfo } from "../components/canvas/LiveInspector";
import { foldEdits } from "../game/fold";
import { seatColorFor } from "../game/match";
import type { Edit } from "../game/types";
import { color, font } from "../theme/tokens";

/**
 * The rules, in the shape the paper game states them: a run of short
 * paragraphs, no headings, no table. Sections and a scoring grid made this read
 * like a manual, and nobody reads a manual at a party — the original explains
 * itself in seven sentences and it is the better model.
 *
 * The one thing kept beyond prose is the sample board. Everybody already knows
 * what drawing a stroke looks like; "one CSS edit" needs showing once — and it
 * is the real `LiveInspector` over a handful of edits rather than a picture of
 * one, so what the rules promise and what the game draws cannot drift, and the
 * sentence about author colours proves itself.
 */
export default function HowToPlayPage() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 7 } }}>
        <Typography variant="h3" component="h1">
          {t("howToPlay.title")}
        </Typography>

        <Lede>{t("howToPlay.goal")}</Lede>

        {/* Setup: what you need, then what you are told. Both at full strength
            and both early — the line a host acts on was muted at the foot of
            the page, which dressed it as an afterthought and left the page
            ending on setup rather than on the win condition. */}
        <P sx={{ mt: 1.5 }}>{t("howToPlay.table")}</P>
        <P sx={{ mt: 1.5 }}>{t("howToPlay.secret")}</P>

        {/* Setup, play, win — three groups, with the sentences inside each kept
            tight and real space between them. Evenly spaced paragraphs read as
            a list; a rules page wants to read as a sequence.

            A group of one is not a group: once the Secret and what the
            Chameleon sees became a single paragraph, giving it beat-level air
            on both sides made an ordinary rule look pulled out for emphasis.
            It sits with the setup instead.

            Turning and voting are one paragraph, as they are in the paper
            game: the vote is not a separate phase you decide to enter, it is
            what happens when the turns run out. */}
        {/* The aim comes before the mechanic. Knowing you take one turn is
            useless until you know what you are aiming at — and what you are
            aiming at is the whole game: the board only has to *look* like the
            Secret, and only just enough. */}
        <Beat>
          <P>{t("howToPlay.aim")}</P>
          <P>{t("howToPlay.turns")}</P>
          <P>{t("howToPlay.board")}</P>
        </Beat>

        {/* Outside the beat, not the last line of it. A Stack spaces its own
            children with `> :nth-child(n+2)`, which outranks anything a child
            sets on itself — so the board's margin only takes effect once it
            stops being one of them. */}
        <Sample />

        <Beat>
          <P>{t("howToPlay.escape")}</P>
          <P>{t("howToPlay.steal")}</P>
        </Beat>

        {/* The win condition is the punchline, so it lands on its own — and in
            the same voice the page opened in. */}
        <Typography sx={{ ...statementSx, mt: 6 }}>{t("howToPlay.points")}</Typography>

        <Link
          component={RouterLink}
          to="/"
          viewTransition
          sx={{
            display: "inline-block",
            mt: 5,
            fontFamily: font.prose,
            color: color.flame,
            textDecorationColor: "currentColor",
            textUnderlineOffset: "0.2em",
          }}
        >
          {t("howToPlay.back")}
        </Link>
      </Container>
    </PageShell>
  );
}

const bodySx = {
  fontFamily: font.prose,
  fontSize: "1.05rem",
  lineHeight: 1.65,
  color: color.paper,
} as const;

function P({ children, sx }: { children: ReactNode; sx?: ComponentProps<typeof Typography>["sx"] }) {
  return <Typography sx={{ ...bodySx, ...sx }}>{children}</Typography>;
}

/**
 * The two sentences that bookend the rules — the premise and the win condition
 * — in the display face. Everything between them is prose, so the pair reads as
 * the frame around the rules rather than as the first and last of them.
 */
const statementSx = {
  fontFamily: font.display,
  fontWeight: 600,
  fontSize: "1.5rem",
  lineHeight: 1.25,
  color: color.paper,
} as const;

function Lede({ children }: { children: ReactNode }) {
  return <Typography sx={{ ...statementSx, mt: 3 }}>{children}</Typography>;
}

/** Sentences that answer each other, spaced tighter than the gap around them. */
function Beat({ children }: { children: ReactNode }) {
  return (
    <Stack spacing={1.25} sx={{ mt: 5 }}>
      {children}
    </Stack>
  );
}

/**
 * Three players, nine edits, one property left unanswered.
 *
 * Enough to show what the sentences above describe: a declaration is opened by
 * one person and answered by another, so a line carries two colours; a text
 * move buys a span to style; and a property nobody answered sits there with a
 * gap where its value should be.
 */
const SAMPLE_SEATS: SeatInfo[] = [1, 2, 3].map((id) => ({
  id,
  name: `Dev${id}`,
  color: seatColorFor(id),
}));

/** Omit must distribute over the Edit union, or it collapses to the shared keys. */
type EditBody = Edit extends infer T
  ? T extends Edit
    ? Omit<T, "id" | "playerId" | "turnIndex">
    : never
  : never;

const at = (turnIndex: number, playerId: number, body: EditBody): Edit =>
  ({ id: `rules-${turnIndex}`, playerId, turnIndex, ...body }) as Edit;

const SAMPLE_EDITS: Edit[] = [
  at(0, 1, { target: "outer", kind: "style", key: "display" }),
  at(1, 2, { target: "outer", kind: "style", key: "display", value: "flex" }),
  at(2, 3, { target: "outer", kind: "style", key: "padding" }),
  at(3, 1, { target: "outer", kind: "style", key: "padding", value: "20px" }),
  at(4, 2, { target: "inner-text", kind: "text" }),
  at(5, 3, { target: "inner", kind: "style", key: "background-color" }),
  at(6, 1, { target: "inner", kind: "style", key: "background-color", value: "#1a73e8" }),
  at(7, 2, { target: "inner-text", kind: "style", key: "color", value: "#ffffff" }),
  at(8, 3, { target: "inner", kind: "style", key: "border-radius" }),
];

function Sample() {
  return (
    <LiveInspector
      edits={SAMPLE_EDITS}
      tree={foldEdits(SAMPLE_EDITS)}
      seats={SAMPLE_SEATS}
      sx={{ mt: 3, height: "auto", fontSize: "0.85rem", lineHeight: 1.7, p: 2 }}
    />
  );
}
