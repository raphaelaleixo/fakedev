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
    renderCanvas();
    // Turn 6 set the button green, turn 9 overrode it to blue. Both stay.
    expect(screen.getByText("#34a853")).toBeInTheDocument();
    expect(screen.getByText("#1a73e8")).toBeInTheDocument();
  });

  test("credits each declaration to its author", () => {
    renderCanvas();
    expect(screen.getAllByText("Rafa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Joost").length).toBeGreaterThan(0);
  });

  test("renders the component into a fully sandboxed stage", () => {
    const { container } = renderCanvas();
    const iframe = container.querySelector("iframe");
    // An empty sandbox blocks scripts entirely — this is what makes the
    // free-form value field safe without a blacklist.
    expect(iframe?.getAttribute("sandbox")).toBe("");
    expect(iframe?.getAttribute("srcdoc")).toContain("Continue");
  });

  test("applies the winning value, not the superseded one, to the render", () => {
    const { container } = renderCanvas();
    const srcdoc = container.querySelector("iframe")?.getAttribute("srcdoc") ?? "";
    expect(srcdoc).toContain("#1a73e8");
    expect(srcdoc).not.toContain("#34a853");
  });

  test("renders an untouched round without falling over", () => {
    const { container } = renderCanvas(0);
    expect(container.querySelector("iframe")).toBeTruthy();
    expect(screen.getAllByText("nothing yet")).toHaveLength(4);
  });
});
