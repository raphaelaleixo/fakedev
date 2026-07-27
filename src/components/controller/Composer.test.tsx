import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import Composer from "./Composer";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import type { Edit } from "../../game/types";

function renderComposer(onCommit: (edit: Edit) => void = () => undefined) {
  return {
    user: userEvent.setup(),
    ...render(
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <Composer playerId={2} turnIndex={4} onCommit={onCommit} />
        </I18nextProvider>
      </ThemeProvider>,
    ),
  };
}

const commitButton = () => screen.getByRole("button", { name: "Commit" });

describe("Composer", () => {
  test("opens on the target step alone, with nothing else to answer yet", () => {
    renderComposer();
    for (const target of ["outer", "label", "inner", "text"]) {
      expect(screen.getByRole("button", { name: target })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "css" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Commit" })).toBeNull();
  });

  test("never nudges a player toward filling a slot", () => {
    const { container } = renderComposer();
    // No progress meter, no counter, nothing implying targets are chores.
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.textContent).not.toMatch(/of 4|remaining|untouched/i);
  });

  test("takes a text slot straight to its value, skipping the type step", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "label" }));
    expect(screen.queryByRole("button", { name: "css" })).toBeNull();
    expect(screen.getByPlaceholderText("type a value…")).toBeInTheDocument();
  });

  test("asks an element for a type before anything else", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    expect(screen.getByRole("button", { name: "css" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("type a value…")).toBeNull();
  });

  test("commits a text edit", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit);
    await user.click(screen.getByRole("button", { name: "text" }));
    await user.type(screen.getByPlaceholderText("type a value…"), "Continue");
    await user.click(commitButton());

    expect(onCommit).toHaveBeenCalledWith({
      id: "2-4-text-text",
      playerId: 2,
      turnIndex: 4,
      target: "text",
      kind: "text",
      value: "Continue",
    });
  });

  test("keeps commit disabled until the draft is actually valid", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "label" }));
    expect(commitButton()).toBeDisabled();
    await user.type(screen.getByPlaceholderText("type a value…"), "Lorem ipsum");
    expect(commitButton()).toBeEnabled();
  });

  test("refuses to commit text past the layout cap", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "label" }));
    const field = screen.getByPlaceholderText("type a value…");
    await user.type(field, "x".repeat(30));
    // The field itself is uncapped for unlisted keys, so the gate is the button.
    expect((field as HTMLInputElement).value.length).toBeGreaterThan(24);
    expect(commitButton()).toBeDisabled();
  });

  test("treats the element choice as the value, with no key step", async () => {
    const onCommit = vi.fn();
    const { user } = renderComposer(onCommit);
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "element" }));
    await user.type(screen.getByPlaceholderText("div, button, input…"), "button");
    await user.click(commitButton());

    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ target: "inner", kind: "tag", value: "button" }),
    );
  });

  test("clears the draft after a commit, so the next turn starts clean", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "text" }));
    await user.type(screen.getByPlaceholderText("type a value…"), "Continue");
    await user.click(commitButton());
    expect(screen.queryByRole("button", { name: "Commit" })).toBeNull();
  });

  /**
   * Regression: Autocomplete filters with an empty query whenever the typed
   * text equals the selected value's label and the input is pristine. Driving
   * `value` from keystrokes made both permanently true, so the list showed
   * everything no matter what you typed.
   */
  test("filters the property list down as you type", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "css" }));

    const field = screen.getByPlaceholderText("type to search…");
    await user.click(field);
    const unfiltered = screen.getAllByRole("option").length;

    await user.type(field, "display");
    const filtered = screen.getAllByRole("option").map((o) => o.textContent);

    expect(filtered.length).toBeLessThan(unfiltered);
    expect(filtered).toContain("display");
    expect(filtered.every((o) => o?.includes("display"))).toBe(true);
  });

  test("offers properties starting with the query before ones merely containing it", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "css" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "color");

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options[0]).toBe("color");
    expect(options.indexOf("color")).toBeLessThan(options.indexOf("background-color"));
  });

  test("reaches properties outside the curated set once you type", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "css" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "grid-template");

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options.length).toBeGreaterThan(0);
    // grid-template-* is nowhere in STYLE_SCHEMA; it comes from the browser.
    expect(options.some((o) => o?.startsWith("grid-template"))).toBe(true);
  });

  test("filters the attribute list too", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "attribute" }));
    await user.type(screen.getByPlaceholderText("type to search…"), "dis");

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["disabled"]);
  });

  test("resets downstream choices when the target changes", async () => {
    const { user } = renderComposer();
    await user.click(screen.getByRole("button", { name: "inner" }));
    await user.click(screen.getByRole("button", { name: "css" }));
    expect(screen.getByPlaceholderText("type to search…")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "label" }));
    expect(screen.queryByPlaceholderText("type to search…")).toBeNull();
  });
});
