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
import { seatColorFor, startMatch } from "../game/match";
import type { FakeDevPlayerData, MatchState } from "../game/types";

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
        setMatchState((data.game as MatchState | undefined) ?? null);
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
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
