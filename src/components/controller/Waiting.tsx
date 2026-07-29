import { Box, Typography } from "@mui/material";
import type { SeatInfo } from "../canvas/LiveInspector";
import SeatAvatar from "../canvas/SeatAvatar";
import { color, font, pulse } from "../../theme/tokens";

/**
 * The screen a controller mostly is.
 *
 * At five players you spend eight turns of every ten watching somebody else
 * take theirs, and that is before the countdown, the reveal and the steal. This
 * is not an interstitial between the interesting screens — it is the resting
 * state of the device, and it was a grey sentence in the middle of an empty
 * panel.
 *
 * So it says who, with the face the rest of the game draws them with, and what
 * they are doing under it. Waiting on a *person* is a different feeling from
 * waiting on a *process*, and naming them is what makes looking up at the room
 * the obvious next move — which is the whole design of the controller: heads
 * up, TV in the middle.
 *
 * `role="status"` because these change without being asked for. A player who
 * cannot see the screen still needs to know whose turn it became.
 */
export default function Waiting({
  seat,
  headline,
  note,
}: {
  /** The person being waited on, when there is one. */
  seat?: SeatInfo;
  headline: string;
  /** What they are doing — read as a continuation of the headline. */
  note?: string;
}) {
  return (
    <Box
      role="status"
      sx={{
        py: 6,
        display: "grid",
        justifyItems: "center",
        gap: 2,
        textAlign: "center",
      }}
    >
      {/* The breathing is on the avatar rather than the text: a line that
          pulses is hard to read, and a person who is thinking is the thing
          actually in motion here. */}
      {seat && (
        <Box sx={pulse()}>
          <SeatAvatar seat={seat} lit size={72} />
        </Box>
      )}

      <Box>
        <Typography
          sx={{
            fontFamily: font.display,
            fontWeight: 800,
            fontSize: "clamp(1.4rem, 7vw, 2rem)",
            lineHeight: 1.1,
            color: color.paper,
          }}
        >
          {headline}
        </Typography>
        {note && (
          <Typography sx={{ mt: 0.5, color: color.muted, fontFamily: font.display }}>
            {note}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
