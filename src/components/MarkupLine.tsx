import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { color, font } from "../theme/tokens";

/**
 * The primitives the whole game is drawn with: a line of syntax-highlighted
 * markup. The lobby uses them to render the room as a DOM node; the Live
 * Inspector will use the same pieces for the edit log, so authorship tinting
 * and strikethroughs stay consistent between the two screens.
 */

export function Punct({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: color.muted }}>{children}</Box>;
}

export function Tag({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: color.tag }}>{children}</Box>;
}

export function Attr({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: color.attr }}>{children}</Box>;
}

export function Value({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: color.value }}>{children}</Box>;
}

export function Comment({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ color: color.muted, fontStyle: "italic" }}>
      {"<!-- "}
      {children}
      {" -->"}
    </Box>
  );
}

/** An attribute pair: `name="value"`, with the quotes in the value color. */
export function Pair({ name, children }: { name: string; children: ReactNode }) {
  return (
    <>
      {" "}
      <Attr>{name}</Attr>
      <Punct>=</Punct>
      <Value>&quot;{children}&quot;</Value>
    </>
  );
}

/** A swatch rendered inline, the way DevTools previews a color value. */
export function Swatch({ value }: { value: string }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-block",
        width: "0.7em",
        height: "0.7em",
        mr: 0.5,
        verticalAlign: "baseline",
        border: `1px solid ${color.rule}`,
        backgroundColor: value,
      }}
    />
  );
}

export function MarkupLine({
  indent = 0,
  highlight = false,
  children,
  sx,
}: {
  indent?: number;
  /** DevTools' selected-node wash. Used for the newest arrival. */
  highlight?: boolean;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        fontFamily: font.mono,
        fontSize: "clamp(0.85rem, 1.6vw, 1.35rem)",
        lineHeight: 1.9,
        whiteSpace: "pre",
        overflowX: "auto",
        pl: `${indent * 2}ch`,
        backgroundColor: highlight ? color.selection : "transparent",
        transition: "background-color 600ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
