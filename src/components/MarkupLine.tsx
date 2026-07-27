import { Box } from "@mui/material";
import { type ReactNode } from "react";
import { color, font } from "../theme/tokens";

/**
 * The primitives the game draws markup with: one line of syntax-highlighted
 * code. The lobby renders the room as a DOM node with them.
 *
 * Everything sits on ink now, so there is one keying — `flame` gets to be a
 * text colour here, which it can't be on white.
 */
const ink = {
  tag: color.inkTag,
  attr: color.inkAttr,
  value: color.inkValue,
  punct: color.inkPunct,
};

export function Punct({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: ink.punct }}>{children}</Box>;
}

export function Tag({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: ink.tag }}>{children}</Box>;
}

export function Attr({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: ink.attr }}>{children}</Box>;
}

export function Value({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ color: ink.value }}>{children}</Box>;
}

export function Comment({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ color: ink.punct, fontStyle: "italic" }}>
      {"<!-- "}
      {children}
      {" -->"}
    </Box>
  );
}

/** An attribute pair: `name="value"`, with the quotes in the value colour. */
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

/** A swatch rendered inline, the way DevTools previews a colour value. */
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
  /** A wash for the newest arrival. */
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
        backgroundColor: highlight ? "rgba(255, 151, 46, 0.18)" : "transparent",
        transition: "background-color 600ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
