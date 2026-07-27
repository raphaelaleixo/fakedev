import { useMemo } from "react";
import { Box } from "@mui/material";
import { buildStageDocument } from "../../game/render";
import type { RenderTree } from "../../game/types";
import { color } from "../../theme/tokens";

/**
 * The live visual output of the component.
 *
 * Rendered inside an iframe with an empty `sandbox`, which is what makes the
 * free-form value field safe to offer: `position: fixed`, `z-index: 9999` and
 * `width: 99999px` are structurally trapped in here, and scripts can't run at
 * all. No value blacklist is needed, and none exists.
 */
export default function RenderWindow({ tree, title }: { tree: RenderTree; title: string }) {
  const srcDoc = useMemo(() => buildStageDocument(tree), [tree]);

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        border: `1px solid ${color.rule}`,
        backgroundColor: color.paper,
        overflow: "hidden",
      }}
    >
      <Box
        component="iframe"
        title={title}
        srcDoc={srcDoc}
        sandbox=""
        sx={{ display: "block", width: "100%", height: "100%", border: 0 }}
      />
    </Box>
  );
}
