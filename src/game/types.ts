/**
 * Domain types for "A Fake Dev Goes to Amsterdam".
 *
 * Everything the big screen renders is a projection of two things: the deck
 * content (authored, static) and the append-only edit log (accumulated at
 * runtime). Nothing here stores a derived render — `foldEdits` builds it.
 *
 * Player identity is `react-gameroom`'s 1-based slot id throughout. There is no
 * separate player entity; names and colors live on `PlayerSlot<FakeDevPlayerData>`.
 */

// ---------------------------------------------------------------------------
// Content: categories, secrets, key schema
// ---------------------------------------------------------------------------

/**
 * One entry in either deck. A Secret is a style **and** a component, so the two
 * lists have the same shape and differ only in what they answer: how it looks,
 * and what it is.
 *
 * `id` is stable and is what gets written to game state — labels are i18n keys,
 * so they must never be used as identity.
 */
export interface Card {
  /** Stable identity, e.g. "brutalist" or "progress-bar". */
  id: string;
  /** i18n key resolving to the public label. */
  labelKey: string;
  /** Authoring note — what the code should read as. Never shown in game. */
  sketch: string;
}

/** How a key's value is composed in the controller. Drives the editor widget. */
export type ValueType = "enum" | "color" | "length" | "freetext";

/**
 * One chip in an enum editor. Label and value differ where the CSS is
 * unreadable as a label — `font-family` offers "Monospace", commits
 * `"Courier New", monospace`.
 */
export interface EnumOption {
  label: string;
  value: string;
}

/**
 * One authored key. These are *suggestions*, not a whitelist: the property step
 * shows them as browsable chips, and typing falls through to every property the
 * browser supports. A key with an entry here gets a typed editor; anything else
 * gets a free-form field gated on `CSS.supports`.
 *
 * That makes this file progressive polish rather than a gate — ten good entries
 * ship a playable game and the other ~600 properties already work.
 *
 * Every entry is a CSS property — there are no tags and no attributes.
 */
export interface KeySchemaEntry {
  /** The attribute name or CSS property, e.g. "disabled", "background-color". */
  key: string;
  valueType: ValueType;
  /** valueType "enum": the chip set. */
  options?: EnumOption[];
  /** valueType "length": selectable units. `""` means unitless, e.g. opacity. */
  units?: string[];
  /** valueType "length": stepper bounds, unit-agnostic. */
  min?: number;
  max?: number;
  step?: number;
  /** valueType "freetext": character cap. */
  maxLength?: number;
  /**
   * valueType "enum": draw each option *in* the value it names.
   *
   * Opt-in rather than automatic, because most of these would wreck the chip
   * they are drawn on — `display: none` would remove its own label. It is only
   * honest where the property changes how text looks and nothing else.
   */
  showsItself?: boolean;
}

// ---------------------------------------------------------------------------
// The edit log
// ---------------------------------------------------------------------------

/** The two boxes of the base structure. */
export type BoxTarget = "outer" | "inner";
/** The two spans. Neither exists until somebody plays the text move on its box. */
export type TextTarget = "outer-text" | "inner-text";
/**
 * Everything styleable. Named for position rather than meaning — `label` and
 * `text` carried HTML baggage the game doesn't want.
 */
export type EditTarget = BoxTarget | TextTarget;

/** The span a text move on this box creates. */
export const TEXT_OF: Record<BoxTarget, TextTarget> = {
  outer: "outer-text",
  inner: "inner-text",
};

/**
 * Two kinds of edit, and that's the whole game.
 *
 * There is no tag move and no attribute move. Both offered the same bad
 * bargain: `<input type="radio">` and `role="radio"` are the *correct*
 * engineering answers and also name the Secret outright, so the game would
 * have punished knowing them. Everything is a div, and every shape is drawn.
 */
export type EditKind = "style" | "text";

interface EditBase {
  id: string;
  playerId: number;
  /** 0-based turn that produced this edit. Rounds run turns 0 … 2N-1. */
  turnIndex: number;
}

/**
 * One CSS declaration.
 *
 * `value` is optional because a turn does one of two things: it **opens** a
 * declaration by naming it, or it **supplies a value**. An open declaration is
 * intent without execution — `border-radius` says "this thing is rounded" and
 * commits to nothing else — so it shows on the inspector and stays out of the
 * render until somebody answers it.
 */
export interface KeyedEdit extends EditBase {
  target: EditTarget;
  kind: "style";
  key: string;
  value?: string;
}

/**
 * Puts text in a box, which creates its span.
 *
 * There is no content to choose — it is always the same lorem. What you pick is
 * *where* copy goes, never what it says, so no move in the game can spell out
 * the Secret. And the move pays forward: the span it creates is a new element
 * for everybody else to style.
 */
export interface TextEdit extends EditBase {
  target: TextTarget;
  kind: "text";
}

/**
 * A single commit. The log is append-only and ordered; superseded edits are
 * never removed — the inspector needs the full history.
 */
export type Edit = KeyedEdit | TextEdit;

/**
 * The last-write-wins identity of an edit. Two edits collide iff they produce
 * the same slot string.
 */
export type EditSlot = string;

// ---------------------------------------------------------------------------
// The render (a fold over the log)
// ---------------------------------------------------------------------------

export interface RenderElement {
  styles: Record<string, string>;
}

/** A span, which only renders once its text move has been played. */
export interface RenderText extends RenderElement {
  present: boolean;
}

/** The full render state. Rebuilt from the log on every change; never stored. */
export interface RenderTree {
  outer: RenderElement;
  "outer-text": RenderText;
  inner: RenderElement;
  "inner-text": RenderText;
}

/** One line of the Live Inspector — an edit plus its display state. */
export interface InspectorLine {
  edit: Edit;
  /** True when a later edit owns the same slot. */
  superseded: boolean;
}

