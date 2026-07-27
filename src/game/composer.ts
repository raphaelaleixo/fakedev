/**
 * The turn composer's rules.
 *
 * A turn does exactly one of three things:
 *
 *  - **plays a single token** — the element's tag, or its text. Neither has a
 *    name/value split, so neither costs two turns.
 *  - **opens a declaration** by naming an attribute or a property. Intent with
 *    no execution: `border-radius` says "this thing is rounded" and commits to
 *    nothing else. It shows on the inspector and stays out of the render.
 *  - **answers a declaration** with a value — one that's open, or one already
 *    set, which makes overriding a one-turn move.
 *
 * That split is the point of the whole thing: the interesting decision each
 * turn is whether to answer somebody else's opening or start your own, which is
 * the paper game's extend-a-stroke-or-start-fresh tension.
 *
 * "Illegal moves are impossible by construction" is the design goal, and this
 * is where the construction lives: the UI can only offer what these accept, and
 * the commit control stays disabled until `isDraftSubmittable` is true. Not for
 * safety — the sandboxed stage handles that — but for signal. A typo renders
 * nothing, and nothing is indistinguishable from a deliberately vague play.
 */

import { getKeySchema } from "./content/keySchema";
import { isValidDeclaration, nativeSupports, type SupportsFn } from "./css";
import { TEXT_MAX_LENGTH } from "./constants";
import type {
  ComposerDraft,
  ComposerMove,
  Edit,
  ElementTarget,
  TextTarget,
} from "./types";

export type ComposerStep = "element" | "move" | "key" | "slot" | "value";

/** Tag and attribute names must be plain identifiers. */
const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/**
 * The log has four targets, but the canvas has two *things*. Each element owns
 * a text slot, so the composer asks for an element and then a move.
 */
const TEXT_SLOT: Record<ElementTarget, TextTarget> = { outer: "label", inner: "text" };

/** Which steps this move has to walk. */
export function draftSteps(move?: ComposerMove): ComposerStep[] {
  if (!move) return ["element", "move"];
  if (move === "tag" || move === "text") return ["element", "move", "value"];
  // Naming a declaration ends the turn. Answering it is somebody's next move.
  if (move === "value") return ["element", "move", "slot", "value"];
  return ["element", "move", "key"];
}

function isValidAttributeValue(
  key: string,
  value: string,
  supports: SupportsFn | null,
): boolean {
  const schema = getKeySchema("attribute", key);
  // Unlisted attributes fall through to the same free-text rules as the rest.
  if (!schema) return value.length <= TEXT_MAX_LENGTH;

  switch (schema.valueType) {
    case "boolean":
      return value === "true" || value === "false";
    case "enum":
      return (schema.options ?? []).some((option) => option.value === value);
    case "freetext":
      return value.length <= (schema.maxLength ?? TEXT_MAX_LENGTH);
    default:
      return isValidDeclaration(key, value, supports);
  }
}

export function isDraftSubmittable(
  draft: ComposerDraft,
  supports: SupportsFn | null = nativeSupports(),
): boolean {
  const { element, move, key, slotKind } = draft;
  const value = draft.value?.trim() ?? "";

  if (!element || !move) return false;

  switch (move) {
    case "text":
      return value.length > 0 && value.length <= TEXT_MAX_LENGTH;

    case "tag":
      return IDENTIFIER.test(value);

    // Opening: a name, and nothing else. It has to be a name somebody could
    // actually answer, or the turn is spent on a dead end.
    case "attribute":
      return Boolean(key) && IDENTIFIER.test(key!);
    case "style":
      return Boolean(key) && IDENTIFIER.test(key!) && isValidDeclaration(key!, "initial", supports);

    case "value":
      if (!key || !slotKind || !value) return false;
      return slotKind === "attribute"
        ? isValidAttributeValue(key, value, supports)
        : isValidDeclaration(key, value, supports);
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
  const { element, move, key, slotKind } = draft;
  const value = draft.value?.trim() ?? "";
  const incomplete = () => new Error("Draft is incomplete.");

  if (!element || !move) throw incomplete();

  switch (move) {
    case "text":
      if (!value) throw incomplete();
      return { ...meta, target: TEXT_SLOT[element], kind: "text", value };

    case "tag":
      if (!value) throw incomplete();
      return { ...meta, target: element, kind: "tag", value };

    case "attribute":
    case "style":
      if (!key) throw incomplete();
      return { ...meta, target: element, kind: move, key };

    case "value":
      if (!key || !slotKind || !value) throw incomplete();
      return { ...meta, target: element, kind: slotKind, key, value };
  }
}
