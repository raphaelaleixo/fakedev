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

describe("Composer", () => {
  test("opens asking only which element, since there are only two", () => {
    renderComposer();
    expect(screen.getByRole("button", { name: "outer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "inner" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Commit" })).toBeNull();
  });

  test("never nudges a player toward filling anything in", () => {
    const { container } = renderComposer();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.textContent).not.toMatch(/of 2|of 4|remaining|untouched/i);
  });

  test("offers the five moves once an element is chosen", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "outer" }));
    for (const move of [
      "element",
      "name an attribute",
      "name a property",
      "text",
      "give a value",
    ]) {
      expect(screen.getByRole("button", { name: move })).toBeInTheDocument();
    }
  });

  /**
   * The heart of the split: naming a property is the whole turn. Somebody else
   * decides what it becomes — which is the extend-or-start-fresh decision the
   * paper game turns on.
   */
  test("ends the turn at the name when opening a property", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit);
    await user.click(screen.getByRole("button", { name: "outer" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "border-radius");

    // No value step at all.
    expect(screen.queryByPlaceholderText("type a value…")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Commit" }));

    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ target: "outer", kind: "style", key: "border-radius" }),
    );
    expect(onCommit.mock.calls[0][0]).not.toHaveProperty("value");
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

  test("lets a value land on something already set, which is how overriding works", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit, [aSetProperty]);
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "give a value" }));
    expect(screen.getByRole("button", { name: /color/ })).toBeInTheDocument();
  });

  test("commits outer's text onto the {label} slot", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit);
    await user.click(screen.getByRole("button", { name: "outer" }));
    await user.click(screen.getByRole("button", { name: "text" }));
    await user.type(screen.getByPlaceholderText("type a value…"), "Lorem ipsum");
    await user.click(screen.getByRole("button", { name: "Commit" }));

    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ target: "label", kind: "text", value: "Lorem ipsum" }),
    );
  });

  test("treats the element choice as the value, with no key step", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit);
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "element" }));
    await user.type(screen.getByPlaceholderText("div, button, input…"), "button");
    await user.click(screen.getByRole("button", { name: "Commit" }));

    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ target: "inner", kind: "tag", value: "button" }),
    );
  });

  test("refuses to commit text past the layout cap", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "outer" }));
    await user.click(screen.getByRole("button", { name: "text" }));
    await user.type(screen.getByPlaceholderText("type a value…"), "x".repeat(30));
    expect(screen.getByRole("button", { name: "Commit" })).toBeDisabled();
  });

  test("clears the draft after a commit, so the next turn starts clean", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "text" }));
    await user.type(screen.getByPlaceholderText("type a value…"), "Continue");
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

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options[0]).toBe("color");
  });

  test("reaches properties outside the curated set once you type", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "grid-template");

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options.some((o) => o?.startsWith("grid-template"))).toBe(true);
  });

  test("resets downstream choices when the element changes", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "name a property" }));
    expect(screen.getByPlaceholderText("type to search…")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "outer" }));
    expect(screen.queryByPlaceholderText("type to search…")).toBeNull();
  });
});
