import { useId, useState } from "react";
import { Autocomplete, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { COMPONENTS, STYLES } from "../../game/content/deck";
import { foldEdits } from "../../game/fold";
import RenderWindow from "../canvas/RenderWindow";
import SeatAvatar from "../canvas/SeatAvatar";
import type { Card, Edit, StealGuess } from "../../game/types";
import { chosen, color, dim, font } from "../../theme/tokens";
import type { SeatInfo } from "../canvas/LiveInspector";

/**
 * Pick a player, confirm, locked. Everyone votes, the Chameleon included —
 * they point to blend in, exactly as the fake artist does on paper.
 */
export function VotePicker({
  seats,
  voterId,
  locked,
  onVote,
  busy,
}: {
  seats: SeatInfo[];
  voterId: number;
  /** Whom this player already voted for, if they have. */
  locked?: number;
  onVote: (suspectId: number) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number | null>(null);

  const lockedIn = locked !== undefined;
  // You cannot point at yourself.
  const suspects = seats.filter((seat) => seat.id !== voterId);

  return (
    /**
     * Heading, the people, the button. It scrolls as one thing: the frame is
     * fixed to the viewport now, so nothing can end up underneath the role bar
     * — which was the actual problem with the confirm — and a list that scrolls
     * inside a second scroll area is one more thing to get stuck in.
     */
    <Stack spacing={2}>
      <Typography variant="h4">{t("vote.heading")}</Typography>

      <Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
        {suspects.map((seat) => (
          <Box component="li" key={seat.id} sx={{ display: "grid" }}>
            <Suspect
              seat={seat}
              // The committed vote once there is one, not what this device
              // last tapped: a player who rejoins mid-vote has no local state
              // and still has to be shown who they pointed at.
              picked={lockedIn ? locked === seat.id : picked === seat.id}
              /**
               * Still on screen once the vote is in, rather than replaced by a
               * summary of it. Who you were choosing between is most of what
               * you want to look at while everyone else decides — and a screen
               * that rearranges itself the moment you commit makes the commit
               * feel like leaving the room.
               */
              locked={lockedIn}
              onPick={() => setPicked(seat.id)}
            />
          </Box>
        ))}
      </Stack>

      {lockedIn ? (
        <Typography role="status" sx={{ color: color.muted, textAlign: "center" }}>
          {t("vote.lockedIn")}
        </Typography>
      ) : (
        <Button
          variant="contained"
          size="large"
          disabled={picked === null || busy}
          onClick={() => picked !== null && onVote(picked)}
        >
          {t("vote.confirm")}
        </Button>
      )}
    </Stack>
  );
}

/**
 * One person to point at: the avatar the rest of the game draws them with, and
 * their name.
 *
 * The avatar rather than a colour bar and a mono name, because this is the one
 * screen where you are picking a *person* — and it was the third different way
 * the app drew one.
 */
function Suspect({
  seat,
  picked,
  locked,
  onPick,
}: {
  seat: SeatInfo;
  picked: boolean;
  locked: boolean;
  onPick: () => void;
}) {
  const face = (
    <>
      <SeatAvatar seat={seat} lit={!locked || picked} size={32} />
      <Box
        component="span"
        sx={{
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: "1.1rem",
          textTransform: "none",
        }}
      >
        {seat.name}
      </Box>
    </>
  );

  const shape = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 1.5,
    px: 2,
    py: 1.25,
    borderRadius: 1,
    border: `2px solid ${color.inkRule}`,
  } as const;

  // Not a disabled button: there is nothing left to press, so it stops being a
  // control at all rather than becoming a control you are refused.
  if (locked) {
    return (
      <Box
        aria-current={picked || undefined}
        sx={{
          ...shape,
          ...(picked ? chosen : { color: dim(color.paper, 55) }),
        }}
      >
        {face}
      </Box>
    );
  }

  return (
    <Button
      onClick={onPick}
      variant="outlined"
      color="secondary"
      size="large"
      sx={{ ...shape, width: "100%", color: color.paper, ...(picked && chosen) }}
    >
      {face}
    </Button>
  );
}

/**
 * The caught Chameleon's guess: one answer per axis, from five of each.
 *
 * Splitting it is what keeps catching them worth doing. With both halves hidden
 * a single all-or-nothing guess would be 4% blind, so being caught would cost
 * the Chameleon almost nothing to recover from. Per-axis, each half is a real
 * 20% gamble and a good read on one is worth a point.
 *
 * **This is the one place a controller shows the render**, which `rules.md`
 * otherwise forbids. The exception keeps the steal as fair as the paper game's,
 * where the fake guesses while looking at the finished drawing. The Devs still
 * don't see it — the TV holds the render for resolution.
 */
export function StealPicker({
  edits,
  onSteal,
  busy,
}: {
  /** The round's log, so the Chameleon can see what the table built. */
  edits: Edit[];
  onSteal: (guess: StealGuess) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [styleId, setStyleId] = useState<string | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);

  return (
    <Stack spacing={2}>
      <Box sx={{ height: 240, flex: "none" }}>
        <RenderWindow tree={foldEdits(edits)} title={t("canvas.renderWindow")} />
      </Box>
      <Typography sx={{ color: color.muted }}>{t("steal.oneShot")}</Typography>

      <Deck heading={t("steal.headingStyle")} cards={STYLES} picked={styleId} onPick={setStyleId} />
      <Deck
        heading={t("steal.headingComponent")}
        cards={COMPONENTS}
        picked={componentId}
        onPick={setComponentId}
      />

      <Button
        variant="contained"
        size="large"
        disabled={!styleId || !componentId || busy}
        onClick={() => styleId && componentId && onSteal({ styleId, componentId })}
      >
        {t("steal.confirm")}
      </Button>
    </Stack>
  );
}

/**
 * One axis of the guess, over the whole deck.
 *
 * It used to be five cards drawn at random with the answer among them, which
 * made a caught Chameleon's guess a one-in-five lottery — and both decks are
 * already public on their controller, so the slate was never hiding anything.
 * It was narrowing. Naming from the full deck means a Chameleon who read the
 * board beats one who did not, which is the only version of this worth
 * playing.
 *
 * A dropdown rather than thirteen chips, because this is a phone and the list
 * is long enough that typing two letters beats scrolling.
 */
function Deck({
  heading,
  cards,
  picked,
  onPick,
}: {
  heading: string;
  cards: Card[];
  picked: string | null;
  onPick: (id: string) => void;
}) {
  const { t } = useTranslation();
  const fieldId = useId();

  return (
    <Box>
      {/* A real `label` for a real field, rather than a heading that happens to
          sit above one — `htmlFor` is what gives the combobox its name, and
          `id` on the Autocomplete is what MUI puts on the input. */}
      <Typography component="label" htmlFor={fieldId} variant="h4" sx={{ display: "block", mb: 1 }}>
        {heading}
      </Typography>
      <Autocomplete
        id={fieldId}
        openOnFocus
        autoHighlight
        disablePortal
        options={cards}
        value={cards.find((card) => card.id === picked) ?? null}
        getOptionLabel={(card) => t(card.labelKey)}
        isOptionEqualToValue={(card, value) => card.id === value.id}
        onChange={(_, card) => card && onPick(card.id)}
        renderInput={(params) => <TextField {...params} placeholder={t("steal.pick")} />}
      />
    </Box>
  );
}
