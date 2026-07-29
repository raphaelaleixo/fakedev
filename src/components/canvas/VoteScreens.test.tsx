import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { CountdownOverlay } from "./VoteScreens";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import type { ReactElement } from "react";

const show = (ui: ReactElement) =>
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </ThemeProvider>,
  );


describe("CountdownOverlay", () => {
  /**
   * The board stays put through the countdown. It used to be a screen of its
   * own, so the board left when the turns ended and came back when the vote
   * opened — two changes for a moment that is really one.
   */
  test("covers the view without replacing it", () => {
    const { container } = show(
      <>
        <p>the board</p>
        <CountdownOverlay onDone={() => undefined} />
      </>,
    );
    expect(screen.getByText("the board")).toBeInTheDocument();
    expect(container.textContent).toContain("3");
  });
});
