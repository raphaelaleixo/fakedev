import {
  CHAMELEON_POINTS,
  CORRECT_VOTER_POINTS,
  PARTIAL_STEAL_POINTS,
  STEAL_SLATE_SIZE,
  TARGET_SCORE,
  TURNS_PER_PLAYER,
} from "./constants";
import { COMPONENTS, STYLES } from "./content/deck";
import type { Card, Edit, MatchState, Round, StealGuess, StealResult } from "./types";

/** Vote tally: how many pointed at each suspect, and who is at the top. */
export interface VoteTally {
  /** suspectId -> count. Players nobody pointed at are absent. */
  counts: Record<number, number>;
  /** Every suspect tied at the highest count. Empty when nobody voted. */
  mostPointed: number[];
}

/** @param votes voterId -> suspectId, one per player including the Chameleon. */
export function tallyVotes(votes: Record<number, number>): VoteTally {
  const counts: Record<number, number> = {};
  for (const suspectId of Object.values(votes)) {
    counts[suspectId] = (counts[suspectId] ?? 0) + 1;
  }

  const top = Math.max(0, ...Object.values(counts));
  const mostPointed = Object.entries(counts)
    .filter(([, count]) => count === top)
    .map(([suspectId]) => Number(suspectId));

  return { counts, mostPointed };
}

export interface VoteResult {
  /** The caught seat, or null when the vote tied. */
  caughtPlayerId: number | null;
  tied: boolean;
  chameleonCaught: boolean;
}

/**
 * The most-pointed player is caught. A tie for most-pointed means **nobody** is
 * caught and the Chameleon escapes — including when the Chameleon is one of the
 * tied players.
 */
export function resolveVotes(
  votes: Record<number, number>,
  chameleonId: number,
): VoteResult {
  const { mostPointed } = tallyVotes(votes);

  if (mostPointed.length !== 1) {
    return { caughtPlayerId: null, tied: true, chameleonCaught: false };
  }

  const caughtPlayerId = mostPointed[0];
  return {
    caughtPlayerId,
    tied: false,
    chameleonCaught: caughtPlayerId === chameleonId,
  };
}

export interface ScoreRoundInput {
  chameleonId: number;
  /** voterId -> suspectId. */
  votes: Record<number, number>;
  /** Which halves the Chameleon named. Null when they were never caught. */
  steal: StealResult | null;
}

/**
 * Points for one round, playerId -> points. Players who score nothing are
 * absent rather than zero.
 *
 *   escapes            Chameleon +2
 *   caught, both       Chameleon +2
 *   caught, one        Chameleon +1, each correct voter +1
 *   caught, neither    each correct voter +1
 *
 * Escaping and a perfect steal pay the same, as they do in the paper game —
 * both are simply "the Chameleon won this round".
 *
 * The gradient lives on the Chameleon's side. Devs get a flat +1 whenever they
 * catch a Chameleon who doesn't fully recover: they can't influence the steal,
 * so paying them differently for its outcome would reward luck.
 *
 * Only correct voters score, which is our one real departure from the paper
 * game's scoring — it pays every artist equally. The app knows each individual
 * vote, so this rewards deduction rather than attendance.
 */
export function scoreRound({
  chameleonId,
  votes,
  steal,
}: ScoreRoundInput): Record<number, number> {
  const { chameleonCaught } = resolveVotes(votes, chameleonId);

  if (!chameleonCaught) return { [chameleonId]: CHAMELEON_POINTS };

  const halves = steal ? Number(steal.style) + Number(steal.component) : 0;
  if (halves === 2) return { [chameleonId]: CHAMELEON_POINTS };

  const awards: Record<number, number> = {};
  if (halves === 1) awards[chameleonId] = PARTIAL_STEAL_POINTS;

  for (const [voterId, suspectId] of Object.entries(votes)) {
    const voter = Number(voterId);
    // The Chameleon's own vote never earns them anything.
    if (voter === chameleonId) continue;
    if (suspectId === chameleonId) awards[voter] = CORRECT_VOTER_POINTS;
  }
  return awards;
}

