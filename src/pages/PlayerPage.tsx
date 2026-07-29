import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useGame } from "../contexts/GameContext";
import ControllerShell from "../components/controller/ControllerShell";
import Composer from "../components/controller/Composer";
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

  if (notFound) return <Bare>{t("room.notFound", { code: id })}</Bare>;
  if (loading || !roomState) {
    return (
      <Bare>
        <CircularProgress />
      </Bare>
    );
  }

  const slot = roomState.players.find((p) => p.id === seat);
  if (!slot || slot.status === "empty") return <Bare>{t("controller.badSeat")}</Bare>;

  const round = matchState?.round;
  if (!round) return <Bare>{t("controller.waitingForStart")}</Bare>;

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
          <Waiting>{t("controller.stealWait")}</Waiting>
        )
      ) : round.phase !== "turns" ? (
        <Waiting>{t("controller.lookUp")}</Waiting>
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
        <Waiting>
          {t("controller.otherTurn", {
            name: roomState.players.find((p) => p.id === active)?.name ?? `#${active}`,
          })}
        </Waiting>
      )}
    </ControllerShell>
  );
}

function Waiting({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography sx={{ color: color.muted, fontSize: "1.2rem" }}>{children}</Typography>
    </Box>
  );
}

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
      <Typography sx={{ color: color.muted }}>{children}</Typography>
    </Box>
  );
}
