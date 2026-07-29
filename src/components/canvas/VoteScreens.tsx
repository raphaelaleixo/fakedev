import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { color } from "../../theme/tokens";

/**
 * The moment between the last turn and the vote.
 *
 * The vote itself, and everything after it, is `ResolutionScreen` — one
 * component for all four beats, because the list of people has to survive them
 * intact.
 */

/**
 * 3… 2… 1… Point! — over the board, not instead of it.
 *
 * It used to be a screen of its own, which meant the board left when the turns
 * ended and came back when the vote opened: two changes for a moment that is
 * really one. As an overlay the board never moves. The countdown arrives on top
 * of it, and when it goes the only thing that has changed is the column.
 *
 * The scrim is a real translucent surface rather than dimming — the board has
 * to still be *there* behind it, which is the whole point of putting it over
 * the board.
 */
export function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [tick, setTick] = useState(3);

  useEffect(() => {
    if (tick <= 0) {
      const done = setTimeout(onDone, 700);
      return () => clearTimeout(done);
    }
    const timer = setTimeout(() => setTick((n) => n - 1), 900);
    return () => clearTimeout(timer);
  }, [tick, onDone]);

  return (
    <Box
      // The room is told to look up; nothing here is interactive.
      role="status"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        display: "grid",
        placeItems: "center",
        backgroundColor: `color-mix(in oklab, ${color.ink} 88%, transparent)`,
      }}
    >
      <Typography
        key={tick}
        variant="h1"
        sx={{
          fontSize: "clamp(6rem, 22vw, 18rem)",
          color: tick > 0 ? color.paper : color.flame,
          animation: "pop 220ms ease-out",
          "@keyframes pop": {
            from: { scale: "0.7", opacity: 0 },
            to: { scale: "1", opacity: 1 },
          },
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        {tick > 0 ? tick : t("vote.point")}
      </Typography>
    </Box>
  );
}
