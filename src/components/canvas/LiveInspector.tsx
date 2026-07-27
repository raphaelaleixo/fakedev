import { Box } from "@mui/material";
import { slotHistories, type SlotHistory } from "../../game/fold";
import { SEAT_COLORS } from "../../game/constants";
import type {
  Edit,
  EditKind,
  ElementTarget,
  RenderTree,
  SeatColor,
  TextTarget,
} from "../../game/types";
import { color, font } from "../../theme/tokens";

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
 */
export default function LiveInspector({
  edits,
  tree,
  seats,
}: {
  edits: Edit[];
  tree: RenderTree;
  seats: SeatInfo[];
}) {
  const histories = slotHistories(edits);
  const seatById = new Map(seats.map((s) => [s.id, s]));

  const tint = (playerId: number) => {
    const seat = seatById.get(playerId);
    return seat ? SEAT_COLORS[seat.color] : color.muted;
  };
  const forElement = (element: ElementTarget, kind: EditKind) =>
    histories.filter((h) => h.target === element && h.kind === kind);
  const forText = (slot: TextTarget) => histories.filter((h) => h.target === slot);

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
      }}
    >
      <OpenTag element="outer" tree={tree} tint={tint} forElement={forElement} />

      {forText("label").map((history) => (
        <Line key={history.slot} indent={1}>
          <Value history={history} tint={tint} />
          <Overrides history={history} tint={tint} />
        </Line>
      ))}

      <OpenTag
        element="inner"
        tree={tree}
        tint={tint}
        forElement={forElement}
        indent={1}
        // Inner's text and closing tag share its line, the way a short element
        // gets written by hand.
        trailing={
          <>
            {forText("text").map((history) => (
              <Box component="span" key={history.slot}>
                <Value history={history} tint={tint} />
                <Overrides history={history} tint={tint} />
              </Box>
            ))}
            <Punct>{`</${tree.inner.tag}>`}</Punct>
          </>
        }
      />

      <Line>
        <Punct>{`</${tree.outer.tag}>`}</Punct>
      </Line>
    </Box>
  );
}

/**
 * The element's opening tag, on one line.
 *
 * It fits now: each declaration collapsed from three lines to one when the
 * opener and the answerer started sharing a line, so `style={ … }` stays short
 * enough to read across.
 */
function OpenTag({
  element,
  tree,
  tint,
  forElement,
  indent = 0,
  trailing,
}: {
  element: ElementTarget;
  tree: RenderTree;
  tint: (playerId: number) => string;
  forElement: (element: ElementTarget, kind: EditKind) => SlotHistory[];
  indent?: number;
  trailing?: React.ReactNode;
}) {
  const tags = forElement(element, "tag");
  const attributes = forElement(element, "attribute");
  const styles = forElement(element, "style");
  const named = tags[0];

  return (
    <Line indent={indent}>
      <Punct>&lt;</Punct>

      {/* Until someone spends a turn naming it, the div is nobody's choice. */}
      {named ? (
        <>
          <Value history={named} tint={tint} />
          <Overrides history={named} tint={tint} />
        </>
      ) : (
        <Box component="span" sx={{ color: color.inkPunct, opacity: 0.7 }}>
          {tree[element].tag}
        </Box>
      )}

      {styles.length > 0 && (
        <>
          <Punct> style={"{ "}</Punct>
          {styles.map((history, i) => (
            <Box component="span" key={history.slot}>
              <Box component="span" sx={{ color: tint(history.opened.playerId) }}>
                {history.key}
              </Box>
              <Punct>: </Punct>
              <Value history={history} tint={tint} />
              <Overrides history={history} tint={tint} />
              {i < styles.length - 1 && <Punct>; </Punct>}
            </Box>
          ))}
          <Punct>{" }"}</Punct>
        </>
      )}

      {attributes.map((history) => (
        <Box component="span" key={history.slot}>
          {" "}
          <Box component="span" sx={{ color: tint(history.opened.playerId) }}>
            {history.key}
          </Box>
          <Punct>=&quot;</Punct>
          <Value history={history} tint={tint} />
          <Punct>&quot;</Punct>
          <Overrides history={history} tint={tint} />
        </Box>
      ))}

      <Punct>&gt;</Punct>
      {trailing}
    </Line>
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
  return (
    <Box component="span" sx={{ color: tint(history.current.playerId) }}>
      {history.current.value}
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
    <Box component="span" sx={{ opacity: 0.6 }}>
      <Punct> /* </Punct>
      {history.overridden.map((edit, i) => (
        <Box component="span" key={edit.id} sx={{ color: tint(edit.playerId) }}>
          {edit.value}
          {i < history.overridden.length - 1 && <Punct>, </Punct>}
        </Box>
      ))}
      <Punct> */</Punct>
    </Box>
  );
}

function Punct({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" sx={{ color: color.inkPunct }}>
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
