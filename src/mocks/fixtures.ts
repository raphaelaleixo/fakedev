import type { Edit, Round, StealGuess } from "../game/types";
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
 * The Secret here is *Flat Design · Progress Bar*, but what the board shows is a
 * padded white box with a blue child. That is honestly any number of components
 * in any number of styles at this stage. It makes sense; it does not announce
 * itself.
 *
 * The label is lorem ipsum on purpose: it commits to body copy of a certain
 * length without committing to what the copy says. Structural signal, zero
 * semantic leak.
 *
 * It also models the split: a turn either *opens* a declaration by naming it or
 * *answers* one with a value. Turn 8 opens `role` and nobody ever answers it —
 * that dangling question is a legitimate end state and worth seeing on screen.
 * Turn 7 answers the button green; turn 9 overrides it to blue.
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
  // Rafa names a property. That's the whole turn — somebody else decides what
  // it becomes.
  edit(0, 1, { target: "outer", kind: "style", key: "display" }),
  edit(1, 2, { target: "outer", kind: "style", key: "display", value: "flex" }),
  edit(2, 3, { target: "outer", kind: "style", key: "padding" }),
  edit(3, 4, { target: "outer", kind: "style", key: "padding", value: "20px" }),
  // Choosing the component is a whole turn, same as any other move.
  edit(4, 5, { target: "inner", kind: "tag", value: "button" }),
  // Signals the *shape* — body copy lives here, about this long — without
  // leaking what it says. Safe on this card and a real bet on others: half the
  // deck wants these slots empty, and lorem ipsum on a Skeleton Loader would
  // give the player away instantly.
  edit(5, 1, { target: "label", kind: "text", value: "Lorem ipsum dolor sit" }),
  edit(6, 2, { target: "inner", kind: "style", key: "background-color" }),
  // Answered green, then overridden blue on turn 9 — the strikethrough case.
  edit(7, 3, { target: "inner", kind: "style", key: "background-color", value: "#34a853" }),
  // Opened and never answered. A dangling question is a fine way to end.
  edit(8, 4, { target: "outer", kind: "attribute", key: "role" }),
  edit(9, 5, { target: "inner", kind: "style", key: "background-color", value: "#1a73e8" }),
];

export function mockRound(turnsPlayed = MOCK_EDITS.length): Round {
  return {
    index: 0,
    styleId: "flat-design",
    componentId: "progress-bar",
    chameleonId: 4,
    phase: "turns",
    turnOrder: [1, 2, 3, 4, 5],
    turnIndex: turnsPlayed,
    edits: MOCK_EDITS.slice(0, turnsPlayed),
    votes: {},
  };
}

/** Seats 1, 2 and 5 point at the Chameleon; 3 misfires; the Chameleon points at 1. */
export const MOCK_VOTES: Record<number, number> = { 1: 4, 2: 4, 3: 2, 4: 1, 5: 4 };

export const MOCK_SLATE = {
  styles: ["wireframe", "flat-design", "brutalist", "material", "vaporwave"],
  components: ["avatar", "toggle-switch", "progress-bar", "tooltip", "tag-chip"],
};

/** The same round frozen at any later phase, for building those screens. */
export function mockRoundAt(phase: Round["phase"], stealGuess?: StealGuess): Round {
  const base: Round = {
    ...mockRound(),
    phase,
    turnIndex: MOCK_EDITS.length,
    votes: phase === "countdown" ? {} : MOCK_VOTES,
  };

  if (phase === "steal") return { ...base, stealSlate: MOCK_SLATE };
  if (phase !== "result") return base;

  const steal = stealGuess
    ? {
        style: stealGuess.styleId === base.styleId,
        component: stealGuess.componentId === base.componentId,
      }
    : null;
  const halves = steal ? Number(steal.style) + Number(steal.component) : 0;

  return {
    ...base,
    stealSlate: MOCK_SLATE,
    stealGuess,
    outcome: {
      caughtPlayerId: 4,
      chameleonCaught: true,
      tied: false,
      steal,
      awards:
        halves === 2
          ? { 4: 2 }
          : halves === 1
            ? { 4: 1, 1: 1, 2: 1, 5: 1 }
            : { 1: 1, 2: 1, 5: 1 },
    },
  };
}
