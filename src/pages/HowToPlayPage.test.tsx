import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import HowToPlayPage from "./HowToPlayPage";
import i18n from "../i18n";
import theme from "../theme/theme";
import { COMPONENTS, STYLES } from "../game/content/deck";
import en from "../locales/en.json";

function show() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <HowToPlayPage />
        </I18nextProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("HowToPlayPage", () => {
  test("puts the rules in one main landmark under one h1", () => {
    show();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  /**
   * The paper game states its rules in seven sentences with no headings, and
   * that is the model here. A sub-heading appearing is the first sign this has
   * started growing back into a manual.
   */
  test("stays a run of paragraphs, with no sections to navigate", () => {
    const { container } = show();
    expect(container.querySelectorAll("h2, h3, h4, h5, h6")).toHaveLength(0);
    // Six rule paragraphs — the paper game's four, plus the two this game needs
    // saying out loud: the board is code, and you are only making it *look*
    // like the Secret. Then three that are not rules: the opening line, the win
    // condition, and what you need to play. A tenth means a rule got split or a
    // new one crept in, and either is worth noticing.
    expect(container.querySelectorAll("p")).toHaveLength(9);
  });

  /**
   * One example teaches the shape of a Secret; a handful starts teaching the
   * deck, which is the rules page quietly turning into a card index. The decks
   * are public knowledge to anyone who has played twice, so naming one of each
   * costs nothing — naming several would.
   */
  test("shows one example Secret without listing the deck", () => {
    const { container } = show();
    const text = container.textContent ?? "";
    const named = (cards: typeof STYLES) =>
      cards
        .map((card) => {
          const [, list, id] = card.labelKey.split(".");
          return (en.deck as Record<string, Record<string, string>>)[list][id];
        })
        .filter((label) => text.includes(label));

    expect(named(STYLES)).toHaveLength(1);
    expect(named(COMPONENTS)).toHaveLength(1);
  });
});
