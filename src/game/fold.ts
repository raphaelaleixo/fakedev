import type { Edit, EditSlot, EditTarget, InspectorLine, RenderTree } from "./types";

/**
 * The blank slate every round starts from: two bare boxes, no spans.
 *
 * A span only exists once somebody spends a turn putting text in its box, so
 * "nobody has added text" is a visible fact about the round rather than an
 * absence you have to infer.
 */
function baseTree(): RenderTree {
  return {
    outer: { styles: {} },
    "outer-text": { styles: {}, present: false },
    inner: { styles: {} },
    "inner-text": { styles: {}, present: false },
  };
}

/**
 * Left fold over the append-only edit log. Later edits win; nothing is removed
 * from the log itself — see `slotHistories` for the full story of a slot.
 */
export function foldEdits(edits: Edit[]): RenderTree {
  const tree = baseTree();

  for (const edit of edits) {
    if (edit.kind === "text") {
      tree[edit.target].present = true;
      continue;
    }
    // An opened-but-unanswered declaration is intent, not output — it belongs
    // on the inspector and nowhere near the render.
    if (edit.value !== undefined) tree[edit.target].styles[edit.key] = edit.value;
  }

  return tree;
}

/**
 * The last-write-wins identity of an edit. Two edits collide iff they produce
 * the same slot. A text move has no key, so its slot is target plus kind.
 */
export function editSlot(edit: Edit): EditSlot {
  return `${edit.target}|${edit.kind}|${edit.kind === "style" ? edit.key : ""}`;
}

/**
 * Projects the log into inspector lines, in order. An edit is marked superseded
 * when a later one takes its slot.
 */
export function inspectorLines(edits: Edit[]): InspectorLine[] {
  const winners = new Map<EditSlot, string>();
  for (const edit of edits) winners.set(editSlot(edit), edit.id);
  return edits.map((edit) => ({
    edit,
    superseded: winners.get(editSlot(edit)) !== edit.id,
  }));
}

/**
 * One declaration's whole story: who named it, who answered, and what got
 * overridden along the way.
 *
 * The inspector draws a line per declaration rather than per edit — the name in
 * the colour of whoever opened it, the value in the colour of whoever answered,
 * anything overridden trailing as a comment. That reads as one thought, shows
 * both people, and costs a line instead of three.
 */
export interface SlotHistory {
  slot: EditSlot;
  target: EditTarget;
  kind: Edit["kind"];
  /** Absent on a text move, which has no name of its own. */
  key?: string;
  /** The first edit for this slot — whoever named it. */
  opened: Edit;
  /** The winning valued edit, if anybody has answered yet. */
  current?: Edit;
  /** Earlier valued edits, oldest first. Never dropped. */
  overridden: Edit[];
}

const valueOf = (edit: Edit): string | undefined =>
  edit.kind === "style" ? edit.value : undefined;

/** Groups the log by slot, in the order the slots first appeared. */
export function slotHistories(edits: Edit[]): SlotHistory[] {
  const order: EditSlot[] = [];
  const bySlot = new Map<EditSlot, Edit[]>();

  for (const edit of edits) {
    const slot = editSlot(edit);
    if (!bySlot.has(slot)) {
      bySlot.set(slot, []);
      order.push(slot);
    }
    bySlot.get(slot)!.push(edit);
  }

  return order.map((slot) => {
    const history = bySlot.get(slot)!;
    const valued = history.filter((edit) => valueOf(edit) !== undefined);
    return {
      slot,
      target: history[0].target,
      kind: history[0].kind,
      key: history[0].kind === "style" ? history[0].key : undefined,
      opened: history[0],
      current: valued.at(-1),
      overridden: valued.slice(0, -1),
    };
  });
}
