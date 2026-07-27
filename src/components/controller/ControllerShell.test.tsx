import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import ControllerShell from "./ControllerShell";
import i18n from "../../i18n";
import theme from "../../theme/theme";

function show(isChameleon: boolean) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <ControllerShell
            isChameleon={isChameleon}
            secret={isChameleon ? undefined : { style: "Brutalist", component: "Progress Bar" }}
            seatName="Rafa"
            seatColor="crimson"
          >
            <div>body</div>
          </ControllerShell>
        </I18nextProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("ControllerShell", () => {
  test("shows a Dev both halves of the Secret", () => {
    show(false);
    expect(screen.getByText("Brutalist")).toBeInTheDocument();
    expect(screen.getByText("Progress Bar")).toBeInTheDocument();
    expect(screen.queryByText("FAKE DEV")).toBeNull();
  });

  test("shows the Chameleon neither half", () => {
    const { container } = show(true);
    expect(screen.getByText("FAKE DEV")).toBeInTheDocument();
    expect(container.textContent).not.toContain("Brutalist Progress Bar");
  });

  /**
   * The decks are public knowledge in any game you've played twice, so showing
   * them leaks nothing — it just lets the Chameleon pick a hypothesis and play
   * toward it instead of improvising.
   */
  test("offers the Chameleon both decks to aim at", () => {
    const { container } = show(true);
    expect(screen.getByText("Everything it could be")).toBeInTheDocument();
    expect(container.textContent).toContain("Neumorphic");
    expect(container.textContent).toContain("Toggle Switch");
  });

  test("never offers the decks to a Dev, who has no use for them", () => {
    show(false);
    expect(screen.queryByText("Everything it could be")).toBeNull();
  });
});
