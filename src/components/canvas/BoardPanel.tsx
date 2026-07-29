import { useTranslation } from "react-i18next";
import { foldEdits } from "../../game/fold";
import type { Edit } from "../../game/types";
import FilePanel from "./FilePanel";
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
 * The panel chrome is `FilePanel`, shared with the render at the end of the
 * round: the code you wrote and the thing it turned out to be arrive in the
 * same frame.
 */
export default function BoardPanel({ edits, seats }: { edits: Edit[]; seats: SeatInfo[] }) {
  const { t } = useTranslation();

  return (
    <FilePanel name={t("canvas.fileName")}>
      <LiveInspector
        edits={edits}
        tree={foldEdits(edits)}
        seats={seats}
        sx={{ border: "none", backgroundColor: "transparent" }}
      />
    </FilePanel>
  );
}
