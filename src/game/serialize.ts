import type { Edit, MatchState, Round, RoundOutcome } from "./types";

/**
 * Firebase's wire format into the domain type.
 *
 * Two things it does that break naive reads:
 *
 *  1. **Empty collections are deleted, not stored.** A round written with
 *     `edits: []` reads back with no `edits` key at all, so anything iterating
 *     it throws. This is the single likeliest runtime failure in the app,
 *     because *every round starts empty*.
 *  2. **Sparse arrays come back as objects keyed by index**, so `.map` is gone
 *     too.
 *
 * Normalising here — the one place the wire format crosses into the app — means
 * no component has to know either fact. Same job `deserializeRoom` does for
 * `RoomState`.
 */

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" ? (value as Raw) : {};

/** Accepts an array, Firebase's index-keyed object, or nothing at all. */
function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value.filter((item) => item != null) as T[];
  if (value && typeof value === "object") {
    return Object.entries(value as Raw)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, item]) => item)
      .filter((item) => item != null) as T[];
  }
  return [];
}

/** Numeric-keyed maps — scores, votes — which Firebase also drops when empty. */
function asNumberMap(value: unknown): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [key, item] of Object.entries(asRecord(value))) {
    if (typeof item === "number") out[Number(key)] = item;
  }
  return out;
}

function deserializeRound(value: unknown): Round | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Raw;

  const outcome = raw.outcome
    ? ({
        ...(raw.outcome as RoundOutcome),
        awards: asNumberMap((raw.outcome as Raw).awards),
      } satisfies RoundOutcome)
    : undefined;

  return {
    ...(raw as unknown as Round),
    edits: asArray<Edit>(raw.edits),
    votes: asNumberMap(raw.votes),
    turnOrder: asArray<number>(raw.turnOrder),
    ...(outcome ? { outcome } : {}),
  };
}

export function deserializeMatch(value: unknown): MatchState {
  const raw = asRecord(value);
  return {
    ...(raw as unknown as MatchState),
    seats: asArray<number>(raw.seats),
    scores: asNumberMap(raw.scores),
    usedStyleIds: asArray<string>(raw.usedStyleIds),
    usedComponentIds: asArray<string>(raw.usedComponentIds),
    roundIndex: typeof raw.roundIndex === "number" ? raw.roundIndex : 0,
    round: deserializeRound(raw.round),
  };
}
