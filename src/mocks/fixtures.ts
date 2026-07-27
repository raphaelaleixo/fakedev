import type { Edit, Round } from "../game/types";
import type { SeatInfo } from "../components/canvas/LiveInspector";
import { seatColorFor } from "../game/match";

/**
 * A round mid-build, for developing the canvas without a live room.
 *
 * **This fixture deliberately models good play, and good play is ambiguous.**
 * The whole tension of the game is that a Dev must prove they know the Secret
 * without making it obvious enough for the Chameleon to name it. A board that
 * reads instantly as one specific card is a board where the Devs have already
 * lost — so a fixture that looks like that would teach us the wrong thing about
 * whether the canvas works.
 *
 * The Secret here is Cookie Consent Banner, but what renders is a small white
 * card with copy and one blue affordance. That is honestly *any* of the five
 * cards in the `consent-prompt` group — CAPTCHA Box, Push Notification Prompt,
 * Location Permission Prompt and Survey Invitation would all look like this at
 * this stage. It makes sense as a component; it does not announce itself.
 *
 * The label is lorem ipsum on purpose: it commits to body copy of a certain
 * length without committing to what the copy says. Structural signal, zero
 * semantic leak.
 *
 * Turn 6 sets the button green and turn 9 overrides it to blue, so the
 * inspector has a real superseded line rather than a staged one.
 */

const NAMES = ["Rafa", "Ana", "Tom", "Ines", "Joost"];

export const MOCK_SEATS: SeatInfo[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  color: seatColorFor(i + 1),
}));

/** Omit must distribute over the Edit union, or it collapses to the shared keys. */
type EditBody = Edit extends infer T
  ? T extends Edit
    ? Omit<T, "id" | "playerId" | "turnIndex">
    : never
  : never;

const edit = (turnIndex: number, playerId: number, body: EditBody): Edit =>
  ({ id: `mock-${turnIndex}`, playerId, turnIndex, ...body }) as Edit;

export const MOCK_EDITS: Edit[] = [
  edit(0, 1, { target: "outer", kind: "style", key: "display", value: "flex" }),
  edit(1, 2, { target: "outer", kind: "style", key: "padding", value: "20px" }),
  edit(2, 3, { target: "outer", kind: "style", key: "background-color", value: "#ffffff" }),
  // Choosing the component is a whole turn, same as any other edit.
  edit(3, 4, { target: "inner", kind: "tag", value: "button" }),
  edit(4, 5, {
    target: "outer",
    kind: "style",
    key: "box-shadow",
    value: "0 8px 24px rgba(32, 33, 36, 0.2)",
  }),
  // Signals the *shape* — body copy lives here, about this long — without
  // leaking what it says. Safe on this card and a real bet on others: half the
  // deck wants these slots empty, and lorem ipsum on a Skeleton Loader would
  // give the player away instantly.
  edit(5, 1, { target: "label", kind: "text", value: "Lorem ipsum dolor sit" }),
  // Superseded by turn 9 — this is the strikethrough case.
  edit(6, 2, { target: "inner", kind: "style", key: "background-color", value: "#34a853" }),
  edit(7, 3, { target: "text", kind: "text", value: "Continue" }),
  edit(8, 4, { target: "inner", kind: "style", key: "color", value: "#ffffff" }),
  edit(9, 5, { target: "inner", kind: "style", key: "background-color", value: "#1a73e8" }),
];

export function mockRound(turnsPlayed = MOCK_EDITS.length): Round {
  return {
    index: 0,
    categoryId: "web-annoyances",
    secretId: "web-annoyances/cookie-consent-banner",
    chameleonId: 4,
    phase: "turns",
    turnOrder: [1, 2, 3, 4, 5],
    turnIndex: turnsPlayed,
    edits: MOCK_EDITS.slice(0, turnsPlayed),
    votes: {},
  };
}
