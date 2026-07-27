import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { inspectorLines } from "../../game/fold";
import { SEAT_COLORS } from "../../game/constants";
import type {
  Edit,
  EditTarget,
  ElementTarget,
  InspectorLine,
  RenderTree,
  SeatColor,
} from "../../game/types";
import { color, font } from "../../theme/tokens";

export interface SeatInfo {
  id: number;
  name: string;
  color: SeatColor;
}

/**
 * The Live Inspector — the dark source pane beside the bright render window.
 *
 * Split the way DevTools splits: the **markup line** is the element as it
 * currently stands — tag, attributes, text — and the **box beneath it** holds
 * the CSS. That's the same shape as the Elements panel over the Styles pane,
 * and it's the shape the composer already implies, since element, attribute and
 * text edits all change the markup while a declaration doesn't.
 *
 * Authorship is shown live rather than at resolution, which is faithful: at a
 * physical table you watch who picks up which pen. Each edit is *written in its
 * author's colour* — so the markup line reads as who-wrote-what at a glance,
 * which is the game-relevant question. Punctuation stays muted so the shape of
 * the markup survives underneath.
 *
 * Nothing is ever removed. An edit that a later one overrode drops out of the
 * markup line and reappears in the box, struck through — so the box is the CSS
 * plus the history of everything superseded.
 */

/** Two groups, because the canvas has two things. */
const ELEMENTS: ElementTarget[] = ["outer", "inner"];

/** The log target a text edit on this element lands on. */
const TEXT_SLOT: Record<ElementTarget, EditTarget> = { outer: "label", inner: "text" };

export default function LiveInspector({
  edits,
  tree,
  seats,
}: {
  edits: Edit[];
  tree: RenderTree;
  seats: SeatInfo[];
}) {
  const { t } = useTranslation();
  const lines = inspectorLines(edits);
  const seatById = new Map(seats.map((s) => [s.id, s]));

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        border: `1px solid ${color.inkRule}`,
        backgroundColor: color.inkPanel,
        fontFamily: font.mono,
        fontSize: "clamp(0.8rem, 1.15vw, 1.05rem)",
      }}
    >
      {ELEMENTS.map((element) => (
        <ElementGroup
          key={element}
          element={element}
          tree={tree}
          lines={lines.filter(
            (line) =>
              line.edit.target === element || line.edit.target === TEXT_SLOT[element],
          )}
          seatById={seatById}
          emptyLabel={t("inspector.untouched")}
        />
      ))}
    </Box>
  );
}

function ElementGroup({
  element,
  tree,
  lines,
  seatById,
  emptyLabel,
}: {
  element: ElementTarget;
  tree: RenderTree;
  lines: InspectorLine[];
  seatById: Map<number, SeatInfo>;
  emptyLabel: string;
}) {
  const live = lines.filter((line) => !line.superseded);
  const tagLine = live.find((line) => line.edit.kind === "tag");
  const textLine = live.find((line) => line.edit.kind === "text");
  const attributeLines = live.filter((line) => line.edit.kind === "attribute");

  // The box carries the CSS, and the history of anything overridden.
  const boxed = lines.filter((line) => line.superseded || line.edit.kind === "style");

  return (
    <Box sx={{ borderBottom: `1px solid ${color.inkRule}` }}>
      <Box
        sx={{
          px: 1.5,
          py: 1,
          backgroundColor: color.ink,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {/* Which of the two things this is — the composer's word for it. */}
        <Box
          component="span"
          sx={{ color: color.inkPunct, mr: 1.5, fontSize: "0.8em", letterSpacing: "0.08em" }}
        >
          {element}
        </Box>
        <Punct>&lt;</Punct>
        {/* Until someone spends a turn on a tag, the div is nobody's choice. */}
        <Box
          component="span"
          sx={{
            color: tagLine ? tintOf(seatById.get(tagLine.edit.playerId)) : color.inkPunct,
            opacity: tagLine ? 1 : 0.7,
          }}
        >
          {tree[element].tag}
        </Box>

        {attributeLines.map((line) => {
          const edit = line.edit;
          if (edit.kind !== "attribute") return null;
          return (
            <Box component="span" key={edit.id} sx={{ color: tintOf(seatById.get(edit.playerId)) }}>
              {" "}
              {edit.key}
              <Punct>=</Punct>
              &quot;{edit.value}&quot;
            </Box>
          );
        })}

        <Punct>&gt;</Punct>

        {textLine && (
          <Box component="span" sx={{ color: tintOf(seatById.get(textLine.edit.playerId)) }}>
            {textLine.edit.value}
          </Box>
        )}
      </Box>

      {boxed.length === 0 ? (
        <Box sx={{ px: 1.5, py: 0.75, color: color.inkPunct, fontStyle: "italic" }}>
          {emptyLabel}
        </Box>
      ) : (
        boxed.map((line) => (
          <DeclarationLine key={line.edit.id} line={line} seat={seatById.get(line.edit.playerId)} />
        ))
      )}
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

/** A seat's colour, or a neutral when the author is unknown. */
function tintOf(seat?: SeatInfo): string {
  return seat ? SEAT_COLORS[seat.color] : color.muted;
}

function DeclarationLine({ line, seat }: { line: InspectorLine; seat?: SeatInfo }) {
  const tint = tintOf(seat);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 2,
        px: 1.5,
        py: 0.4,
        // No rule down the side: the declaration is already written in its
        // author's colour, so a bar would say the same thing twice.
        opacity: line.superseded ? 0.4 : 1,
        textDecoration: line.superseded ? "line-through" : "none",
      }}
    >
      <Box sx={{ minWidth: 0, overflowX: "auto", whiteSpace: "pre", color: tint }}>
        <Declaration edit={line.edit} />
      </Box>
      <Box component="span" sx={{ color: tint, flexShrink: 0, fontSize: "0.8em", opacity: 0.75 }}>
        {seat?.name ?? "—"}
      </Box>
    </Box>
  );
}

/**
 * The edit itself, inheriting its author's colour from the line. Only the
 * punctuation is muted — that's what keeps `property: value;` legible as a
 * shape once the hue is carrying authorship instead of syntax.
 */
function Declaration({ edit }: { edit: Edit }) {
  switch (edit.kind) {
    case "tag":
      return (
        <>
          <Punct>&lt;</Punct>
          {edit.value}
          <Punct>&gt;</Punct>
        </>
      );
    case "attribute":
      return (
        <>
          {edit.key}
          <Punct>=</Punct>
          &quot;{edit.value}&quot;
        </>
      );
    case "style":
      return (
        <>
          {edit.key}
          <Punct>: </Punct>
          {edit.value}
          <Punct>;</Punct>
        </>
      );
    case "text":
      return <>&quot;{edit.value}&quot;</>;
  }
}
