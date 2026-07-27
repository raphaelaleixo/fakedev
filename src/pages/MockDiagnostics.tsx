import { useMemo, useState } from "react";
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";
import { supportedCssProperties } from "../game/css";
import { rankSuggestions } from "../game/suggest";
import { STYLE_SCHEMA } from "../game/content/keySchema";
import { color, font } from "../theme/tokens";

/**
 * DEV-only isolation panel for the autocomplete.
 *
 * A and B already pass, so MUI and the ranking function are both cleared. C
 * changed two things at once — a controlled `inputValue`, and swapping the
 * search pool to the full browser property list — so C1 and C2 vary exactly one
 * of those each.
 */
const TINY = ["display", "direction", "border-radius", "color", "background-color"];

export default function MockDiagnostics() {
  const all = useMemo(() => supportedCssProperties(), []);
  const curated = useMemo(() => STYLE_SCHEMA.map((e) => e.key), []);

  return (
    <Box sx={{ p: 3, maxWidth: 780, mx: "auto", fontFamily: font.mono }}>
      <Typography variant="h3" gutterBottom>
        Autocomplete diagnostics
      </Typography>
      <Typography sx={{ color: color.muted, mb: 1 }}>
        Type <strong>d</strong> in C1 and C2. Each caption prints what the component
        actually sees — that readout matters more than the dropdown.
      </Typography>

      <Box sx={{ p: 2, mb: 4, border: `2px solid ${color.flame}`, fontSize: "0.85rem", lineHeight: 1.9 }}>
        <div>
          <strong>D — data only, no MUI.</strong>
        </div>
        <div>
          supportedCssProperties().length = <strong>{all.length}</strong>
        </div>
        <div>first 8: {all.slice(0, 8).join(", ") || "(EMPTY)"}</div>
        <div>rankSuggestions(&quot;d&quot;, all).length = <strong>{rankSuggestions("d", all).length}</strong></div>
        <div>first 6 of those: {rankSuggestions("d", all).slice(0, 6).join(", ") || "(none)"}</div>
      </Box>

      <Stack spacing={4}>
        <Probe
          title="C1 — controlled inputValue, SMALL pool (isolates the controlled input)"
          options={TINY}
          pool={TINY}
          controlled
        />
        <Probe
          title="C2 — uncontrolled, FULL browser pool (isolates the pool swap)"
          options={curated}
          pool={all}
          controlled={false}
        />
        <Probe
          title="C3 — both, exactly as the composer does it"
          options={curated}
          pool={all}
          controlled
        />
      </Stack>
    </Box>
  );
}

function Probe({
  title,
  options,
  pool,
  controlled,
}: {
  title: string;
  options: string[];
  pool: string[];
  controlled: boolean;
}) {
  const [text, setText] = useState("");
  const [seen, setSeen] = useState<{ query: string; count: number }>({ query: "-", count: -1 });

  return (
    <Box sx={{ p: 2, border: `1px solid ${color.inkRule}` }}>
      <Typography variant="caption" sx={{ display: "block", color: color.muted, mb: 1 }}>
        {title}
      </Typography>
      <Autocomplete
        freeSolo
        openOnFocus
        options={options}
        {...(controlled ? { inputValue: text, onInputChange: (_: unknown, next: string) => setText(next) } : {})}
        filterOptions={(available, state) => {
          const query = state.inputValue;
          const result = rankSuggestions(query, query.trim() ? pool : available);
          // Record what filterOptions was actually handed. If `query` stays ""
          // while you type, the component never sees your keystrokes.
          if (seen.query !== query || seen.count !== result.length) {
            queueMicrotask(() => setSeen({ query, count: result.length }));
          }
          return result;
        }}
        renderInput={(p) => <TextField {...p} size="small" />}
      />
      <Typography variant="caption" sx={{ color: color.muted, display: "block", mt: 1 }}>
        filterOptions saw inputValue = <strong>{JSON.stringify(seen.query)}</strong> · returned{" "}
        <strong>{seen.count}</strong> options
        {controlled ? ` · state = ${JSON.stringify(text)}` : ""}
      </Typography>
    </Box>
  );
}
