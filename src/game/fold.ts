import type { Edit, EditSlot, InspectorLine, RenderTree } from "./types";

/**
 * The last-write-wins identity of an edit. Two edits collide iff they produce
 * the same slot. Tag and text edits have no key, so their slot is just
 * target + kind.
 */
export function editSlot(edit: Edit): EditSlot {
  const key = edit.kind === "attribute" || edit.kind === "style" ? edit.key : "";
  return `${edit.target}|${edit.kind}|${key}`;
}

/**
 * Projects the log into inspector lines. Every edit survives in order — an
 * edit is marked superseded when a later one takes its slot, and gets drawn
 * struck through rather than removed.
 */
export function inspectorLines(edits: Edit[]): InspectorLine[] {
  const winners = new Map<EditSlot, string>();
  for (const edit of edits) winners.set(editSlot(edit), edit.id);
  return edits.map((edit) => ({
    edit,
    superseded: winners.get(editSlot(edit)) !== edit.id,
  }));
}

/** The blank slate every round starts from. */
function baseTree(): RenderTree {
  return {
    outer: { tag: "div", attributes: {}, styles: {} },
    inner: { tag: "div", attributes: {}, styles: {} },
    label: "",
    text: "",
  };
}

/**
 * Left fold over the append-only edit log. Later edits win; nothing is removed
 * from the log itself — see `inspectorLines` for the superseded history.
 */
export function foldEdits(edits: Edit[]): RenderTree {
  const tree = baseTree();
  for (const edit of edits) {
    switch (edit.kind) {
      case "text":
        tree[edit.target] = edit.value;
        break;
      case "tag":
        tree[edit.target].tag = edit.value;
        break;
      // An opened-but-unvalued declaration is intent, not output — it belongs
      // on the inspector and nowhere near the render.
      case "attribute":
        if (edit.value !== undefined) tree[edit.target].attributes[edit.key] = edit.value;
        break;
      case "style":
        if (edit.value !== undefined) tree[edit.target].styles[edit.key] = edit.value;
        break;
    }
  }
  return tree;
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
  target: Edit["target"];
  kind: Edit["kind"];
  /** Absent for tags and text, which have no name of their own. */
  key?: string;
  /** The first edit for this slot — whoever named it. */
  opened: Edit;
  /** The winning valued edit, if anybody has answered yet. */
  current?: Edit;
  /** Earlier valued edits, oldest first. Never dropped. */
  overridden: Edit[];
}

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
    const valued = history.filter((edit) => edit.value !== undefined);
    return {
      slot,
      target: history[0].target,
      kind: history[0].kind,
      key: "key" in history[0] ? history[0].key : undefined,
      opened: history[0],
      current: valued.at(-1),
      overridden: valued.slice(0, -1),
    };
  });
}
