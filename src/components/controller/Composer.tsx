import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Autocomplete,
  Box,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { draftToEdit, isDraftSubmittable } from "../../game/composer";
import { supportedCssProperties } from "../../game/css";
import { rankSuggestions } from "../../game/suggest";
import { ATTRIBUTE_SCHEMA, STYLE_SCHEMA, TAG_SUGGESTIONS, getKeySchema } from "../../game/content/keySchema";
import type { ComposerDraft, Edit, EditKind, EditTarget } from "../../game/types";
import { color, font } from "../../theme/tokens";
import ValueEditor from "./ValueEditor";

const TARGETS: EditTarget[] = ["outer", "label", "inner", "text"];
const KINDS: EditKind[] = ["tag", "attribute", "style"];

const isTextTarget = (target?: EditTarget) => target === "label" || target === "text";

/**
 * The turn composer: target, type, key, value.
 *
 * Keyboard-first — everyone plays this on a laptop, so the key step is a
 * type-to-filter autocomplete with the curated set pre-listed. That's both
 * affordances at once: the chips are browsable for a player who doesn't know a
 * property exists, and typing falls through to every property the browser
 * supports for one who does.
 *
 * Note what this deliberately does *not* do: it shows no progress meter, no
 * "3 of 4 slots untouched", nothing that nudges a player toward filling a slot.
 * Leaving `{label}` empty for a whole round is a legitimate and informative
 * play, and the UI must not argue with it.
 */
