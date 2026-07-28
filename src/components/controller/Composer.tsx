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
import { availableTargets, draftToEdit, isDraftSubmittable } from "../../game/composer";
import { supportedCssProperties } from "../../game/css";
import { rankSuggestions } from "../../game/suggest";
import { STYLE_SCHEMA, getKeySchema } from "../../game/content/keySchema";
import type { ComposerDraft, ComposerMove, Edit, EditTarget } from "../../game/types";
import { color, font } from "../../theme/tokens";
import ValueEditor from "./ValueEditor";
import ColorSwatch from "../ColorSwatch";
import { LOREM } from "../../game/constants";

const MOVES: ComposerMove[] = ["style", "value", "text"];

/** A declaration a value move can answer: open, or already set. */
interface Slot {
  key: string;
  /** Undefined while nobody has answered it. */
  value?: string;
}

/**
 * The turn composer.
 *
 * A turn **opens** a declaration by naming it, **answers** one with a value, or
 * **adds text** to a box — which creates its span and hands everyone a new
 * element to work on. Opening is intent without execution; answering commits to
 * somebody's intent, maybe yours, maybe not. Choosing between those is the game,
 * so the moves sit side by side as equals rather than as stages of one flow.
 *
 * Keyboard-first: everyone plays this on a laptop, so the property step is a
 * type-to-filter autocomplete with the curated set pre-listed. Chips are
 * browsable for a player who doesn't know a property exists; typing falls
 * through to every property the browser supports for one who does.
 *
 * Note what this deliberately does *not* do: no progress meter, nothing nudging
 * a player toward filling anything in. Finishing the component was never the
 * goal.
 */
