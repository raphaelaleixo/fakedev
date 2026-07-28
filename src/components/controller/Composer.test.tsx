import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import Composer from "./Composer";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import type { Edit } from "../../game/types";

function renderComposer(
  onCommit: (edit: Edit) => void = () => undefined,
  edits: Edit[] = [],
) {
  return {
    user: userEvent.setup(),
    ...render(
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <Composer playerId={2} turnIndex={4} edits={edits} onCommit={onCommit} />
        </I18nextProvider>
      </ThemeProvider>,
    ),
  };
}

const anOpenProperty: Edit = {
  id: "open-1",
  playerId: 1,
  turnIndex: 0,
  target: "inner",
  kind: "style",
  key: "border-radius",
};

const aSetProperty: Edit = {
  id: "set-1",
  playerId: 1,
  turnIndex: 1,
  target: "inner",
  kind: "style",
  key: "color",
  value: "red",
};

const aTextMove: Edit = {
  id: "text-1",
  playerId: 1,
  turnIndex: 2,
  target: "inner-text",
  kind: "text",
};

describe("Composer", () => {
  test("opens on the two boxes, since no span exists yet", () => {
    renderComposer();
    expect(screen.getByRole("button", { name: "outer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "inner" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "inner-text" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Commit" })).toBeNull();
  });

  /** The text move pays forward: it hands everyone a new element to style. */
  test("offers a span as a target once its text move has been played", () => {
    renderComposer(() => undefined, [aTextMove]);
    expect(screen.getByRole("button", { name: "inner-text" })).toBeInTheDocument();
  });

  test("never nudges a player toward filling anything in", () => {
    const { container } = renderComposer();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.textContent).not.toMatch(/of 2|of 4|remaining|untouched/i);
  });

  test("offers the three moves once a target is chosen", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "outer" }));
    for (const move of ["name a property", "give a value", "add text"]) {
      expect(screen.getByRole("button", { name: move })).toBeInTheDocument();
    }
  });

  /**
   * The heart of the split: naming a property is the whole turn. Somebody else
   * decides what it becomes.
   */
  test("ends the turn at the name when opening a property", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit);
    await user.click(screen.getByRole("button", { name: "outer" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "border-radius");

    expect(screen.queryByPlaceholderText("type a value…")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Commit" }));

    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ target: "outer", kind: "style", key: "border-radius" }),
    );
    expect(onCommit.mock.calls[0][0]).not.toHaveProperty("value");
  });

  test("commits a text move with nothing to choose", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit);
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "add text" }));
    await user.click(screen.getByRole("button", { name: "Commit" }));

    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ target: "inner-text", kind: "text" }),
    );
  });

  /** A span already holds the only copy there is. */
  test("refuses a text move on a span", async () => {
    const { user } = renderComposer(() => undefined, [aTextMove]);
    await user.click(screen.getByRole("button", { name: "inner-text" }));
    expect(screen.getByRole("button", { name: "add text" })).toBeDisabled();
  });

  test("has nothing to answer when the log is empty", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "outer" }));
    expect(screen.getByRole("button", { name: "give a value" })).toBeDisabled();
  });

  test("lists what is waiting on an answer, open ones first", async () => {
    const { user } = renderComposer(() => undefined, [aSetProperty, anOpenProperty]);
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "give a value" }));

    const choices = screen
      .getAllByRole("button")
      .map((b) => b.textContent ?? "")
      .filter((label) => label.includes("border-radius") || label.includes("color"));
    expect(choices[0]).toContain("border-radius");
    expect(choices[0]).toContain("waiting");
  });

  test("answers an open declaration", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit, [anOpenProperty]);
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "give a value" }));
    await user.click(screen.getByRole("button", { name: /border-radius/ }));
    await user.type(screen.getByRole("spinbutton"), "12");
    await user.click(screen.getByRole("button", { name: "Commit" }));

    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "style", key: "border-radius", value: "12px" }),
    );
  });

  test("clears the draft after a commit, so the next turn starts clean", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "add text" }));
    await user.click(screen.getByRole("button", { name: "Commit" }));
    expect(screen.queryByRole("button", { name: "Commit" })).toBeNull();
  });

  /**
   * Regression: Autocomplete filters with an empty query whenever the typed
   * text equals the selected value's label and the input is pristine.
   */
  test("filters the property list down as you type", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));

    const field = screen.getByPlaceholderText("type to search…");
    await user.click(field);
    const unfiltered = screen.getAllByRole("option").length;

    await user.type(field, "display");
    const filtered = screen.getAllByRole("option").map((o) => o.textContent);

    expect(filtered.length).toBeLessThan(unfiltered);
    expect(filtered).toContain("display");
  });

  test("offers properties starting with the query before ones merely containing it", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "color");

    expect(screen.getAllByRole("option").map((o) => o.textContent)[0]).toBe("color");
  });

  test("reaches properties outside the curated set once you type", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "grid-template");

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options.some((o) => o?.startsWith("grid-template"))).toBe(true);
  });

  test("resets downstream choices when the target changes", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));
    expect(screen.getByPlaceholderText("type to search…")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "outer" }));
    expect(screen.queryByPlaceholderText("type to search…")).toBeNull();
  });
});