/**
 * Source of randomness, returning [0, 1). Injected so the host's draws are
 * testable — all randomness is host-authoritative and written once, never
 * recomputed per client.
 */
export type Rng = () => number;

function pickOne<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/** Fisher-Yates. Returns a new array. */
function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Five drawn from a deck, always including the answer, order randomized. */
function slateFor(deck: Card[], answerId: string, rng: Rng): string[] {
  const answer = deck.find((card) => card.id === answerId);
  if (!answer) throw new Error(`Unknown card: ${answerId}`);
  const decoys = shuffle(
    deck.filter((card) => card.id !== answerId),
    rng,
  ).slice(0, STEAL_SLATE_SIZE - 1);
  return shuffle([answer, ...decoys], rng).map((card) => card.id);
}

/**
 * The caught Chameleon's two slates — five styles and five components, each
 * containing the true answer. Drawn at steal time, not at setup, so they can't
 * leak early, and drawn fresh each time so the same Secret never presents the
 * same five twice.
 */
export function buildStealSlate(
  styleId: string,
  componentId: string,
  rng: Rng = Math.random,
): { styles: string[]; components: string[] } {
  return {
    styles: slateFor(STYLES, styleId, rng),
    components: slateFor(COMPONENTS, componentId, rng),
  };
}

export interface CreateRoundInput {
  index: number;
  /** Seat ids in table order. */
  seats: number[];
  /** Halves already played this match, excluded from the draw. */
  usedStyleIds: string[];
  usedComponentIds: string[];
  rng?: Rng;
}

/** Draws from a deck, skipping what a match has already used. */
function draw(deck: Card[], used: string[], rng: Rng): Card {
  const unused = deck.filter((card) => !used.includes(card.id));
  // Fifteen rounds are available before this can happen, which no match
  // reaches — but a match has no hard round cap, so exhausting a deck
  // reshuffles rather than deadlocking.
  return pickOne(unused.length > 0 ? unused : deck, rng);
}

/**
 * Round setup. Draws the style, the component, the Chameleon and the starting
 * player — in that order, which is what the RNG sequence in the tests assumes.
 */
export function createRound({
  index,
  seats,
  usedStyleIds,
  usedComponentIds,
  rng = Math.random,
}: CreateRoundInput): Round {
  const style = draw(STYLES, usedStyleIds, rng);
  const component = draw(COMPONENTS, usedComponentIds, rng);
  const chameleonId = pickOne(seats, rng);
  const startIndex = Math.floor(rng() * seats.length);

  return {
    index,
    styleId: style.id,
    componentId: component.id,
    chameleonId,
    phase: "turns",
    // Seat order, rotated to begin at the drawn starting player.
    turnOrder: [...seats.slice(startIndex), ...seats.slice(0, startIndex)],
    turnIndex: 0,
    edits: [],
    votes: {},
  };
}

// ---------------------------------------------------------------------------
// The turn loop
// ---------------------------------------------------------------------------

/** Exactly two full trips around the table: 2 × N. */
export function totalTurns(round: Round): number {
  return round.turnOrder.length * TURNS_PER_PLAYER;
}

/**
 * Whose turn it is, or null once the turns are spent. A disconnected player
 * simply stays active — the round pauses indefinitely rather than skipping,
 * which is what "Waiting for {name}" on the TV is showing.
 */
export function activePlayerId(round: Round): number | null {
  if (round.phase !== "turns") return null;
  if (round.turnIndex >= totalTurns(round)) return null;
  return round.turnOrder[round.turnIndex % round.turnOrder.length];
}

/**
 * Appends one commit and advances the turn. The composer makes illegal *moves*
 * impossible by construction; these guards catch illegal *callers*, which a
 * shared database makes reachable.
 */
