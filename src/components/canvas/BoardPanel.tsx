import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { foldEdits } from "../../game/fold";
import type { Edit } from "../../game/types";
import { color, font } from "../../theme/tokens";
import LiveInspector, { type SeatInfo } from "./LiveInspector";

/**
 * The board, as a file on a repository: a header naming it, the code beneath.
 *
 * Shared by the turns screen and the vote, because **the board does not go away
 * when the voting starts**. In the paper game the drawing is still on the table
 * while everyone points at each other, and the whole question of the vote — who
 * was working toward the Secret — is answered by what is on it. Taking it away
 * turns a deduction into a memory test.
 *
 * The header is the only lifted surface; the code sits straight on the field,
 * because a panel behind it would put a second box around something the border
 * already encloses.
 */
export default function BoardPanel({ edits, seats }: { edits: Edit[]; seats: SeatInfo[] }) {
  const { t } = useTranslation();

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
        {t("canvas.fileName")}
      </Box>
      <LiveInspector
        edits={edits}
        tree={foldEdits(edits)}
        seats={seats}
        sx={{ border: "none", backgroundColor: "transparent" }}
      />
    </Box>
  );
}
