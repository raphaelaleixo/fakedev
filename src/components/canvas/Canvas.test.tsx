import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import Canvas from "./Canvas";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import { MOCK_SEATS, mockRound } from "../../mocks/fixtures";

function renderCanvas(turnsPlayed?: number) {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <Canvas round={mockRound(turnsPlayed)} seats={MOCK_SEATS} />
      </I18nextProvider>
    </ThemeProvider>,
  );
}

describe("Canvas", () => {
  test("shows the Category, which is public all round", () => {
    renderCanvas();
    expect(screen.getByText("Web Annoyances")).toBeInTheDocument();
  });

  test("never puts the Secret on the big screen", () => {
    const { container } = renderCanvas();
    expect(screen.queryByText(/Cookie Consent Banner/)).toBeNull();
    expect(container.innerHTML).not.toContain("cookie-consent-banner");
  });

  test("never puts the Chameleon's identity on the big screen", () => {
    const { container } = renderCanvas();
    // Seat 4 is the Chameleon in the fixture; their name appears as a player,
    // but nothing may mark them out.
    expect(container.innerHTML).not.toContain("chameleon");
  });

  test("names the player whose turn it is", () => {
    renderCanvas(3);
    expect(screen.getByText("Ines is editing")).toBeInTheDocument();
  });

  test("counts the turn out of two trips around the table", () => {
    renderCanvas(3);
    expect(screen.getByText("Turn 4 of 10")).toBeInTheDocument();
  });

  test("keeps a superseded declaration visible so it can be struck through", () => {
    // Turn 6 set the button green, turn 9 overrode it to blue. Both stay.
    const { container } = renderCanvas();
    expect(container.textContent).toContain("#34a853");
    expect(container.textContent).toContain("#1a73e8");
  });

  test("credits each declaration to its author", () => {
    renderCanvas();
    expect(screen.getAllByText("Rafa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Joost").length).toBeGreaterThan(0);
  });

  /**
   * The round is spent reading code. Showing the render here would display the
   * least interesting thing on screen, and would make every opening move look
   * like a no-op.
   */
  test("shows no render during turns — the code is the canvas", () => {
    const { container } = renderCanvas();
    expect(container.querySelector("iframe")).toBeNull();
  });

  test("draws the blank round as two empty divs", () => {
    const { container } = renderCanvas(0);
    expect(container.textContent).toContain("<div><div></div></div>");
  });

  test("draws the DOM itself, nested, not a list of edits about it", () => {
    const { container } = renderCanvas();
    const text = container.textContent ?? "";
    expect(text).toContain("<div");
    expect(text).toContain("Lorem ipsum dolor sit");
    expect(text).toContain("<button");
    expect(text).toContain("</button>");
    expect(text).toContain("</div>");
  });

  test("keeps the whole opening tag on one line", () => {
    const { container } = renderCanvas();
    expect(container.textContent).toContain("style={ display: flex; padding: 20px }");
  });

  test("shows a declaration nobody has answered, with the gap left in it", () => {
    const { container } = renderCanvas();
    // Turn 8 opened `role` and no one ever answered it.
    expect(container.textContent).toContain('role="…"');
  });

  /**
   * One line per declaration: the name in the opener's colour, the value in the
   * answerer's, and anything overridden trailing as a comment. Three turns of
   * history, one line, no strikethrough.
   */
  test("comments an overridden value instead of striking it out", () => {
    const { container } = renderCanvas();
    expect(container.textContent).toContain("background-color: #1a73e8 /* #34a853 */");
  });

  test("collapses an opening and its answer into a single line", () => {
    const { container } = renderCanvas();
    const text = container.textContent ?? "";
    expect(text).toContain("display: flex");
    // The opening no longer occupies a line of its own.
    expect(text).not.toContain("display: …");
  });

  /**
   * The round is spent reading code. A render here would show the least
   * interesting thing on screen, and would make every opening look like a no-op.
   */
  test("shows no render during turns — the code is the canvas", () => {
    const { container } = renderCanvas();
    expect(container.querySelector("iframe")).toBeNull();
  });

  test("renders an untouched round without falling over", () => {
    const { container } = renderCanvas(0);
    expect(container.textContent).toContain("<div>");
    expect(container.querySelector("iframe")).toBeNull();
  });
});
