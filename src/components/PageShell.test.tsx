import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import PageShell from "./PageShell";
import i18n from "../i18n";
import theme from "../theme/theme";

function show(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("PageShell", () => {
  /**
   * The reason this exists. Five pages each wrote the shell out by hand, and
   * every one of them had forgotten the landmark — so there was no way past
   * the masthead on any page but the cover.
   */
  test("gives the page exactly one main landmark, with the masthead outside it", () => {
    show(
      <PageShell>
        <p>content</p>
      </PageShell>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("content");
    expect(main).not.toContainElement(screen.getByRole("banner"));
  });

  test("always offers the way home", () => {
    show(<PageShell>page</PageShell>);
    expect(screen.getByRole("link", { name: /a fake dev/i })).toHaveAttribute("href", "/");
  });
});
