import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { RoomState } from "react-gameroom";
import AppHeader from "./AppHeader";
import type { SeatColor } from "../game/types";
import { color } from "../theme/tokens";

/**
 * Masthead, then the page.
 *
 * Five pages were each writing out the same four declarations — full height,
 * ink, paper, a flex column — followed by `<AppHeader />` and a `<main>`. Which
 * is fine until one of them forgets the `<main>`, which is exactly what had
 * happened: only the cover had a landmark until recently, so on every other
 * page there was no way past the masthead.
 *
 * The cover is deliberately not built on this. It has no masthead, its footer
 * sits outside `main`, and it is the one page whose shape is the point.
 */
export default function PageShell({
  children,
  roomState,
  seatName,
  seatColor,
  /** Lets a screen fill the viewport itself — the room does, a form does not. */
  fill,
}: {
  children: ReactNode;
  roomState?: RoomState;
  seatName?: string;
  seatColor?: SeatColor;
  fill?: boolean;
}) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        backgroundColor: color.ink,
        color: color.paper,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppHeader roomState={roomState} seatName={seatName} seatColor={seatColor} />
      <Box
        component="main"
        sx={fill ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : undefined}
      >
        {children}
      </Box>
    </Box>
  );
}
