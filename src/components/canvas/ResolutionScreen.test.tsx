import { describe, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import type { ReactElement } from "react";
import ResolutionScreen, { type ResolutionPhase } from "./ResolutionScreen";
import i18n from "../../i18n";
import theme from "../../theme/theme";
import { MOCK_SEATS, mockRoundAt } from "../../mocks/fixtures";
import { COMPONENTS, STYLES } from "../../game/content/deck";
import type { Round } from "../../game/types";

const show = (ui: ReactElement) =>
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </ThemeProvider>,
  );

const SCORES = { 1: 3, 2: 1, 4: 2, 5: 1 };
const RESULT = mockRoundAt("result", { styleId: "wireframe", componentId: "avatar" });

function beat(round: Round, extra: Partial<Parameters<typeof ResolutionScreen>[0]> = {}) {
  return show(
    <ResolutionScreen
      round={round}
      phase={round.phase as ResolutionPhase}
      seats={MOCK_SEATS}
      scores={SCORES}
      finished={false}
      onRevealDone={() => undefined}
      onNext={() => undefined}
      onNewGame={() => undefined}
      {...extra}
    />,
  );
}

/**
 * The vote is the first beat of this screen, not a screen of its own — one
 * component across all four, so the list of people is the same DOM from the
 * first vote to the last point. See the note on the component.
 */
