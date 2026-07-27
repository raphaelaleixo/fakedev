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
      case "attribute":
        tree[edit.target].attributes[edit.key] = edit.value;
        break;
      case "style":
        tree[edit.target].styles[edit.key] = edit.value;
        break;
    }
  }
  return tree;
}
