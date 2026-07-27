import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { inspectorLines } from "../../game/fold";
import { SEAT_COLORS } from "../../game/constants";
import type { Edit, EditTarget, InspectorLine, RenderTree, SeatColor } from "../../game/types";
import { color, font } from "../../theme/tokens";

export interface SeatInfo {
  id: number;
  name: string;
  color: SeatColor;
}

/**
 * The Live Inspector, modelled on the DevTools Styles pane — which already
 * solves this exact problem: it shows declarations grouped by the thing they
 * apply to, and strikes through the ones a later rule overrode. The game's
 * append-only log maps onto it one-for-one.
 *
 * Authorship is shown live rather than at resolution, which is faithful: at a
 * physical table you watch who picks up which pen.
 */

const TARGETS: EditTarget[] = ["outer", "label", "inner", "text"];

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
        border: `1px solid ${color.rule}`,
        backgroundColor: color.paper,
        fontFamily: font.mono,
        fontSize: "clamp(0.8rem, 1.15vw, 1.05rem)",
      }}
    >
      {TARGETS.map((target) => (
        <TargetGroup
          key={target}
          target={target}
          tree={tree}
          lines={lines.filter((line) => line.edit.target === target)}
          seatById={seatById}
          emptyLabel={t("inspector.untouched")}
        />
      ))}
    </Box>
  );
}

function TargetGroup({
  target,
  tree,
  lines,
  seatById,
  emptyLabel,
}: {
  target: EditTarget;
  tree: RenderTree;
  lines: InspectorLine[];
  seatById: Map<number, SeatInfo>;
  emptyLabel: string;
}) {
  const isElement = target === "outer" || target === "inner";
  // The base structure starts as two bare divs. Until someone spends a turn on
  // a tag edit, the element isn't a choice anyone made — so don't draw it as one.
  const tagChosen = lines.some((line) => line.edit.kind === "tag");

  return (
    <Box sx={{ borderBottom: `1px solid ${color.rule}` }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 1,
          px: 1.5,
          py: 0.75,
          backgroundColor: color.chrome,
        }}
      >
        <Box component="span" sx={{ color: color.muted }}>
          {target}
        </Box>
        {isElement && (
          <Box
            component="span"
            sx={{ color: tagChosen ? color.tag : color.muted, opacity: tagChosen ? 1 : 0.6 }}
          >
            &lt;{tree[target].tag}&gt;
          </Box>
        )}
      </Box>

      {lines.length === 0 ? (
        <Box sx={{ px: 1.5, py: 0.75, color: color.muted, fontStyle: "italic" }}>
          {emptyLabel}
        </Box>
      ) : (
        lines.map((line) => (
          <DeclarationLine key={line.edit.id} line={line} seat={seatById.get(line.edit.playerId)} />
        ))
      )}
    </Box>
  );
}

function DeclarationLine({ line, seat }: { line: InspectorLine; seat?: SeatInfo }) {
  const tint = seat ? SEAT_COLORS[seat.color] : color.muted;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 2,
        pl: 1.5,
        pr: 1.5,
        py: 0.4,
        borderLeft: `3px solid ${tint}`,
        opacity: line.superseded ? 0.45 : 1,
        textDecoration: line.superseded ? "line-through" : "none",
      }}
    >
      <Box sx={{ minWidth: 0, overflowX: "auto", whiteSpace: "pre" }}>
        <Declaration edit={line.edit} />
      </Box>
      <Box component="span" sx={{ color: tint, flexShrink: 0, fontSize: "0.8em" }}>
        {seat?.name ?? "—"}
      </Box>
    </Box>
  );
}

/**
 * Each edit kind is drawn the way DevTools draws that kind of thing: tags as
 * tags, attributes as name="value", CSS as property: value.
 */
function Declaration({ edit }: { edit: Edit }) {
  switch (edit.kind) {
    case "tag":
      return (
        <Box component="span" sx={{ color: color.tag }}>
          &lt;{edit.value}&gt;
        </Box>
      );
    case "attribute":
      return (
        <>
          <Box component="span" sx={{ color: color.attr }}>
            {edit.key}
          </Box>
          <Box component="span" sx={{ color: color.muted }}>
            =
          </Box>
          <Box component="span" sx={{ color: color.value }}>
            &quot;{edit.value}&quot;
          </Box>
        </>
      );
    case "style":
      return (
        <>
          <Box component="span" sx={{ color: color.attr }}>
            {edit.key}
          </Box>
          <Box component="span" sx={{ color: color.muted }}>
            :{" "}
          </Box>
          <Box component="span" sx={{ color: color.value }}>
            {edit.value}
          </Box>
          <Box component="span" sx={{ color: color.muted }}>
            ;
          </Box>
        </>
      );
    case "text":
      return (
        <Box component="span" sx={{ color: color.value }}>
          &quot;{edit.value}&quot;
        </Box>
      );
  }
}
