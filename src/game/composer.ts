/**
 * The turn composer's rules.
 *
 * "Illegal moves are impossible by construction" is the design goal, and this
 * is where the construction lives: the UI can only offer what these functions
 * accept, and the submit control stays disabled until `isDraftSubmittable` is
 * true. The reason it matters isn't safety — the sandboxed stage handles that —
 * but signal. A typo renders nothing, and nothing is indistinguishable from a
 * deliberately vague play, so a bad value must never reach the log.
 */

import { getKeySchema } from "./content/keySchema";
import { isValidDeclaration, nativeSupports, type SupportsFn } from "./css";
import { TEXT_MAX_LENGTH } from "./constants";
import type { ComposerDraft, Edit, EditKind, ElementTarget, TextTarget } from "./types";

export type ComposerStep = "element" | "kind" | "key" | "value";

/** Tag and attribute names must be plain identifiers. */
const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/**
 * The log has four targets, but the canvas has two *things*. Each element owns
 * a text slot, so the composer asks for an element and then a kind — and a text
 * edit resolves to whichever slot belongs to that element.
 */
const TEXT_SLOT: Record<ElementTarget, TextTarget> = { outer: "label", inner: "text" };

/**
 * Which steps this draft has to walk. A tag edit's choice *is* its value and so
 * is a text edit's, so neither ever shows a key step.
 */
export function draftSteps(kind?: EditKind): ComposerStep[] {
  if (!kind) return ["element", "kind"];
  if (kind === "tag" || kind === "text") return ["element", "kind", "value"];
  return ["element", "kind", "key", "value"];
}

function isValidAttribute(key: string, value: string, supports: SupportsFn | null): boolean {
  if (!IDENTIFIER.test(key)) return false;

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
  const { element, kind, key } = draft;
  const value = draft.value?.trim() ?? "";

  if (!element || !value) return false;

  switch (kind) {
    case "text":
      return value.length <= TEXT_MAX_LENGTH;
    case "tag":
      return IDENTIFIER.test(value);
    case "attribute":
      return key ? isValidAttribute(key, value, supports) : false;
    case "style":
      return key ? isValidDeclaration(key, value, supports) : false;
    default:
      return false;
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
 */
export function draftToEdit(draft: ComposerDraft, meta: EditMeta): Edit {
  const { element, kind, key } = draft;
  const value = draft.value?.trim() ?? "";

  if (!element || !value) throw new Error("Draft is incomplete.");

  // A text edit lands on the slot belonging to the chosen element.
  if (kind === "text") return { ...meta, target: TEXT_SLOT[element], kind: "text", value };
  if (kind === "tag") return { ...meta, target: element, kind: "tag", value };
  if ((kind === "attribute" || kind === "style") && key) {
    return { ...meta, target: element, kind, key, value };
  }

  throw new Error("Draft is incomplete.");
}
