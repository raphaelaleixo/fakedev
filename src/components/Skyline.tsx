import { Box } from "@mui/material";

/**
 * Amsterdam, flat.
 *
 * Canal houses with the two gables the city is actually known for — the stepped
 * *trapgevel* and the bell-shaped *klokgevel* — a church spire, and an arched
 * bridge. Drawn as one silhouette so it reads at any size, and filled with
 * `currentColor` so it inherits whatever surface it sits on.
 *
 * The horizon is a shallow arc rather than a straight line: it's the curve of
 * the earth, and it's what turns a skyline into somewhere you travelled to.
 */
export function Skyline({ height = 220 }: { height?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 520 200"
      role="img"
      aria-label="Amsterdam"
      sx={{ display: "block", width: "100%", height: "auto", maxHeight: height, fill: "currentColor" }}
    >
      {/* Westerkerk-ish spire */}
      <path d="M96 66 l10-30 10 30 v6 h-6 v14 h8 v98 h-24 v-98 h8 v-14 h-6 z" />
      <rect x="100" y="110" width="12" height="12" fill="#101935" opacity="0.35" />

      {/* Stepped gable (trapgevel) */}
      <path d="M140 96 h10 v-10 h10 v-10 h10 v-10 h10 v10 h10 v10 h10 v10 h10 v88 h-70 z" />

      {/* Narrow bell gable (klokgevel) */}
      <path d="M218 92 c0-16 8-22 14-22 s14 6 14 22 v92 h-28 z" />

      {/* Plain neck gable, taller */}
      <path d="M254 74 h34 v110 h-34 z" />
      <path d="M254 74 l17-14 17 14 z" />

      {/* Warehouse block with hoist beam */}
      <path d="M296 106 h44 v78 h-44 z" />
      <rect x="314" y="94" width="8" height="14" />

      {/* Second stepped gable, shorter, to break the rhythm */}
      <path d="M348 118 h8 v-9 h8 v-9 h9 v9 h8 v9 h8 v66 h-41 z" />

      {/* Squat canal house */}
      <path d="M398 130 h30 v54 h-30 z" />
      <path d="M398 130 l15-13 15 13 z" />

      {/* Arched bridge, with the arch cut out */}
      <path d="M40 184 h96 v-6 c0-22-20-34-48-34 s-48 12-48 34 z M64 184 c0-16 12-24 24-24 s24 8 24 24 z" />

      {/* Windows, punched as holes in the silhouette */}
      <g fill="#101935" opacity="0.35">
        <rect x="150" y="112" width="8" height="12" />
        <rect x="168" y="112" width="8" height="12" />
        <rect x="150" y="136" width="8" height="12" />
        <rect x="168" y="136" width="8" height="12" />
        <rect x="226" y="112" width="10" height="14" />
        <rect x="226" y="142" width="10" height="14" />
        <rect x="262" y="94" width="8" height="12" />
        <rect x="276" y="94" width="8" height="12" />
        <rect x="262" y="122" width="8" height="12" />
        <rect x="276" y="122" width="8" height="12" />
        <rect x="306" y="122" width="10" height="12" />
        <rect x="324" y="122" width="10" height="12" />
        <rect x="306" y="148" width="10" height="12" />
        <rect x="324" y="148" width="10" height="12" />
        <rect x="358" y="132" width="9" height="12" />
        <rect x="376" y="132" width="9" height="12" />
        <rect x="406" y="146" width="8" height="12" />
      </g>

      {/* The horizon: the curve of the earth. */}
      <path d="M0 200 C 130 176, 390 176, 520 200 z" />
    </Box>
  );
}

/**
 * The plane, holding the empty half of the cover on its own. Same idea as the
 * source: one small mark in a lot of space is what makes it read as a journey.
 */
export function Plane({ size = 64 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      aria-hidden
      sx={{
        display: "block",
        width: size,
        height: size,
        fill: "currentColor",
        transform: "rotate(-16deg)",
      }}
    >
      <path d="M6 54 l88-26 -14 22 -30 6 -8 22 -10 3 1-23 -22 4 z" />
      <path d="M52 56 l26 20 -6 3 -26-17 z" />
    </Box>
  );
}
