import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { StealPicker, VotePicker } from "./VoteControls";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import { MOCK_EDITS, MOCK_SEATS } from "../../mocks/fixtures";
import { COMPONENTS, STYLES } from "../../game/content/deck";
import type { ReactElement } from "react";

function show(ui: ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
      </ThemeProvider>,
    ),
  };
}

describe("VotePicker", () => {
  test("offers everyone but you — nobody points at themselves", () => {
    show(<VotePicker seats={MOCK_SEATS} voterId={3} onVote={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Tom" })).toBeNull();
    for (const name of ["Rafa", "Ana", "Ines", "Joost"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  test("locks on confirm, not on tap", async () => {
    const onVote = vi.fn();
    const { user } = show(
      <VotePicker seats={MOCK_SEATS} voterId={1} onVote={onVote} />,
    );
    await user.click(screen.getByRole("button", { name: "Ines" }));
    expect(onVote).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Lock it in" }));
    expect(onVote).toHaveBeenCalledWith(4);
  });

  /**
   * The list stays. Who you were choosing between is most of what you want to
   * look at while everyone else decides, and a screen that rearranges itself
   * the moment you commit makes committing feel like leaving the room.
   *
   * Nothing in it is a control any more, though — there is nothing left to
   * press, so the rows stop being buttons rather than becoming buttons you are
   * refused.
   */
  test("keeps everyone on screen once the vote is in, and marks the choice", () => {
    show(<VotePicker seats={MOCK_SEATS} voterId={1} locked={4} onVote={() => undefined} />);

    for (const name of ["Ana", "Tom", "Ines", "Joost"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("Ines").closest("[aria-current]")).not.toBeNull();
  });
});

describe("StealPicker", () => {
  const steal = (onSteal = () => undefined) =>
    show(<StealPicker edits={MOCK_EDITS} onSteal={onSteal} />);

  /** Type enough to identify a card, then take the highlighted option. */
  const name = async (user: UserEvent, field: string, text: string) => {
    await user.click(screen.getByRole("combobox", { name: field }));
    await user.keyboard(text);
    await user.keyboard("{Enter}");
  };

  /**
   * `rules.md` forbids the render on a controller. This is the deliberate
   * exception: the paper game's fake artist guesses while looking at the
   * finished drawing, and withholding it would make our steal strictly harder
   * than the source it was balanced against.
   */
  test("shows the Chameleon what the table built before they guess", () => {
    const { container } = steal();
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute("sandbox")).toBe("");
    expect(iframe?.getAttribute("srcdoc")).toContain("Lorem ipsum dolor sit");
  });

  /**
   * The whole deck on both axes, not five drawn at random. The decks are
   * already public on the Chameleon's own controller, so a slate never hid
   * anything — it narrowed a guess that should reward having read the board.
   */
  test("offers every card on both axes", async () => {
    const { user } = steal();
    await user.click(screen.getByRole("combobox", { name: "What style was it?" }));
    expect(screen.getAllByRole("option")).toHaveLength(STYLES.length);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("combobox", { name: "And what was it?" }));
    expect(screen.getAllByRole("option")).toHaveLength(COMPONENTS.length);
  });

  /** Splitting the guess is what keeps catching the Chameleon worth doing. */
  test("needs an answer on both axes before it will commit", async () => {
    const onSteal = vi.fn();
    const { user } = steal(onSteal);
    const confirm = () => screen.getByRole("button", { name: "That's my answer" });

    expect(confirm()).toBeDisabled();
    await name(user, "What style was it?", "Brutal");
    expect(confirm()).toBeDisabled();
    await name(user, "And what was it?", "Avat");
    expect(confirm()).toBeEnabled();

    await user.click(confirm());
    expect(onSteal).toHaveBeenCalledWith({ styleId: "brutalist", componentId: "avatar" });
  });

  test("never names the Secret before the guess is made", () => {
    const { container } = steal();
    // Every card is an option, and nothing marks which one is the answer.
    expect(container.innerHTML).not.toContain("chameleon");
    expect(container.textContent).not.toContain("The Secret");
  });
});
