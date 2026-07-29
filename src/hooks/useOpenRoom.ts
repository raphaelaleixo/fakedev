import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../contexts/GameContext";

/**
 * Opening a room and landing on its lobby.
 *
 * Two screens do this — the cover's primary action and the join screen's
 * fallback for whoever is running the big screen — and they had drifted: only
 * one animated, only one reported failure, and only one avoided navigating
 * twice on a double press. One hook, one behaviour.
 *
 * `flushSync` is not decoration. Every other navigation in the app starts from
 * a click handler; this one lands after an await, where React treats the update
 * as non-urgent and can defer the commit past the point the browser snapshots
 * the new state — so the view transition would run against a page that has not
 * changed yet.
 */
export function useOpenRoom() {
  const navigate = useNavigate();
  const { createRoom } = useGame();
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);

  async function open() {
    if (opening) return;
    setOpening(true);
    setFailed(false);
    try {
      const roomId = await createRoom();

      /**
       * Wait for a frame before navigating.
       *
       * `flushSync` must not run while React is rendering — it warns and
       * defers, and a deferred commit inside `startViewTransition` means the
       * browser snapshots a state that has not changed yet, which is a
       * transition that animates nothing. After an `await` there is no way to
       * know whether the `setOpening(true)` above has committed yet; one frame
       * guarantees it has.
       */
      await new Promise((resolve) => requestAnimationFrame(resolve));

      navigate(`/room/${roomId}`, { viewTransition: true, flushSync: true });
    } catch {
      setOpening(false);
      setFailed(true);
    }
  }

  return { open, opening, failed };
}
