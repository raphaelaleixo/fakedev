import {
  Box,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { SWATCHES } from "../../game/constants";
import type { KeySchemaEntry } from "../../game/types";
import { color, font } from "../../theme/tokens";

/**
 * The value step. The editor is chosen by the key's declared `valueType`, and
 * anything without an authored schema falls through to a free-form field —
 * which is the whole point of treating the key schema as suggestions rather
 * than a whitelist. A property nobody bothered to author still works.
 */
export default function ValueEditor({
  schema,
  value,
  onChange,
  invalid,
}: {
  schema?: KeySchemaEntry;
  value: string;
  onChange: (value: string) => void;
  /** True once the player has typed something the browser can't parse. */
  invalid?: boolean;
}) {
  const { t } = useTranslation();

  switch (schema?.valueType) {
    case "enum":
      return <Choices options={schema.options ?? []} value={value} onChange={onChange} />;

    case "color":
      return <ColorEditor value={value} onChange={onChange} invalid={invalid} />;

    case "length":
      return <LengthEditor schema={schema} value={value} onChange={onChange} />;

    default:
      return (
        <FreeText
          value={value}
          onChange={onChange}
          invalid={invalid}
          maxLength={schema?.valueType === "freetext" ? schema.maxLength : undefined}
          placeholder={t("composer.valuePlaceholder")}
        />
      );
  }
}

function Choices({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, next) => next && onChange(next)}
      sx={{ flexWrap: "wrap", gap: 0.5 }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} sx={{ fontFamily: font.mono }}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function ColorEditor({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Stack spacing={1}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {SWATCHES.map((swatch) => (
          <Box
            key={swatch}
            component="button"
            type="button"
            aria-label={swatch}
            onClick={() => onChange(swatch)}
            sx={{
              width: 34,
              height: 34,
              cursor: "pointer",
              backgroundColor: swatch,
              border:
                value === swatch ? `3px solid ${color.flame}` : `1px solid ${color.inkRule}`,
            }}
          />
        ))}
      </Box>
      {/* The palette is the fast path, not the only path. */}
      <FreeText
        value={value}
        onChange={onChange}
        invalid={invalid}
        placeholder={t("composer.colorPlaceholder")}
      />
    </Stack>
  );
}

function LengthEditor({
  schema,
  value,
  onChange,
}: {
  schema: KeySchemaEntry;
  value: string;
  onChange: (value: string) => void;
}) {
  const units = schema.units ?? ["px"];
  const match = /^(-?[\d.]+)(.*)$/.exec(value.trim());
  const amount = match?.[1] ?? "";
  const unit = match?.[2] || units[0];

  return (
    <Stack direction="row" spacing={1}>
      <TextField
        type="number"
        size="small"
        value={amount}
        onChange={(e) => onChange(`${e.target.value}${unit}`)}
        slotProps={{
          htmlInput: { min: schema.min, max: schema.max, step: schema.step ?? 1 },
        }}
        sx={{ width: 130 }}
      />
      {units.length > 1 || units[0] !== "" ? (
        <Select
          size="small"
          value={unit}
          onChange={(e) => onChange(`${amount}${e.target.value}`)}
          sx={{ fontFamily: font.mono, minWidth: 88 }}
        >
          {units.map((u) => (
            <MenuItem key={u} value={u} sx={{ fontFamily: font.mono }}>
              {u || "—"}
            </MenuItem>
          ))}
        </Select>
      ) : null}
    </Stack>
  );
}

function FreeText({
  value,
  onChange,
  invalid,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const cap = maxLength ?? undefined;

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        error={invalid}
        slotProps={{ htmlInput: { maxLength: cap, spellCheck: false, autoCapitalize: "off" } }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        <Typography variant="caption" sx={{ color: invalid ? color.flame : color.muted }}>
          {invalid ? t("composer.invalidValue") : ""}
        </Typography>
        {cap ? (
          <Typography variant="caption" sx={{ color: color.muted }}>
            {value.length}/{cap}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
