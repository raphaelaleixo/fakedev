import type { ComponentProps } from "react";
import { Box } from "@mui/material";
import { slotHistories, type SlotHistory } from "../../game/fold";
import ColorSwatch from "../ColorSwatch";
import { SEAT_COLORS } from "../../game/constants";
import { LOREM } from "../../game/constants";
import type { Edit, EditTarget, RenderTree, SeatColor } from "../../game/types";
import { color, dim, font } from "../../theme/tokens";

export interface SeatInfo {
  id: number;
  name: string;
  color: SeatColor;
}

/**
 * The Live Inspector — the canvas for the whole round.
 *
 * It draws the actual DOM, nested and indented, rather than a list of edits
 * about it. A blank round is two empty divs; by the end it's a component you
 * can read top to bottom. Nesting is real information and no list shows it.
 *
 * Everything is a div or a span — no tags to choose, no attributes to set — so
 * every shape on screen was drawn by somebody with CSS. A span appears only
 * once its text move has been played.
 *
 * **A declaration is one line carrying two people.** The name is the colour of
 * whoever opened it, the value the colour of whoever answered — so
 * `display: flex;` shows Rafa asked and Ana replied, in one line rather than
 * three. Punctuation stays muted so the markup keeps its shape underneath.
 *
 * Nothing is ever removed. An overridden value trails as a comment in its own
 * author's colour, which reads better than a strikethrough and costs no line.
 *
 * No author names here — the turn rail above carries the name-to-colour
 * mapping, and repeating it on every declaration would drown the code.
 *
 * Colour values get a swatch beside them, the way DevTools previews one. That
 * keeps "who used the ugly green" a usable clue now that the render only
 * appears at resolution.
 */
export default function LiveInspector({
  edits,
  tree,
  seats,
  sx,
}: {
  edits: Edit[];
  tree: RenderTree;
  seats: SeatInfo[];
  /** The defaults below are sized for a TV; the rules page wants it small. */
  sx?: ComponentProps<typeof Box>["sx"];
}) {
  const histories = slotHistories(edits);
  const seatById = new Map(seats.map((s) => [s.id, s]));

  const tint = (playerId: number) => {
    const seat = seatById.get(playerId);
    return seat ? SEAT_COLORS[seat.color] : color.muted;
  };
  const forTarget = (target: EditTarget) =>
    histories.filter((h) => h.target === target && h.kind === "style");

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        p: { xs: 2, md: 3 },
        border: `1px solid ${color.inkRule}`,
        backgroundColor: color.inkPanel,
        fontFamily: font.mono,
        fontSize: "clamp(0.9rem, 1.5vw, 1.5rem)",
        lineHeight: 1.8,
        ...sx,
      }}
    >
      <OpenTag tag="div" declarations={forTarget("outer")} tint={tint} />
      <Span present={tree["outer-text"].present} declarations={forTarget("outer-text")} tint={tint} indent={1} />
      <OpenTag tag="div" declarations={forTarget("inner")} tint={tint} indent={1} />
      <Span present={tree["inner-text"].present} declarations={forTarget("inner-text")} tint={tint} indent={2} />
      <Line indent={1}>
        <Punct>&lt;/div&gt;</Punct>
      </Line>
      <Line>
        <Punct>&lt;/div&gt;</Punct>
      </Line>
    </Box>
  );
}

/** A box's opening tag, on one line. */
function OpenTag({
  tag,
  declarations,
  tint,
  indent = 0,
}: {
  tag: string;
  declarations: SlotHistory[];
  tint: (playerId: number) => string;
  indent?: number;
}) {
  return (
    <Line indent={indent}>
      <Punct>&lt;{tag}</Punct>
      <StyleBlock declarations={declarations} tint={tint} />
      <Punct>&gt;</Punct>
    </Line>
  );
}

/**
 * A span, which only exists once somebody has played the text move on its box.
 * Until then the slot is genuinely empty — and that emptiness is information.
 */
function Span({
  present,
  declarations,
  tint,
  indent,
}: {
  present: boolean;
  declarations: SlotHistory[];
  tint: (playerId: number) => string;
  indent: number;
}) {
  if (!present) return null;
  return (
    <Line indent={indent}>
      <Punct>&lt;span</Punct>
      <StyleBlock declarations={declarations} tint={tint} />
      <Punct>&gt;</Punct>
      <Box component="span" sx={{ color: color.muted }}>
        {LOREM}
      </Box>
      <Punct>&lt;/span&gt;</Punct>
    </Line>
  );
}

function StyleBlock({
  declarations,
  tint,
}: {
  declarations: SlotHistory[];
  tint: (playerId: number) => string;
}) {
  if (declarations.length === 0) return null;
  return (
    <>
      <Punct> style={"{ "}</Punct>
      {declarations.map((history, i) => (
        <Box component="span" key={history.slot}>
          <Box component="span" sx={{ color: tint(history.opened.playerId) }}>
            {history.key}
          </Box>
          <Punct>: </Punct>
          <Value history={history} tint={tint} />
          <Overrides history={history} tint={tint} />
          {i < declarations.length - 1 && <Punct>; </Punct>}
        </Box>
      ))}
      <Punct>{" }"}</Punct>
    </>
  );
}

/** The winning value, in the colour of whoever answered. */
function Value({
  history,
  tint,
}: {
  history: SlotHistory;
  tint: (playerId: number) => string;
}) {
  // Nobody has answered yet. The gap is the move, so it gets drawn.
  if (!history.current) return <Punct>…</Punct>;
  const value = (history.current.kind === "style" && history.current.value) || "";
  return (
    <Box component="span" sx={{ color: tint(history.current.playerId) }}>
      <ColorSwatch value={value} />
      {value}
    </Box>
  );
}

/**
 * What this declaration used to be. A comment rather than a strikethrough —
 * same information, one line instead of two, and it still says who.
 */
function Overrides({
  history,
  tint,
}: {
  history: SlotHistory;
  tint: (playerId: number) => string;
}) {
  if (history.overridden.length === 0) return null;
  return (
    // Dimmed per span rather than on the wrapper: these are tinted by author,
    // and who wrote a superseded value is exactly what the comment is for.
    <Box component="span">
      <Punct faint> /* </Punct>
      {history.overridden.map((edit, i) => (
        <Box component="span" key={edit.id} sx={{ color: dim(tint(edit.playerId), 60) }}>
          <ColorSwatch value={(edit.kind === "style" && edit.value) || ""} />
          {edit.kind === "style" && edit.value}
          {i < history.overridden.length - 1 && <Punct faint>, </Punct>}
        </Box>
      ))}
      <Punct faint> */</Punct>
    </Box>
  );
}

function Punct({ children, faint }: { children: React.ReactNode; faint?: boolean }) {
  return (
    <Box component="span" sx={{ color: faint ? dim(color.inkPunct, 60) : color.inkPunct }}>
      {children}
    </Box>
  );
}

function Line({ indent = 0, children }: { indent?: number; children: React.ReactNode }) {
  return (
    <Box sx={{ pl: `${indent * 2}ch`, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {children}
    </Box>
  );
}
