/**
 * The turn composer's rules.
 *
 * A turn does exactly one of three things:
 *
 *  - **opens a declaration** by naming a property. Intent with no execution:
 *    `border-radius` says "this thing is rounded" and commits to nothing else.
 *  - **answers a declaration** with a value — one that's open, or one already
 *    set, which makes overriding a one-turn move.
 *  - **adds text** to a box, which creates its span. There is no content to
 *    choose; what you pick is *where* copy goes. The move pays forward, since
 *    the span it creates is a new element for everybody else to style.
 *
 * That split is the point: the interesting decision each turn is whether to
 * answer somebody else's opening or start your own, which is the paper game's
 * extend-a-stroke-or-start-fresh tension.
 *
 * There is no tag move and no attribute move — see `EditKind` for why.
 */

import { isValidDeclaration, nativeSupports, type SupportsFn } from "./css";
import { TEXT_OF, type BoxTarget, type ComposerDraft, type ComposerMove, type Edit, type EditTarget } from "./types";

export type ComposerStep = "target" | "move" | "key" | "slot" | "value";

/** Property names must be plain identifiers. */
const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9-]*$/;

const BOXES: BoxTarget[] = ["outer", "inner"];

const isBox = (target: EditTarget): target is BoxTarget =>
  target === "outer" || target === "inner";

/**
 * Everything there is to play on, in document order.
 *
 * A span isn't a target until its text move has been played, so the board opens
 * up as the round goes on rather than offering four empty things at turn one.
 */
export function availableTargets(edits: Edit[]): EditTarget[] {
  const spans = new Set(edits.filter((e) => e.kind === "text").map((e) => e.target));
  return BOXES.flatMap((box) =>
    spans.has(TEXT_OF[box]) ? [box, TEXT_OF[box] as EditTarget] : [box],
  );
}

/** Which steps this move has to walk. */
export function draftSteps(move?: ComposerMove): ComposerStep[] {
  if (!move) return ["target", "move"];
  // Nothing to choose: the copy is fixed and the span is implied by the box.
  if (move === "text") return ["target", "move"];
  if (move === "value") return ["target", "move", "slot", "value"];
  return ["target", "move", "key"];
}

export function isDraftSubmittable(
  draft: ComposerDraft,
  supports: SupportsFn | null = nativeSupports(),
): boolean {
  const { target, move, key } = draft;
  const value = draft.value?.trim() ?? "";

  if (!target || !move) return false;

  switch (move) {
    // A span already holds the only copy there is.
    case "text":
      return isBox(target);
    // Opening: a name, and it has to be one somebody could actually answer.
    case "style":
      return Boolean(key) && IDENTIFIER.test(key!) && isValidDeclaration(key!, "initial", supports);
    case "value":
      return Boolean(key) && Boolean(value) && isValidDeclaration(key!, value, supports);
  }
}

export interface EditMeta {
  id: string;
  playerId: number;
  turnIndex: number;
}

/**
 * Freezes a completed draft into a log entry. Values are trimmed — trailing
 * space is invisible on the inspector, and it would let two identical-looking
 * edits occupy different slots.
 *
 * An opening carries no `value` at all, which is what keeps it out of the fold.
 */
export function draftToEdit(draft: ComposerDraft, meta: EditMeta): Edit {
  const { target, move, key } = draft;
  const value = draft.value?.trim() ?? "";
  const incomplete = () => new Error("Draft is incomplete.");

  if (!target || !move) throw incomplete();

  switch (move) {
    case "text":
      if (!isBox(target)) throw incomplete();
      return { ...meta, target: TEXT_OF[target], kind: "text" };
    case "style":
      if (!key) throw incomplete();
      return { ...meta, target, kind: "style", key };
    case "value":
      if (!key || !value) throw incomplete();
      return { ...meta, target, kind: "style", key, value };
  }
}
