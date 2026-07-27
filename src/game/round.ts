import {
  CHAMELEON_POINTS,
  CORRECT_VOTER_POINTS,
  TARGET_SCORE,
  TURNS_PER_PLAYER,
} from "./constants";
import { CATEGORIES, getGroupSecrets, getSecret } from "./content/deck";
import type { Category, Edit, MatchState, Round } from "./types";

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
  /** The caught Chameleon's pick, or null when no steal happened. */
  stealGuess: string | null;
  secretId: string;
}

/**
 * Points for one round, playerId -> points. Players who score nothing are
 * absent rather than zero.
 *
 * Rebalanced from the paper game because there is no Question Master: the
 * Chameleon earns 3 rather than 2 since they no longer split a payout, and
 * only *correct voters* score rather than every Dev equally — otherwise 9 of
 * 10 players gain a point most rounds and the race to 5 is a formality.
 */
export function scoreRound({
  chameleonId,
  votes,
  stealGuess,
  secretId,
}: ScoreRoundInput): Record<number, number> {
  const { chameleonCaught } = resolveVotes(votes, chameleonId);

  // Escaped outright, or caught and then named the Secret.
  if (!chameleonCaught || stealGuess === secretId) {
    return { [chameleonId]: CHAMELEON_POINTS };
  }

  const awards: Record<number, number> = {};
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

/**
 * The caught Chameleon's 5-card slate: the Secret's similarity group, shuffled
 * so the true card's position is randomized. Drawn at steal time, not at round
 * setup, so it can't leak early.
 */
export function buildStealSlate(secretId: string, rng: Rng = Math.random): string[] {
  const secret = getSecret(secretId);
  if (!secret) throw new Error(`Unknown secret: ${secretId}`);
  return shuffle(
    getGroupSecrets(secret).map((s) => s.id),
    rng,
  );
}

export interface CreateRoundInput {
  index: number;
  /** Seat ids in table order. */
  seats: number[];
  /** Secrets already played this match, excluded from the draw. */
  usedSecretIds: string[];
  rng?: Rng;
}

/**
 * Round setup. Draws the Category, the Secret, the Chameleon and the starting
 * player — in that order, which is what the RNG sequence in the tests assumes.
 */
export function createRound({
  index,
  seats,
  usedSecretIds,
  rng = Math.random,
}: CreateRoundInput): Round {
  const used = new Set(usedSecretIds);
  const unused = (category: Category) =>
    category.secrets.filter((s) => !used.has(s.id));

  // With 60 cards this is unreachable in a real match, but a match has no hard
  // round cap — so exhausting the deck reshuffles rather than deadlocking.
  let available = CATEGORIES.filter((c) => unused(c).length > 0);
  if (available.length === 0) {
    used.clear();
    available = [...CATEGORIES];
  }

  const category = pickOne(available, rng);
  const secret = pickOne(unused(category), rng);
  const chameleonId = pickOne(seats, rng);
  const startIndex = Math.floor(rng() * seats.length);

  return {
    index,
    categoryId: category.id,
    secretId: secret.id,
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

function finish(round: Round, stealGuess: string | null, tally: VoteResult): Round {
  return {
    ...round,
    phase: "result",
    outcome: {
      ...tally,
      stealCorrect: stealGuess === null ? null : stealGuess === round.secretId,
      awards: scoreRound({
        chameleonId: round.chameleonId,
        votes: round.votes,
        stealGuess,
        secretId: round.secretId,
      }),
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
    stealSlate: buildStealSlate(round.secretId, rng),
  };
}

/** The caught Chameleon's one guess. No second attempt. */
export function submitSteal(round: Round, guess: string): Round {
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
    usedSecretIds: [...match.usedSecretIds, round.secretId],
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
