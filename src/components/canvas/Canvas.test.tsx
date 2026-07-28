import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
        <Canvas round={mockRound(turnsPlayed)} seats={MOCK_SEATS} scores={{ 1: 3, 2: 1 }} />
      </I18nextProvider>
    </ThemeProvider>,
  );
}

describe("Canvas", () => {
  /** The heading says where you are in the match, never what is being built. */
  test("names the round, not the thing being built", () => {
    renderCanvas();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
  });

  test("never puts either half of the Secret on the big screen", () => {
    const { container } = renderCanvas();
    expect(screen.queryByText(/Primary Button/)).toBeNull();
    expect(screen.queryByText(/Material/)).toBeNull();
    expect(container.innerHTML).not.toContain("primary-button");
    expect(container.innerHTML).not.toContain("material");
  });

  test("never puts the Chameleon's identity on the big screen", () => {
    const { container } = renderCanvas();
    // Seat 4 is the Chameleon in the fixture; their name appears as a player,
    // but nothing may mark them out.
    expect(container.innerHTML).not.toContain("chameleon");
  });

  /**
   * The brief is what this view is — nothing else on the big screen names it —
   * so it is the heading, not a subtitle under one that does not exist. Before
   * this the page opened at h2 with no h1 above it, which is also why focus
   * routing had nothing to land on when you arrived mid-round.
   */
  test("makes the brief the view's one heading", () => {
    const { container } = renderCanvas();
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Round 1");
  });

  /** Turn order is an ordered list of people, so it is an ordered list. */
  test("lists the contributors in turn order, marking whose turn it is", () => {
    // Mid-round: the default fixture is a finished one, where nobody is up.
    renderCanvas(3);
    const contributors = screen.getByRole("list", { name: /contributors/i });
    // Per item rather than on textContent: each row carries an avatar whose
    // initial would otherwise read as part of the name.
    const rows = within(contributors).getAllByRole("listitem");
    ["Rafa", "Ana", "Tom", "Ines", "Joost"].forEach((name, i) => {
      expect(within(rows[i]).getByText(name)).toBeInTheDocument();
    });

    expect(rows.filter((row) => row.getAttribute("aria-current") === "true")).toHaveLength(1);
  });

  /**
   * Points are match totals, not round scores, so the sidebar doubles as the
   * standings. A player with none shows a zero rather than a blank — a gap
   * where a number should be reads as broken, not as nothing yet.
   */
  test("shows every contributor's running points, zero included", () => {
    renderCanvas(3);
    const rows = within(screen.getByRole("list", { name: /contributors/i })).getAllByRole(
      "listitem",
    );
    expect(within(rows[0]).getByText("3 points")).toBeInTheDocument();
    expect(within(rows[1]).getByText("1 point")).toBeInTheDocument();
    expect(within(rows[2]).getByText("0 points")).toBeInTheDocument();
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
    expect(text).toContain("<span");
    expect(text).toContain("Lorem ipsum dolor sit");
    expect(text).toContain("</span>");
    expect(text).toContain("</div>");
  });

  /** Everything is a div or a span — every shape was drawn with CSS. */
  test("never invents a tag or an attribute, because neither is a move", () => {
    const { container } = renderCanvas();
    const text = container.textContent ?? "";
    expect(text).not.toContain("<button");
    expect(text).not.toContain("role=");
  });

  test("keeps a whole opening tag on one line", () => {
    const { container } = renderCanvas();
    expect(container.textContent).toContain("style={ background-color: #1a73e8");
  });

  test("shows a declaration nobody has answered, with the gap left in it", () => {
    const { container } = renderCanvas();
    // Turn 8 opened `border-radius` and no one ever answered it.
    expect(container.textContent).toContain("border-radius: …");
  });

  /**
   * The text move creates the span, so a round where nobody played it has no
   * span at all — and that emptiness is information about the Secret.
   */
  test("shows no span until somebody adds text", () => {
    const { container } = renderCanvas(4);
    expect(container.textContent).not.toContain("<span");
    expect(renderCanvas(5).container.textContent).toContain("<span");
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
