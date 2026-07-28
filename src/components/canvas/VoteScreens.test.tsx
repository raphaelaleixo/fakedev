import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { ResultScreen, RevealScreen, StealScreen, VotingScreen } from "./VoteScreens";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import { MOCK_SEATS, MOCK_SLATE, mockRoundAt } from "../../mocks/fixtures";
import type { ReactElement } from "react";

const show = (ui: ReactElement) =>
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </ThemeProvider>,
  );

const SCORES = { 1: 3, 2: 1, 4: 2, 5: 1 };

describe("VotingScreen", () => {
  test("shows who has locked a vote without showing what they picked", () => {
    const round = mockRoundAt("voting");
    const { container } = show(<VotingScreen round={round} seats={MOCK_SEATS} />);

    expect(screen.getAllByText("locked in")).toHaveLength(5);
    // Seat 4 is the Chameleon; nothing may point at anyone yet.
    expect(container.textContent).not.toContain("→");
  });

  test("distinguishes players still deciding", () => {
    const round = { ...mockRoundAt("voting"), votes: { 1: 4, 2: 4 } };
    show(<VotingScreen round={round} seats={MOCK_SEATS} />);
    expect(screen.getAllByText("locked in")).toHaveLength(2);
    expect(screen.getAllByText("deciding")).toHaveLength(3);
  });
});

describe("RevealScreen", () => {
  test("shows every vote at once", () => {
    show(<RevealScreen round={mockRoundAt("reveal")} seats={MOCK_SEATS} onDone={() => undefined} />);
    // Ines drew three votes; Rafa and Ana drew one each.
    expect(screen.getByText("(3)")).toBeInTheDocument();
    expect(screen.getAllByText("(1)")).toHaveLength(2);
  });

  test("moves the round on by itself, so nobody has to click", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    show(<RevealScreen round={mockRoundAt("reveal")} seats={MOCK_SEATS} onDone={onDone} />);
    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onDone).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("StealScreen", () => {
  test("never shows the slate on the big screen", () => {
    const { container } = show(<StealScreen round={mockRoundAt("steal")} seats={MOCK_SEATS} />);
    for (const id of [...MOCK_SLATE.styles, ...MOCK_SLATE.components]) {
      expect(container.innerHTML).not.toContain(id);
    }
    expect(container.textContent).not.toContain("Progress Bar");
  });
});

describe("ResultScreen", () => {
  const props = {
    seats: MOCK_SEATS,
    scores: SCORES,
    finished: false,
    onNext: () => undefined,
  };

  /**
   * The round is spent reading code, so this is the first time anyone sees the
   * thing they built. It's the payoff, which is why it lands here.
   */
  test("shows the render for the first time, in a fully sandboxed stage", () => {
    const { container } = show(
      <ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />,
    );
    const iframe = container.querySelector("iframe");
    // An empty sandbox blocks scripts entirely — what makes free-form values
    // safe without a blacklist.
    expect(iframe?.getAttribute("sandbox")).toBe("");
    expect(iframe?.getAttribute("srcdoc")).toContain("Lorem ipsum dolor sit");
  });

  test("renders the winning value, not the one it overrode", () => {
    const { container } = show(
      <ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />,
    );
    const srcdoc = container.querySelector("iframe")?.getAttribute("srcdoc") ?? "";
    expect(srcdoc).toContain("#1a73e8");
    expect(srcdoc).not.toContain("#34a853");
  });

  test("leaves a declaration nobody answered out of the render", () => {
    const { container } = show(
      <ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />,
    );
    // Turn 8 opened `role` and no one answered it.
    expect(container.querySelector("iframe")?.getAttribute("srcdoc")).not.toContain("role");
  });

  test("reveals both halves of the Secret", () => {
    show(<ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />);
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Progress Bar")).toBeInTheDocument();
  });

  test("names the Chameleon even when they were caught and lost", () => {
    show(<ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />);
    expect(screen.getByText(/Ines was the Chameleon, got caught, and got neither/)).toBeInTheDocument();
  });

  test("credits naming both halves", () => {
    show(
      <ResultScreen
        round={mockRoundAt("result", { styleId: "material", componentId: "progress-bar" })}
        {...props}
      />,
    );
    expect(screen.getByText(/named both/)).toBeInTheDocument();
  });

  test("credits naming half of it, and pays both sides", () => {
    show(
      <ResultScreen
        round={mockRoundAt("result", { styleId: "material", componentId: "avatar" })}
        {...props}
      />,
    );
    expect(screen.getByText(/named half of it/)).toBeInTheDocument();
    // Chameleon +1, and the three correct voters +1 each.
    expect(screen.getAllByText("+1")).toHaveLength(4);
  });

  test("shows what a failed steal guessed", () => {
    show(<ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />);
    expect(screen.getByText(/They guessed Wireframe · Avatar/)).toBeInTheDocument();
  });

  test("shows this round's points beside the running totals", () => {
    show(<ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />);
    // Seats 1, 2 and 5 voted correctly.
    expect(screen.getAllByText("+1")).toHaveLength(3);
  });

  test("offers the next round while the match is live", () => {
    show(<ResultScreen round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })} {...props} />);
    expect(screen.getByRole("button", { name: "Next round" })).toBeInTheDocument();
  });

  test("declares the winner instead once the match is over", () => {
    show(
      <ResultScreen
        round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })}
        {...props}
        finished
        winnerIds={[1]}
      />,
    );
    expect(screen.getByText("Rafa wins")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next round" })).toBeNull();
  });

  test("shares the win when two players tie at the top", () => {
    show(
      <ResultScreen
        round={mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" })}
        {...props}
        finished
        winnerIds={[1, 2]}
      />,
    );
    expect(screen.getByText("Rafa & Ana wins")).toBeInTheDocument();
  });
});