describe("ResolutionScreen, voting", () => {
  const voting = (round: Round) => beat(round, { phase: "voting" });

  /**
   * The board is the evidence. Taking it away at the moment everyone has to
   * decide who was not working toward the Secret turns a deduction into a
   * memory test — in the paper game the drawing is still on the table.
   */
  test("keeps the board on screen while the room votes", () => {
    const { container } = voting(mockRoundAt("voting"));
    expect(container.textContent).toContain("untitled-component.html");
    expect(container.textContent).toContain("display");
  });

  /** The round keeps its heading, with the question inside the column. */
  test("heads the board with the round and the column with the question", () => {
    voting(mockRoundAt("voting"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Round 1");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Who's the fake dev?");
  });

  /** One number, so nobody has to count ten cards to know when to look up. */
  test("counts who has locked in", () => {
    voting({ ...mockRoundAt("voting"), votes: { 1: 4, 2: 4 } });
    expect(screen.getByText("2 of 5 locked in")).toBeInTheDocument();
  });

  test("shows who has locked a vote without showing what they picked", () => {
    const { container } = voting(mockRoundAt("voting"));
    expect(screen.getAllByText("locked in")).toHaveLength(5);
    // Seat 4 is the Chameleon; nothing may point at anyone yet.
    expect(container.textContent).not.toContain("→");
  });

  test("distinguishes players still deciding", () => {
    voting({ ...mockRoundAt("voting"), votes: { 1: 4, 2: 4 } });
    expect(screen.getAllByText("locked in")).toHaveLength(2);
    expect(screen.getAllByText("deciding")).toHaveLength(3);
  });
});

describe("ResolutionScreen", () => {
  /**
   * Seat order, every beat of the round.
   *
   * The rows are carried across from the vote by the browser, so re-ranking
   * them here would scramble the list at the same moment it is widening — and
   * at the tally it would sort by votes the room has not been shown yet, which
   * gives the count away before it is counted. The people stay where they were;
   * the numbers beside them are what changes.
   */
  test.each(["reveal", "steal", "result"] as const)("keeps seat order at the %s", (phase) => {
    // Scores and votes that would both re-rank the list if anything sorted it.
    const { container } = beat(mockRoundAt(phase), { scores: { 1: 0, 2: 9, 4: 0, 5: 4 } });
    const names = [...container.querySelectorAll("li")].map((row) => row.textContent);
    MOCK_SEATS.forEach((seat, i) => expect(names[i]).toContain(seat.name));
  });

  /**
   * Three beats of one page. The frame — the round's name — is the thing that
   * holds still while the middle changes, so the room's attention is not thrown
   * somewhere new three times in eight seconds.
   */
  /**
   * "Round 1" is the board's heading and leaves with it, so the space above the
   * left column stays empty while the votes are counted — which is what makes
   * the render arriving feel like an arrival rather than a swap.
   *
   * Still *mounted* while that happens, because it is sliding rather than
   * disappearing, so the check is that it has left the accessibility tree: a
   * room being told who the Impostor was should not also be told the page is
   * about Round 1.
   */
  test("takes the round's heading away with the board", () => {
    for (const phase of ["reveal", "steal"] as const) {
      const { unmount } = beat(mockRoundAt(phase));
      expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
      unmount();
    }
  });

  /**
   * The Secret is what nobody was allowed to say all round, so it takes the
   * heading at exactly the moment saying it stops being forbidden.
   */
  test("replaces it with the Secret once the answer is out", () => {
    beat(RESULT);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Material · Primary Button");
  });

  test("gives the file its real name in the same breath", () => {
    const { container } = beat(RESULT);
    expect(container.textContent).toContain("material-primary-button.html");
  });
});

describe("the reveal beat", () => {
  /**
   * The vote's question and the tally's title are one heading a beat apart, and
   * so are "Round 1" and the Secret — which is why both carry a transition
   * name. Without a visible heading here there would be nothing for the
   * question to become.
   */
  test("heads the list, so the vote's question has somewhere to land", () => {
    beat(mockRoundAt("reveal"));
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("The votes");
    expect(screen.getByRole("complementary")).toHaveAttribute("aria-labelledby", heading.id);
  });

  test("shows who every player pointed at", () => {
    beat(mockRoundAt("reveal"));
    // Rafa, Ana and Joost pointed at Ines; Tom at Ana; Ines at Rafa.
    expect(screen.getAllByText("Ines")).not.toHaveLength(0);
    expect(screen.getAllByText("Rafa")).not.toHaveLength(0);
  });

  test("moves the round on by itself, so nobody has to click", () => {
    vi.useFakeTimers();
    const onRevealDone = vi.fn();
    beat(mockRoundAt("reveal"), { onRevealDone });
    expect(onRevealDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(9000);
    expect(onRevealDone).toHaveBeenCalled();
    vi.useRealTimers();
  });

  /**
   * The Impostor is named whether or not they were caught, and before the
   * scoreboard rather than under it — the round has been building to this.
   *
   * Twice over, and deliberately: the announcement answers the question the
   * column has been asking, and the word beside the name is what stays true
   * afterwards. One is an event, the other is a fact.
   */
  test("names the Impostor as a beat of its own", () => {
    vi.useFakeTimers();
    beat(mockRoundAt("reveal"));
    expect(screen.queryByText(/The impostor/)).toBeNull();
    expect(screen.queryByText("impostor")).toBeNull();
    act(() => vi.advanceTimersByTime(3500));
    // The fixture's vote catches Ines, so the same line carries the news and
    // the stake: one piece of news, one sentence.
    expect(
      screen.getByText("The impostor (Ines) was caught! They have one last chance now!"),
    ).toBeInTheDocument();
    expect(screen.getByText("impostor")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("the steal beat", () => {
  /**
   * The room watches the Impostor guess without being shown what they are
   * choosing between — which is now the whole deck, so naming any card here
   * would be handing the table the answer to next round as well.
   */
  test("never names a card on the big screen", () => {
    const { container } = beat(mockRoundAt("steal"));
    for (const card of [...STYLES, ...COMPONENTS]) {
      expect(container.innerHTML).not.toContain(card.id);
    }
    expect(container.textContent).not.toContain("Primary Button");
  });
});

describe("the answer beat", () => {
  /**
   * The round is spent reading code, so this is the first time anyone sees the
   * thing they built. It's the payoff, which is why it lands here.
   */
  test("shows the render for the first time, in a fully sandboxed stage", () => {
    const { container } = beat(RESULT);
    const iframe = container.querySelector("iframe");
    // An empty sandbox blocks scripts entirely — what makes free-form values
    // safe without a blacklist.
    expect(iframe?.getAttribute("sandbox")).toBe("");
    expect(iframe?.getAttribute("srcdoc")).toContain("Lorem ipsum dolor sit");
  });

  test("renders the winning value, not the one it overrode", () => {
    const { container } = beat(RESULT);
    const srcdoc = container.querySelector("iframe")?.getAttribute("srcdoc") ?? "";
    expect(srcdoc).toContain("#1a73e8");
    expect(srcdoc).not.toContain("#34a853");
  });

  test("leaves a declaration nobody answered out of the render", () => {
    const { container } = beat(RESULT);
    expect(container.querySelector("iframe")?.getAttribute("srcdoc")).not.toContain("border-radius");
  });

  test("counts votes on the row of whoever received them", () => {
    beat(mockRoundAt("reveal"));
    // Ines drew three; Rafa and Ana one each.
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);
  });

  /**
   * The guess is the verdict, not a footnote under it — naming both halves
   * steals the round outright — so it is one sentence ending in how close they
   * came.
   */
  test("says what the Impostor named, and how close it was", () => {
    beat(RESULT);
    expect(
      // The fixture guesses Wireframe · Avatar against a Material Primary
      // Button: both halves wrong.
      screen.getByText("Ines guessed: Wireframe · Avatar — and got neither"),
    ).toBeInTheDocument();
  });

  test("shows this round's points beside the running totals", () => {
    beat(RESULT);
    // Seats 1, 2 and 5 voted correctly.
    expect(screen.getAllByText("+1")).toHaveLength(3);
  });

  test("offers the next round while the match is live", () => {
    beat(RESULT);
    expect(screen.getByRole("button", { name: "Next round" })).toBeInTheDocument();
  });

  test("declares the winner instead once the match is over", () => {
    beat(RESULT, { finished: true, winnerIds: [1] });
    expect(screen.getByText("Rafa wins")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next round" })).toBeNull();
  });

  test("shares the win when two players tie at the top", () => {
    beat(RESULT, { finished: true, winnerIds: [1, 2] });
    expect(screen.getByText("Rafa & Ana wins")).toBeInTheDocument();
  });

  /**
   * The finished room used to be a dead end: the winner line replaced the only
   * button on the screen and nothing took its place, so a table that had just
   * played a whole match had no way to start another one.
   */
  test("offers a new game once the match is over, and not before", () => {
    const onNewGame = vi.fn();
    beat(RESULT, { finished: true, winnerIds: [1], onNewGame });

    screen.getByRole("button", { name: "New game" }).click();
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  test("keeps the new game out of a live match", () => {
    beat(RESULT);
    expect(screen.queryByRole("button", { name: "New game" })).toBeNull();
  });

  /**
   * The label is the cover's, deliberately. "Play again" would promise the
   * table carries over, and none of it does — this opens a different room.
   */
  test("says it is opening while the room is being made", () => {
    beat(RESULT, { finished: true, winnerIds: [1], newGamePending: true });
    expect(screen.getByRole("button", { name: "Opening…" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("says so when the room could not be opened", () => {
    beat(RESULT, { finished: true, winnerIds: [1], newGameFailed: true });
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't open a room/i);
  });
});
