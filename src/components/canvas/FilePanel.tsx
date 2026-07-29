import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { color, font } from "../../theme/tokens";

/**
 * A file on a repository: a header naming it, its contents beneath.
 *
 * The board uses it during the round and the render uses it at the end, which
 * is the point — the same panel holds the code you wrote and the thing it turns
 * out to be, so the payoff arrives in the frame you have been staring at rather
 * than as a picture from somewhere else.
 *
 * The header is the only lifted surface; the contents sit straight on the
 * field, because a panel behind them would put a second box around something
 * the border already encloses.
 */
export default function FilePanel({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: 0,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        border: `1px solid ${color.inkRule}`,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: `1px solid ${color.inkRule}`,
          backgroundColor: color.inkPanel,
          // Mono here is the exception that proves the rule: it is a file name,
          // which is part of the board rather than chrome around it.
          fontFamily: font.mono,
          fontSize: "0.8rem",
          color: color.muted,
        }}
      >
        {name}
      </Box>
      {children}
    </Box>
  );
}