export function submitEdit(round: Round, edit: Edit): Round {
  if (round.phase !== "turns") {
    throw new Error(`Cannot edit during the ${round.phase} phase.`);
  }
  const active = activePlayerId(round);
  if (edit.playerId !== active) {
    throw new Error(`It is not player ${edit.playerId}'s turn (waiting on ${active}).`);
  }

  const turnIndex = round.turnIndex + 1;
  const done = turnIndex >= totalTurns(round);
  return {
    ...round,
    edits: [...round.edits, { ...edit, turnIndex: round.turnIndex }],
    turnIndex,
    phase: done ? "countdown" : "turns",
  };
}

// ---------------------------------------------------------------------------
// Vote, steal, resolution
// ---------------------------------------------------------------------------

/** Opens the vote once the TV has finished its 3… 2… 1… Point! countdown. */
export function beginVoting(round: Round): Round {
  if (round.phase !== "countdown") {
    throw new Error(`Cannot open voting during the ${round.phase} phase.`);
  }
  return { ...round, phase: "voting" };
}

/** Votes lock on submission and are revealed together once every seat is in. */
export function castVote(round: Round, voterId: number, suspectId: number): Round {
  if (round.phase !== "voting") {
    throw new Error(`Cannot vote during the ${round.phase} phase.`);
  }
  if (round.votes[voterId] !== undefined) {
    throw new Error(`Player ${voterId}'s vote is already locked.`);
  }

  const votes = { ...round.votes, [voterId]: suspectId };
  const everyoneVoted = Object.keys(votes).length >= round.turnOrder.length;
  return { ...round, votes, phase: everyoneVoted ? "reveal" : round.phase };
}

function finish(round: Round, guess: StealGuess | null, tally: VoteResult): Round {
  const steal: StealResult | null = guess
    ? { style: guess.styleId === round.styleId, component: guess.componentId === round.componentId }
    : null;

  return {
    ...round,
    phase: "result",
    outcome: {
      ...tally,
      steal,
      awards: scoreRound({ chameleonId: round.chameleonId, votes: round.votes, steal }),
    },
  };
}

/**
 * Closes the vote. A caught Chameleon goes to the steal with a freshly drawn
 * slate; anyone else — including a tie, where nobody is caught — resolves
 * straight to the result.
 */
export function resolveRound(round: Round, rng: Rng = Math.random): Round {
  if (round.phase !== "reveal") {
    throw new Error(`Cannot resolve during the ${round.phase} phase.`);
  }
  const tally = resolveVotes(round.votes, round.chameleonId);

  if (!tally.chameleonCaught) return finish(round, null, tally);

  return {
    ...round,
    phase: "steal",
    stealSlate: buildStealSlate(round.styleId, round.componentId, rng),
  };
}

/** The caught Chameleon's one guess per axis. No second attempt. */
export function submitSteal(round: Round, guess: StealGuess): Round {
  if (round.phase !== "steal") {
    throw new Error(`Cannot steal during the ${round.phase} phase.`);
  }
  const tally = resolveVotes(round.votes, round.chameleonId);
  return finish({ ...round, stealGuess: guess }, guess, tally);
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

/**
 * Folds a resolved round into the match: awards into scores, the Secret into
 * the used pile, and the end-game check. A match ends the instant any player
 * reaches the target; if several cross together the highest total wins, and an
 * exact tie at the top is a shared win.
 */
export function applyRoundOutcome(match: MatchState, round: Round): MatchState {
  if (!round.outcome) {
    throw new Error("Round has no outcome; resolve it before applying.");
  }

  const scores = { ...match.scores };
  for (const [playerId, points] of Object.entries(round.outcome.awards)) {
    scores[Number(playerId)] = (scores[Number(playerId)] ?? 0) + points;
  }

  const best = Math.max(0, ...Object.values(scores));
  const finished = best >= TARGET_SCORE;

  return {
    ...match,
    scores,
    // Tracked separately so neither half ever recurs in a match.
    usedStyleIds: [...new Set([...match.usedStyleIds, round.styleId])],
    usedComponentIds: [...new Set([...match.usedComponentIds, round.componentId])],
    status: finished ? "finished" : "playing",
    ...(finished
      ? {
          winnerIds: Object.entries(scores)
            .filter(([, score]) => score === best)
            .map(([playerId]) => Number(playerId)),
        }
      : {}),
  };
}
