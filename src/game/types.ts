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

export type CategoryId =
  | "form-states"
  | "design-eras"
  | "web-annoyances"
  | "everyday-components";

/**
 * One card. `id` is stable and is what gets written to game state — labels are
 * i18n keys, so they must never be used as identity.
 */
export interface Secret {
  /** Stable identity, e.g. "form-states/disabled-button". */
  id: string;
  categoryId: CategoryId;
  /** i18n key resolving to the public label, e.g. "Disabled Button". */
  labelKey: string;
  /** Authoring note — what the canvas should read as. Never shown in game. */
  sketch: string;
  /** Devs-only thumbnail, phone header. Never on the TV. */
  styleRef?: string;
  /**
   * Similarity group. Groups hold exactly 5 cards, so the steal slate *is* the
   * Secret's group — the true card plus its 4 nearest neighbours, shuffled.
   * 15 cards per category means exactly 3 groups each.
   */
  group: string;
}

export interface Category {
  id: CategoryId;
  labelKey: string;
  /** Exactly 15 per the deck spec; not enforced by the type. */
  secrets: Secret[];
}

/** How a key's value is composed in the controller. Drives the editor widget. */
export type ValueType = "enum" | "color" | "length" | "boolean" | "freetext";

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
 * Tags are *not* in here: a tag edit has no key, only a value, so the tag
 * suggestions are a plain `string[]`.
 */
export interface KeySchemaEntry {
  /** The attribute name or CSS property, e.g. "disabled", "background-color". */
  key: string;
  kind: "attribute" | "style";
  valueType: ValueType;
  /** Which of the two element targets this key may be applied to. */
  appliesTo: ElementTarget[];
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
}

/**
 * Boolean attributes (`disabled`, `checked`, `required`, `readonly`) still take
 * a value step, with two chips. An override can turn one back off — un-disabling
 * a button is a legitimate play, and last-write-wins stays meaningful for them.
 */
export type BooleanValue = "true" | "false";

// ---------------------------------------------------------------------------
// The edit log
// ---------------------------------------------------------------------------

/** The two element slots in the base structure. */
export type ElementTarget = "outer" | "inner";
/** The two text slots. `label` sits in `outer` before `inner`; `text` inside `inner`. */
export type TextTarget = "label" | "text";
export type EditTarget = ElementTarget | TextTarget;

export type EditKind = "tag" | "attribute" | "style" | "text";

interface EditBase {
  id: string;
  playerId: number;
  /** 0-based turn that produced this edit. Rounds run turns 0 … 2N-1. */
  turnIndex: number;
}

/** Sets the element's tag name. No key. */
export interface TagEdit extends EditBase {
  target: ElementTarget;
  kind: "tag";
  value: string;
}

/**
 * One HTML attribute or one CSS declaration.
 *
 * `value` is optional because a turn does one of two things: it **opens** a
 * declaration by naming it, or it **supplies a value**. An open declaration is
 * intent without execution — `border-radius` says "this thing is rounded" and
 * commits to nothing else — so it shows on the inspector and stays out of the
 * render until somebody answers it.
 */
export interface KeyedEdit extends EditBase {
  target: ElementTarget;
  kind: "attribute" | "style";
  key: string;
  value?: string;
}

/** Sets one of the two text slots. No key. Capped at TEXT_MAX_LENGTH. */
export interface TextEdit extends EditBase {
  target: TextTarget;
  kind: "text";
  value: string;
}

/**
 * A single commit. The log is append-only and ordered; superseded edits are
 * never removed — the inspector's strikethroughs and the deferred replay
 * feature both read the full history.
 *
 * Modelled as a union so an invalid combination (a keyless style edit, a tag on
 * a text slot) is unrepresentable. Serializes flat: absent fields are simply
 * absent, which is what Firebase stores anyway.
 */
export type Edit = TagEdit | KeyedEdit | TextEdit;

/**
 * The last-write-wins identity of an edit. Two edits collide iff they produce
 * the same slot string; the later one wins the render, the earlier one is drawn
 * struck through.
 */
export type EditSlot = string;

// ---------------------------------------------------------------------------
// The render (a fold over the log)
// ---------------------------------------------------------------------------

export interface RenderElement {
  tag: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
}

/** The full render state. Rebuilt from the log on every change; never stored. */
export interface RenderTree {
  outer: RenderElement;
  inner: RenderElement;
  label: string;
  text: string;
}

/** One line of the Live Inspector — an edit plus its display state. */
export interface InspectorLine {
  edit: Edit;
  /** True when a later edit owns the same slot. Drawn struck through. */
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
  /** Caught Chameleon picks from the 5-card slate. Nobody else acts. */
  | "steal"
  /** Chameleon + Secret public, points awarded, scoreboard. */
  | "result";

export interface Vote {
  voterId: number;
  suspectId: number;
}

/**
 * Round state. Everything lives in one shared node, including `secretId` and
 * `chameleonId` — this is a game played with friends in one room, so hidden
 * info is hidden by what each surface *renders*, not by what it receives.
 * The TV never draws the Secret before resolution and the Chameleon's phone
 * shows FAKE DEV, but both hold the data.
 */
export interface Round {
  /** 0-based index within the match. */
  index: number;
  categoryId: CategoryId;
  /** Never rendered on the TV until `outcome` lands. */
  secretId: string;
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
   * Written at steal time, not at setup: the Secret's similarity group,
   * shuffled. 5 secret ids.
   */
  stealSlate?: string[];
  /** The caught Chameleon's pick, a secret id. */
  stealGuess?: string;
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
  /** Null when no steal happened. */
  stealCorrect: boolean | null;
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
  /** Secret ids already played this match; excluded from selection. */
  usedSecretIds: string[];
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
 * What a turn does. A turn either **opens** a declaration by naming it
 * (`attribute` / `style`), **answers** one with a value (`value`), or plays a
 * single-token move that has no name/value split at all (`tag` / `text`).
 *
 * Opening is intent without execution; answering is committing to somebody's
 * intent — possibly your own, possibly not. That choice is the game.
 */
export type ComposerMove = "tag" | "text" | "attribute" | "style" | "value";

export interface ComposerDraft {
  element?: ElementTarget;
  move?: ComposerMove;
  /** The declaration being opened, or the one a value answers. */
  key?: string;
  /** For a `value` move: which kind of declaration is being answered. */
  slotKind?: "attribute" | "style";
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
 * The big screen is the authority: it draws the Category, Secret, Chameleon and
 * starting player, advances phases, and computes the outcome. Phones write only
 * their own edit on their own turn, their own vote, and the steal guess.
 *
 * A player's role is derived, not stored per-seat: `playerId === round.chameleonId`.
 */
