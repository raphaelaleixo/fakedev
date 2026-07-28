import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { StealPicker, VotePicker } from "./VoteControls";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import { MOCK_EDITS, MOCK_SEATS, MOCK_SLATE } from "../../mocks/fixtures";
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

  test("shows the locked choice and stops offering others", () => {
    show(<VotePicker seats={MOCK_SEATS} voterId={1} locked={4} onVote={() => undefined} />);
    expect(screen.getByText("Ines")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock it in" })).toBeNull();
  });
});

describe("StealPicker", () => {
  const steal = (onSteal = () => undefined) =>
    show(<StealPicker slate={MOCK_SLATE} edits={MOCK_EDITS} onSteal={onSteal} />);

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

  test("offers both slates", () => {
    steal();
    expect(screen.getByRole("button", { name: "Wireframe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Primary Button" })).toBeInTheDocument();
  });

  /** Splitting the guess is what keeps catching the Chameleon worth doing. */
  test("needs an answer on both axes before it will commit", async () => {
    const onSteal = vi.fn();
    const { user } = steal(onSteal);
    const confirm = () => screen.getByRole("button", { name: "That's my answer" });

    expect(confirm()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Brutalist" }));
    expect(confirm()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Avatar" }));
    expect(confirm()).toBeEnabled();

    await user.click(confirm());
    expect(onSteal).toHaveBeenCalledWith({ styleId: "brutalist", componentId: "avatar" });
  });

  test("never names the Secret before the guess is made", () => {
    const { container } = steal();
    // The slate contains it as an option, but nothing marks which one it is.
    expect(container.innerHTML).not.toContain("chameleon");
    expect(container.textContent).not.toContain("The Secret");
  });
});