export default function Composer({
  playerId,
  turnIndex,
  edits,
  onCommit,
  busy,
}: {
  playerId: number;
  turnIndex: number;
  /** The log so far, so a value move can list what there is to answer. */
  edits: Edit[];
  onCommit: (edit: Edit) => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ComposerDraft>({});

  const allProperties = useMemo(() => supportedCssProperties(), []);
  const curated = useMemo(() => STYLE_SCHEMA.map((entry) => entry.key), []);

  // A span isn't a place to play until somebody has brought it into being, so
  // the board opens up as the round goes on.
  const targets = useMemo(() => availableTargets(edits), [edits]);
  const isBox = draft.target === "outer" || draft.target === "inner";

  const slots = useMemo(() => slotsFor(edits, draft.target), [edits, draft.target]);
  // Naming something that already exists would blank its value — that isn't a
  // move, it's an accident. Answer it instead.
  const taken = useMemo(() => new Set(slots.map((slot) => slot.key)), [slots]);
  const openable = useMemo(() => curated.filter((key) => !taken.has(key)), [curated, taken]);
  const openableAll = useMemo(
    () => allProperties.filter((key) => !taken.has(key)),
    [allProperties, taken],
  );

  const schema = draft.key ? getKeySchema(draft.key) : undefined;
  const submittable = isDraftSubmittable(draft);
  const valueTouched = Boolean(draft.value?.trim());

  function set(patch: Partial<ComposerDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function commit() {
    if (!submittable) return;
    onCommit(
      draftToEdit(draft, {
        id: `${playerId}-${turnIndex}-${draft.target}-${draft.move}-${draft.key ?? ""}`,
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
          // Changing the target invalidates everything downstream.
          onChange={(_, next) => next && setDraft({ target: next as EditTarget })}
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {targets.map((target) => (
            <ToggleButton key={target} value={target} sx={{ fontFamily: font.mono }}>
              {target}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Step>

      {draft.target && (
        <Step index={2} label={t("composer.move")}>
          <ToggleButtonGroup
            exclusive
            value={draft.move ?? null}
            onChange={(_, next) =>
              next && setDraft({ target: draft.target, move: next as ComposerMove })
            }
            sx={{ flexWrap: "wrap", gap: 0.5 }}
          >
            {MOVES.map((move) => (
              <ToggleButton
                key={move}
                value={move}
                disabled={
                  // Nothing to answer yet, and a span already holds the only
                  // copy there is. Both are facts worth showing, not hiding.
                  (move === "value" && slots.length === 0) ||
                  (move === "text" && !isBox)
                }
                sx={{ fontFamily: font.mono }}
              >
                {t(`composer.moves.${move}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {draft.move === "text" && (
            <Typography variant="caption" sx={{ display: "block", mt: 1, color: color.muted }}>
              {t("composer.textHint")}
            </Typography>
          )}
        </Step>
      )}

      {draft.move === "style" && (
        <Step index={3} label={t("composer.property")}>
          <SearchField
            options={openable}
            searchPool={openableAll}
            inputValue={draft.key ?? ""}
            onInputValueChange={(next) => set({ key: next })}
            placeholder={t("composer.keyPlaceholder")}
          />
          <Typography variant="caption" sx={{ display: "block", mt: 1, color: color.muted }}>
            {t("composer.openHint")}
          </Typography>
        </Step>
      )}

      {draft.move === "value" && (
        <Step index={3} label={t("composer.slot")}>
          <Stack spacing={0.5}>
            {slots.map((slot) => {
              const chosen = draft.key === slot.key;
              return (
                <Button
                  key={slot.key}
                  onClick={() => set({ key: slot.key, value: "" })}
                  variant={chosen ? "contained" : "outlined"}
                  sx={{ justifyContent: "space-between", fontFamily: font.mono }}
                >
                  <Box component="span">{slot.key}</Box>
                  <Box component="span" sx={{ opacity: 0.7, fontSize: "0.85em" }}>
                    {slot.value === undefined ? (
                      t("composer.open")
                    ) : (
                      <>
                        <ColorSwatch value={slot.value} />
                        {slot.value}
                      </>
                    )}
                  </Box>
                </Button>
              );
            })}
          </Stack>
        </Step>
      )}

      {draft.move === "value" && draft.key && (
        <Step index={4} label={t("composer.value")}>
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
 * Every declaration on a target, folded to its current value, open ones first —
 * those are the ones somebody is waiting on.
 */
function slotsFor(edits: Edit[], target?: EditTarget): Slot[] {
  if (!target) return [];
  const byKey = new Map<string, Slot>();

  for (const edit of edits) {
    if (edit.target !== target || edit.kind !== "style") continue;
    byKey.set(edit.key, { key: edit.key, value: edit.value });
  }

  const slots = [...byKey.values()];
  return [
    ...slots.filter((slot) => slot.value === undefined),
    ...slots.filter((slot) => slot.value !== undefined),
  ];
}

/**
 * Type-to-filter field.
 *
 * Controls `inputValue`, never `value`. MUI's Autocomplete keeps those as two
 * separate states — `value` is the *selected option*, `inputValue` is the
 * *text* — and it filters with an empty query whenever the typed text equals
 * the selected value's label and the input is "pristine". Driving `value` from
 * keystrokes makes both conditions permanently true, so the list stops
 * filtering entirely. Here the text *is* the state.
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
        rankSuggestions(
          state.inputValue,
          state.inputValue.trim() ? (searchPool ?? available) : available,
        )
      }
      // params carries Autocomplete's input ref and handlers — spread it as-is.
      // Overriding slotProps.htmlInput here detaches the ref and the field dies.
      renderInput={(params) => <TextField {...params} size="small" placeholder={placeholder} />}
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
        sx={{ display: "block", color: color.muted, mb: 0.75, letterSpacing: "0.08em" }}
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
  const punct = { color: color.inkPunct };

  let body: React.ReactNode = null;
  if (draft.move === "text") {
    body = (
      <>
        <Box component="span" sx={punct}>
          &lt;span&gt;
        </Box>
        {LOREM}
      </>
    );
  } else if (draft.move === "style" && draft.key) {
    // An opening, drawn with the gap it leaves behind for somebody else.
    body = (
      <>
        {draft.key}
        <Box component="span" sx={punct}>
          : …;
        </Box>
      </>
    );
  } else if (draft.move === "value" && draft.key && value) {
    body = (
      <>
        {draft.key}
        <Box component="span" sx={punct}>
          :{" "}
        </Box>
        <ColorSwatch value={value} />
        {value}
        <Box component="span" sx={punct}>
          ;
        </Box>
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
        color: color.flame,
        backgroundColor: color.ink,
        border: `1px solid ${color.inkRule}`,
        overflowX: "auto",
        whiteSpace: "pre",
      }}
    >
      <Box component="span" sx={punct}>
        {draft.target}{" "}
      </Box>
      {body}
    </Box>
  );
}