export default function Composer({
  playerId,
  turnIndex,
  onCommit,
  busy,
}: {
  playerId: number;
  turnIndex: number;
  onCommit: (edit: Edit) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ComposerDraft>({});

  const allProperties = useMemo(() => supportedCssProperties(), []);
  const curatedStyleKeys = useMemo(() => STYLE_SCHEMA.map((entry) => entry.key), []);
  const attributeKeys = useMemo(() => ATTRIBUTE_SCHEMA.map((entry) => entry.key), []);

  const schema = draft.kind === "style" || draft.kind === "attribute"
    ? draft.key
      ? getKeySchema(draft.kind, draft.key)
      : undefined
    : undefined;

  const submittable = isDraftSubmittable(draft);
  const valueTouched = Boolean(draft.value?.trim());

  function set(patch: Partial<ComposerDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function chooseTarget(target: EditTarget) {
    // Changing target invalidates everything downstream.
    setDraft(isTextTarget(target) ? { target, kind: "text" } : { target });
  }

  function commit() {
    if (!submittable) return;
    onCommit(
      draftToEdit(draft, {
        id: `${playerId}-${turnIndex}-${draft.target}-${draft.kind}`,
        playerId,
        turnIndex,
      }),
    );
    setDraft({});
  }

  return (
    <Stack spacing={3}>
      <Step index={1} label={t("composer.target")}>
        <ToggleButtonGroup
          exclusive
          value={draft.target ?? null}
          onChange={(_, next) => next && chooseTarget(next as EditTarget)}
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {TARGETS.map((target) => (
            <ToggleButton key={target} value={target} sx={{ fontFamily: font.mono }}>
              {target}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Step>

      {draft.target && !isTextTarget(draft.target) && (
        <Step index={2} label={t("composer.kind")}>
          <ToggleButtonGroup
            exclusive
            value={draft.kind ?? null}
            onChange={(_, next) =>
              next && setDraft({ target: draft.target, kind: next as EditKind })
            }
            sx={{ flexWrap: "wrap", gap: 0.5 }}
          >
            {KINDS.map((kind) => (
              <ToggleButton key={kind} value={kind} sx={{ fontFamily: font.mono }}>
                {t(`composer.kinds.${kind}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Step>
      )}

      {/* A tag edit's choice is its value — there is no key step. */}
      {draft.kind === "tag" && (
        <Step index={3} label={t("composer.element")}>
          <SearchField
            options={TAG_SUGGESTIONS}
            inputValue={draft.value ?? ""}
            onInputValueChange={(next) => set({ value: next })}
            placeholder={t("composer.elementPlaceholder")}
          />
        </Step>
      )}

      {(draft.kind === "attribute" || draft.kind === "style") && (
        <Step index={3} label={t(`composer.key.${draft.kind}`)}>
          <SearchField
            // Chips are browsable for discovery; typing falls through to every
            // property the browser knows, for recall.
            options={draft.kind === "attribute" ? attributeKeys : curatedStyleKeys}
            searchPool={draft.kind === "style" ? allProperties : undefined}
            inputValue={draft.key ?? ""}
            onInputValueChange={(next) => set({ key: next, value: "" })}
            placeholder={t("composer.keyPlaceholder")}
          />
        </Step>
      )}

      {(isTextTarget(draft.target) ||
        (draft.kind === "attribute" && draft.key) ||
        (draft.kind === "style" && draft.key)) && (
        <Step index={isTextTarget(draft.target) ? 2 : 4} label={t("composer.value")}>
          <ValueEditor
            schema={schema}
            value={draft.value ?? ""}
            onChange={(value) => set({ value })}
            invalid={valueTouched && !submittable}
          />
        </Step>
      )}

      {draft.target && (
        <Box>
          <Preview draft={draft} />
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!submittable || busy}
            onClick={commit}
            sx={{ mt: 1 }}
          >
            {t("composer.commit")}
          </Button>
        </Box>
      )}
    </Stack>
  );
}

/**
 * Type-to-filter field.
 *
 * Controls `inputValue`, never `value`. MUI's Autocomplete keeps those as two
 * separate states — `value` is the *selected option*, `inputValue` is the
 * *text* — and it filters with an empty query whenever the typed text equals
 * the selected value's label and the input is "pristine". Driving `value` from
 * keystrokes makes both conditions permanently true, so the list stops
 * filtering entirely. Here the text *is* the state, so `inputValue` is the only
 * thing to control.
 */
function SearchField({
  options,
  searchPool,
  inputValue,
  onInputValueChange,
  placeholder,
}: {
  /** Shown before anything is typed — the browsable, curated set. */
  options: string[];
  /** Searched once the player types. Defaults to `options`. */
  searchPool?: string[];
  inputValue: string;
  onInputValueChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Autocomplete
      freeSolo
      openOnFocus
      selectOnFocus
      handleHomeEndKeys
      options={options}
      inputValue={inputValue}
      onInputChange={(_, next) => onInputValueChange(next)}
      filterOptions={(available, state) =>
        rankSuggestions(state.inputValue, state.inputValue.trim() ? (searchPool ?? available) : available)
      }
      // params carries Autocomplete's input ref and handlers — spread it as-is.
      // Overriding slotProps.htmlInput here detaches the ref and the field dies.
      renderInput={(params) => (
        <TextField {...params} size="small" placeholder={placeholder} />
      )}
    />
  );
}

function Step({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ display: "block", color: color.muted, mb: 0.75, letterSpacing: "0.06em" }}
      >
        {index}. {label.toUpperCase()}
      </Typography>
      {children}
    </Box>
  );
}

/** What will land on the inspector, in the inspector's own vernacular. */
function Preview({ draft }: { draft: ComposerDraft }) {
  const value = draft.value?.trim() ?? "";
  if (!value) return null;

  let body: React.ReactNode = null;
  if (draft.kind === "text") {
    body = <Box component="span" sx={{ color: color.value }}>&quot;{value}&quot;</Box>;
  } else if (draft.kind === "tag") {
    body = <Box component="span" sx={{ color: color.tag }}>&lt;{value}&gt;</Box>;
  } else if (draft.key) {
    body = (
      <>
        <Box component="span" sx={{ color: color.attr }}>{draft.key}</Box>
        <Box component="span" sx={{ color: color.muted }}>
          {draft.kind === "style" ? ": " : "="}
        </Box>
        <Box component="span" sx={{ color: color.value }}>
          {draft.kind === "style" ? value : `"${value}"`}
        </Box>
        {draft.kind === "style" && <Box component="span" sx={{ color: color.muted }}>;</Box>}
      </>
    );
  }

  if (!body) return null;

  return (
    <Box
      sx={{
        p: 1,
        fontFamily: font.mono,
        fontSize: "0.9rem",
        backgroundColor: color.chrome,
        border: `1px solid ${color.rule}`,
        overflowX: "auto",
        whiteSpace: "pre",
      }}
    >
      <Box component="span" sx={{ color: color.muted }}>{draft.target} </Box>
      {body}
    </Box>
  );
}
