import { createInitialRoom, joinPlayer, type RoomState } from "react-gameroom";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import type { Edit, FakeDevPlayerData, Round, StealGuess } from "../game/types";
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
 * The Secret here is *Material · Primary Button*, but what the board shows is a
 * roomy wrapper holding a blue box with white copy in it. That is honestly a
 * button, a tooltip, a header, a badge or a backdrop's panel at this stage. It
 * makes sense; it does not announce itself.
 *
 * It models the split: a turn either *opens* a declaration by naming it or
 * *answers* one with a value. Turn 8 opens `border-radius` and nobody ever
 * answers it — that dangling question is a legitimate end state and worth
 * seeing on screen. Turn 6 answers the fill green; turn 9 overrides it to blue.
 *
 * The text move on turn 4 is a real bet, not free. It claims the component has
 * copy in its child, which is true of a button and false of Progress Bar, Range
 * Slider and Toggle Switch — three of fourteen. A Dev is spending a turn to
 * narrow the deck; a Chameleon playing this move is gambling.
 */

const NAMES = ["Rafa", "Ana", "Tom", "Ines", "Joost"];

/**
 * A room with `count` seats filled, built through `react-gameroom`'s own
 * helpers rather than hand-written — a hand-written room is a guess about the
 * library's shape, and a wrong guess in a fixture looks like a bug in the app.
 */
export function mockRoom(count = NAMES.length): RoomState<FakeDevPlayerData> {
  // The five who play every fixture, then enough extras to fill a table — the
  // lobby has to be seen at both ends of its range.
  const names = [...NAMES, "Mira", "Dev", "Sanne", "Kai", "Noor"];
  let room = createInitialRoom<FakeDevPlayerData>({
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    requireFull: false,
  });
  for (let seat = 1; seat <= count; seat++) {
    room = joinPlayer(room, seat, names[seat - 1], { color: seatColorFor(seat) });
  }
  return { ...room, roomId: "7KQP2" };
}

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
  // Adding text is a whole turn too, and it hands everyone a new element.
  edit(4, 5, { target: "inner-text", kind: "text" }),
  edit(5, 1, { target: "inner", kind: "style", key: "background-color" }),
  // Answered green, then overridden blue on turn 9 — the strikethrough case.
  edit(6, 2, { target: "inner", kind: "style", key: "background-color", value: "#34a853" }),
  // Styling the span, which only became possible on turn 4.
  edit(7, 3, { target: "inner-text", kind: "style", key: "color", value: "#ffffff" }),
  // Opened and never answered. A dangling question is a fine way to end — and
  // on the filled box it fits a button, a chip, a tooltip or a badge equally.
  edit(8, 4, { target: "inner", kind: "style", key: "border-radius" }),
  edit(9, 5, { target: "inner", kind: "style", key: "background-color", value: "#1a73e8" }),
];

export function mockRound(turnsPlayed = MOCK_EDITS.length): Round {
  return {
    index: 0,
    styleId: "material",
    componentId: "primary-button",
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

/**
 * The three ways a vote can land. Only `caught` was reachable from the mock,
 * which meant the escape — the outcome with no steal at all — could not be
 * looked at.
 */
export const MOCK_VERDICTS = {
  /** Seat 4 is the Chameleon and draws the most votes. */
  caught: MOCK_VOTES,
  /** Everyone points at seat 2, who is not the Chameleon. */
  escaped: { 1: 2, 3: 2, 4: 2, 5: 2 } as Record<number, number>,
  /** Two players tie at the top, so nobody is caught. */
  tied: { 1: 2, 2: 4, 3: 4, 5: 2 } as Record<number, number>,
} as const;

export type MockVerdict = keyof typeof MOCK_VERDICTS;


/** The same round frozen at any later phase, for building those screens. */
export function mockRoundAt(
  phase: Round["phase"],
  stealGuess?: StealGuess,
  verdict: MockVerdict = "caught",
): Round {
  const base: Round = {
    ...mockRound(),
    phase,
    turnIndex: MOCK_EDITS.length,
    votes: phase === "countdown" ? {} : MOCK_VERDICTS[verdict],
  };

  if (phase !== "result") return base;

  const caught = verdict === "caught";
  const steal = caught && stealGuess
    ? {
        style: stealGuess.styleId === base.styleId,
        component: stealGuess.componentId === base.componentId,
      }
    : null;
  const halves = steal ? Number(steal.style) + Number(steal.component) : 0;

  // An uncaught Chameleon takes the round outright and nobody else scores —
  // there is no steal to split, which is the whole difference.
  if (!caught) {
    return {
      ...base,
      outcome: {
        caughtPlayerId: verdict === "tied" ? null : 2,
        chameleonCaught: false,
        tied: verdict === "tied",
        steal: null,
        awards: { 4: 2 },
      },
    };
  }

  return {
    ...base,
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