// ---------------------------------------------------------------------------
// Round and match state
// ---------------------------------------------------------------------------

/**
 * Ten seats, ten hues. Deliberately excludes anything near the brand orange,
 * which would read as "the app" rather than as a player.
 */
export type SeatColor =
  | "crimson"
  | "rose"
  | "violet"
  | "indigo"
  | "sky"
  | "cyan"
  | "teal"
  | "emerald"
  | "lime"
  | "slate";

/** Game-specific payload carried on each `react-gameroom` player slot. */
export interface FakeDevPlayerData {
  color: SeatColor;
}

export type RoundPhase =
  /** The 2N edits. Pauses indefinitely on the active player. */
  | "turns"
  /** TV shows 3… 2… 1… Point! Phones idle. */
  | "countdown"
  /** All phones vote simultaneously; votes lock on submit. */
  | "voting"
  /** Votes revealed together on the TV. */
  | "reveal"
  /** Caught Chameleon names both halves over the full deck. Nobody else acts. */
  | "steal"
  /** Chameleon + Secret public, points awarded, scoreboard. */
  | "result";

export interface Vote {
  voterId: number;
  suspectId: number;
}

/** A caught Chameleon's guess: one answer per axis. */
export interface StealGuess {
  styleId: string;
  componentId: string;
}

/** Which halves they got. Null when no steal happened. */
export interface StealResult {
  style: boolean;
  component: boolean;
}

/**
 * Round state. Everything lives in one shared node, including the Secret and
 * `chameleonId` — this is a game played with friends in one room, so hidden
 * info is hidden by what each surface *renders*, not by what it receives. The
 * TV never draws the Secret before resolution and the Chameleon's controller
 * shows FAKE DEV, but both hold the data.
 */
export interface Round {
  /** 0-based index within the match. */
  index: number;
  /** Half the Secret: how it looks. Never rendered until `outcome` lands. */
  styleId: string;
  /** Half the Secret: what it is. Never rendered until `outcome` lands. */
  componentId: string;
  /** Never rendered anywhere until `outcome` lands. */
  chameleonId: number;
  phase: RoundPhase;
  /** Seat ids in play order, rotated so turnOrder[0] is the starting player. */
  turnOrder: number[];
  /** 0-based; the active player is turnOrder[turnIndex % turnOrder.length]. */
  turnIndex: number;
  /** Append-only, ordered. */
  edits: Edit[];
  /** voterId -> suspectId. Locked once written. */
  votes: Record<number, number>;
  /**
   * Written at steal time, not at setup: five of each, shuffled, always
   * including the true answer.
   */
  /** The caught Chameleon's one answer per axis. */
  stealGuess?: StealGuess;
  /** Written when the round resolves; this is when hidden info becomes visible. */
  outcome?: RoundOutcome;
}

export interface RoundOutcome {
  /** Most-pointed seat, or null when the vote tied (Chameleon escapes). */
  caughtPlayerId: number | null;
  /** True iff the vote produced a single most-pointed player and it was them. */
  chameleonCaught: boolean;
  /** True when the vote tied for most-pointed. */
  tied: boolean;
  /** Which halves the Chameleon got. Null when they were never caught. */
  steal: StealResult | null;
  /** Points awarded this round only, playerId -> points. Fold into scores. */
  awards: Record<number, number>;
}

export type MatchStatus = "playing" | "finished";

/** The `game` node — the whole match, shared by every client. */
export interface MatchState {
  status: MatchStatus;
  /** Seat ids in table order, fixed at start. */
  seats: number[];
  /** playerId -> cumulative points. */
  scores: Record<number, number>;
  /**
   * Tracked separately so neither half ever recurs in a match. Fifteen rounds
   * are available before either pool is exhausted, which no match reaches.
   */
  usedStyleIds: string[];
  usedComponentIds: string[];
  /** 0-based, explicit. Deriving it from a used pile coupled two things badly. */
  roundIndex: number;
  round: Round | null;
  /** Set when status is "finished". More than one id means a shared win. */
  winnerIds?: number[];
}

// ---------------------------------------------------------------------------
// Turn composition (phone-side, pre-commit)
// ---------------------------------------------------------------------------

/**
 * The in-progress state of the composer. Local to the controller; only a
 * completed edit is ever written. Illegal moves are impossible by construction
 * because every step is picked from a constrained set.
 *
 * Note this is keyed by **element**, not by log target. There are only two
 * things on the canvas — `outer` and `inner` — and each owns a text slot, so
 * the player picks an element and then what kind of edit to make on it. `text`
 * is one of those kinds. `draftToEdit` maps that onto the log's four targets:
 * outer's text is `{label}`, inner's text is `{text}`.
 */
/**
 * What a turn does. **Open** a declaration by naming it, **answer** one with a
 * value, or **add text** to a box — which creates its span and hands everyone a
 * new element to work on.
 */
export type ComposerMove = "style" | "value" | "text";

export interface ComposerDraft {
  target?: EditTarget;
  move?: ComposerMove;
  /** The declaration being opened, or the one a value answers. */
  key?: string;
  value?: string;
}

// ---------------------------------------------------------------------------
// Firebase shape
// ---------------------------------------------------------------------------

/**
 * rooms/{roomId}
 *   room   RoomState<FakeDevPlayerData>   (react-gameroom owns this)
 *   game   MatchState                     (everyone subscribes to all of it)
 *
 * The big screen is the authority: it draws the round, Secret, Chameleon and
 * starting player, advances phases, and computes the outcome. Phones write only
 * their own edit on their own turn, their own vote, and the steal guess.
 *
 * A player's role is derived, not stored per-seat: `playerId === round.chameleonId`.
 */
