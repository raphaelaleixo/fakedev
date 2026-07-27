/* eslint-disable react-refresh/only-export-components -- Context + hook + Provider colocated, as in the sibling projects. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { get, onValue, ref, update, type Unsubscribe } from "firebase/database";
import {
  createInitialRoom,
  deserializeRoom,
  findFirstEmptySlot,
  joinPlayer,
  startGame,
  type RoomState,
} from "react-gameroom";
import { database } from "../firebase";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import { advanceMatch, seatColorFor, startMatch } from "../game/match";
import { beginVoting, castVote, resolveRound, submitEdit, submitSteal } from "../game/round";
import { deserializeMatch } from "../game/serialize";
import type { Edit, FakeDevPlayerData, MatchState, Round, StealGuess } from "../game/types";

export interface GameContextValue {
  roomState: RoomState<FakeDevPlayerData> | null;
  matchState: MatchState | null;
  loading: boolean;
  /** True once the subscription has resolved and found nothing at this room id. */
  notFound: boolean;
  createRoom: () => Promise<string>;
  loadRoom: (roomId: string) => void;
  joinRoom: (roomId: string, name: string) => Promise<number>;
  startTheMatch: () => Promise<void>;
  commitEdit: (roomId: string, edit: Edit) => Promise<void>;
  openVoting: (roomId: string) => Promise<void>;
  vote: (roomId: string, voterId: number, suspectId: number) => Promise<void>;
  closeVoting: (roomId: string) => Promise<void>;
  steal: (roomId: string, guess: StealGuess) => Promise<void>;
  nextRound: (roomId: string) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

const roomPath = (roomId: string) => `rooms/${roomId}`;

export function GameProvider({ children }: { children: ReactNode }) {
  const [roomState, setRoomState] = useState<RoomState<FakeDevPlayerData> | null>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => () => unsubRef.current?.(), []);

  const loadRoom = useCallback((roomId: string) => {
    unsubRef.current?.();
    setLoading(true);
    setNotFound(false);

    unsubRef.current = onValue(
      ref(database, roomPath(roomId)),
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (data.room) {
          // Firebase stores arrays as keyed objects; deserializeRoom normalizes
          // `players` back into a real array.
          setRoomState(deserializeRoom<FakeDevPlayerData>(data.room));
        }
        // Firebase deletes empty collections, so a freshly dealt round arrives
        // with no `edits` key at all. Normalise before anything renders it.
        setMatchState(data.game ? deserializeMatch(data.game) : null);
        setLoading(false);
      },
      (error) => {
        console.error("[fakedev] room subscription failed:", error);
        setLoading(false);
      },
    );
  }, []);

  const createRoom = useCallback(async () => {
    const room = createInitialRoom<FakeDevPlayerData>({
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      requireFull: false,
    });
    await update(ref(database, roomPath(room.roomId)), {
      // Strip undefined — Firebase rejects it.
      room: JSON.parse(JSON.stringify(room)),
      game: null,
    });
    return room.roomId;
  }, []);

  const joinRoom = useCallback(async (roomId: string, name: string) => {
    const snapshot = await get(ref(database, `${roomPath(roomId)}/room`));
    const raw = snapshot.val();
    if (!raw) throw new Error("room-not-found");

    const room = deserializeRoom<FakeDevPlayerData>(raw);
    if (room.status === "started") throw new Error("already-started");

    const slot = findFirstEmptySlot(room.players);
    if (!slot) throw new Error("room-full");

    const joined = joinPlayer(room, slot.id, name, { color: seatColorFor(slot.id) });
    await update(ref(database, roomPath(roomId)), {
      room: JSON.parse(JSON.stringify(joined)),
    });
    return slot.id;
  }, []);

  const startTheMatch = useCallback(async () => {
    if (!roomState) return;

    const started = startGame(roomState);
    // startGame is a no-op when readiness conditions aren't met.
    if (started.status !== "started") return;

    const seats = started.players.filter((p) => p.status === "ready").map((p) => p.id);

    // One write: the room flips to started and the match appears together, so
    // no client can observe a started room with no game in it.
    await update(ref(database, roomPath(started.roomId)), {
      room: JSON.parse(JSON.stringify(started)),
      game: JSON.parse(JSON.stringify(startMatch(seats))),
    });
  }, [roomState]);

  /**
   * Appends one commit and advances the turn.
   *
   * Re-reads the round first rather than trusting the subscribed copy: the
   * controller may have been showing a state one write behind, and `submitEdit`
   * throws on an out-of-turn edit, which is the check we want to run against
   * what's actually in the database.
   */
  const commitEdit = useCallback(async (roomId: string, edit: Edit) => {
    await mutateRound(roomId, (round) => submitEdit(round, edit));
  }, []);

  /**
   * Phase transitions driven by the big screen. Each underlying helper throws
   * when the round isn't in the phase it expects, which makes these naturally
   * idempotent — a second big screen open on the same room, or a timer that
   * fires twice, is a no-op rather than a double advance.
   */
  const openVoting = useCallback(async (roomId: string) => {
    await mutateRound(roomId, beginVoting, { ignorePhaseErrors: true });
  }, []);

  const closeVoting = useCallback(async (roomId: string) => {
    await mutateRound(roomId, (round) => resolveRound(round), { ignorePhaseErrors: true });
  }, []);

  const vote = useCallback(async (roomId: string, voterId: number, suspectId: number) => {
    await mutateRound(roomId, (round) => castVote(round, voterId, suspectId));
  }, []);

  const steal = useCallback(async (roomId: string, guess: StealGuess) => {
    await mutateRound(roomId, (round) => submitSteal(round, guess), {
      ignorePhaseErrors: true,
    });
  }, []);

  /** Banks the round and deals the next, or ends the match. */
  const nextRound = useCallback(async (roomId: string) => {
    const match = await readMatch(roomId);
    if (!match.round?.outcome) return;
    await update(ref(database, `${roomPath(roomId)}/game`), serialize(advanceMatch(match, match.round)));
  }, []);

  return (
    <GameContext.Provider
      value={{
        roomState,
        matchState,
        loading,
        notFound,
        createRoom,
        loadRoom,
        joinRoom,
        startTheMatch,
        commitEdit,
        openVoting,
        vote,
        closeVoting,
        steal,
        nextRound,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

/** Firebase rejects `undefined`, and stores arrays as keyed objects. */
function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function readMatch(roomId: string): Promise<MatchState> {
  const snapshot = await get(ref(database, `${roomPath(roomId)}/game`));
  if (!snapshot.val()) throw new Error("no-match");
  return deserializeMatch(snapshot.val());
}

/**
 * Read-modify-write on the round.
 *
 * Always re-reads rather than trusting the subscribed copy: a client may be a
 * write behind, and the domain helpers' guards should run against what's
 * actually in the database.
 */
async function mutateRound(
  roomId: string,
  change: (round: Round) => Round,
  { ignorePhaseErrors = false }: { ignorePhaseErrors?: boolean } = {},
): Promise<void> {
  const match = await readMatch(roomId);
  if (!match.round) throw new Error("no-round");

  let next: Round;
  try {
    next = change(match.round);
  } catch (error) {
    if (ignorePhaseErrors) return;
    throw error;
  }

  await update(ref(database, `${roomPath(roomId)}/game`), { round: serialize(next) });
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
