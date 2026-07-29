import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useGame } from "../contexts/GameContext";
import ControllerShell from "../components/controller/ControllerShell";
import Composer from "../components/controller/Composer";
import Waiting from "../components/controller/Waiting";
import { StealPicker, VotePicker } from "../components/controller/VoteControls";
import type { SeatInfo } from "../components/canvas/LiveInspector";
import { getComponent, getStyle } from "../game/content/deck";
import { seatColorFor } from "../game/match";
import { activePlayerId } from "../game/round";
import type { Edit } from "../game/types";
import { color } from "../theme/tokens";

/** One player's private controller. */
export default function PlayerPage() {
  const { id, playerId } = useParams();
  const { t } = useTranslation();
  const { roomState, matchState, loading, notFound, loadRoom, commitEdit, vote, steal } =
    useGame();
  const [busy, setBusy] = useState(false);
  /**
   * Which action failed, as a copy key — not the thrown message.
   *
   * A write can fail in any phase and the player has to be told in the one they
   * are in: "that edit didn't land" is no use to somebody whose vote didn't
   * land. The thrown message is a Firebase string in English written for us,
   * not for them, so what gets shown is our own line about the move they just
   * made.
   */
  const [failed, setFailed] = useState<string | null>(null);

  const seat = Number(playerId);

  async function run(action: () => Promise<void>, failureKey: string) {
    setBusy(true);
    setFailed(null);
    try {
      await action();
    } catch (e) {
      console.error(e);
      setFailed(failureKey);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (id) loadRoom(id);
  }, [id, loadRoom]);

  if (notFound) {
    return (
      <Bare>
        <Message>{t("room.notFound", { code: id })}</Message>
      </Bare>
    );
  }
  if (loading || !roomState) {
    return (
      <Bare>
        <CircularProgress />
      </Bare>
    );
  }

  const slot = roomState.players.find((p) => p.id === seat);
  if (!slot || slot.status === "empty") {
    return (
      <Bare>
        <Message>{t("controller.badSeat")}</Message>
      </Bare>
    );
  }

  const round = matchState?.round;
  // Waiting, not broken — so it gets the waiting treatment rather than the
  // error one, even though there is no shell to put it in yet.
  if (!round) {
    return (
      <Bare>
        <Waiting headline={t("controller.waitingForStart")} />
      </Bare>
    );
  }

  const isChameleon = round.chameleonId === seat;
  const style = getStyle(round.styleId);
  const component = getComponent(round.componentId);
  const active = activePlayerId(round);

  const seats: SeatInfo[] = roomState.players
    .filter((p) => p.status !== "empty")
    .map((p) => ({
      id: p.id,
      name: p.name ?? `#${p.id}`,
      color: p.data?.color ?? seatColorFor(p.id),
    }));

  async function handleCommit(edit: Edit) {
    if (!id) return;
    await run(() => commitEdit(id, edit), "controller.commitFailed");
  }

  return (
    <ControllerShell
      isChameleon={isChameleon}
      secret={
        style && component
          ? { style: t(style.labelKey), component: t(component.labelKey) }
          : undefined
      }
      seatName={slot.name ?? `#${seat}`}
      seatColor={slot.data?.color ?? seatColorFor(seat)}
      roomState={roomState}
    >
      {/* Every phase writes something, so every phase can fail. This used to
          live inside the turn, which is the one branch where a failure was
          already obvious — a board that did not change. A vote that silently
          does not land looks exactly like a vote that did. */}
      {failed && (
        <Typography role="alert" sx={{ mb: 2, color: color.flame }}>
          {t(failed)}
        </Typography>
      )}

      {round.phase === "voting" ? (
        <VotePicker
          seats={seats}
          voterId={seat}
          locked={round.votes?.[seat]}
          busy={busy}
          onVote={(suspectId) => run(() => vote(id!, seat, suspectId), "controller.voteFailed")}
        />
      ) : round.phase === "steal" ? (
        isChameleon ? (
          <StealPicker
            edits={round.edits}
            busy={busy}
            onSteal={(guess) => run(() => steal(id!, guess), "controller.stealFailed")}
          />
        ) : (
          // Naming them costs nothing — the reveal has already happened on the
          // TV, so who they are is public by now — and it makes the wait a
          // person rather than a process.
          <Waiting
            seat={seats.find((s) => s.id === round.chameleonId)}
            headline={seats.find((s) => s.id === round.chameleonId)?.name ?? ""}
            note={t("controller.guessing")}
          />
        )
      ) : round.phase !== "turns" ? (
        /**
         * Two states share this branch and only one of them is an ending. The
         * countdown sits between the last turn and the vote — nothing has
         * finished, the turns have just run out — so it says so, and the round
         * ending is the other line.
         */
        <Waiting
          headline={t(round.phase === "countdown" ? "controller.turnsUp" : "controller.roundOver")}
          note={t(
            round.phase === "countdown" ? "controller.lookUp" : "controller.resultsOnScreen",
          )}
        />
      ) : active === seat ? (
        <Box>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {t("controller.yourTurn")}
          </Typography>
          <Composer
            playerId={seat}
            turnIndex={round.turnIndex}
            edits={round.edits}
            onCommit={handleCommit}
            busy={busy}
          />
        </Box>
      ) : (
        // Whose turn it is, and nothing else. No render mirror, no inspector.
        <Waiting
          seat={seats.find((s) => s.id === active)}
          headline={seats.find((s) => s.id === active)?.name ?? `#${active}`}
          note={t("controller.editing")}
        />
      )}
    </ControllerShell>
  );
}

/**
 * The screen before there is a screen: no room, no seat, no shell to hang one
 * on. Children are rendered as they come — it used to wrap them in a
 * `Typography`, which is a `<p>`, and a `<p>` holding a layout is invalid HTML
 * the moment anything but a sentence goes in it.
 */
function Bare({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: color.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      {children}
    </Box>
  );
}

/** A line of text on a bare screen. */
function Message({ children }: { children: React.ReactNode }) {
  return <Typography sx={{ color: color.muted }}>{children}</Typography>;
}
