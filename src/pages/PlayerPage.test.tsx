import { describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import type { GameContextValue } from "../contexts/GameContext";
import PlayerPage from "./PlayerPage";
import i18n from "../i18n";
import theme from "../theme/theme";
import { MOCK_SEATS, mockRoundAt } from "../mocks/fixtures";
import type { Round, RoundPhase } from "../game/types";

const game = vi.hoisted(() => ({ current: {} as Partial<GameContextValue> }));
vi.mock("../contexts/GameContext", () => ({ useGame: () => game.current }));

/** A room whose seats match the fixture, with this device sitting in seat 1. */
function room() {
  return {
    roomId: "7KQP2",
    status: "playing",
    players: MOCK_SEATS.map((seat) => ({
      id: seat.id,
      name: seat.name,
      status: "ready" as const,
      data: { color: seat.color },
    })),
  };
}

function show(
  phase: RoundPhase,
  overrides: Partial<GameContextValue> = {},
  round: Partial<Round> = {},
) {
  game.current = {
    roomState: room() as unknown as GameContextValue["roomState"],
    // Nobody has voted yet: the fixture ships a finished vote, which is the
    // one state the picker is never in while it still matters.
    matchState: {
      round: { ...mockRoundAt(phase), votes: {}, ...round },
    } as unknown as GameContextValue["matchState"],
    loading: false,
    notFound: false,
    loadRoom: () => undefined,
    ...overrides,
  };

  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={["/room/7KQP2/player/1"]}>
        <ThemeProvider theme={theme}>
          <I18nextProvider i18n={i18n}>
            <Routes>
              <Route path="/room/:id/player/:playerId" element={<PlayerPage />} />
            </Routes>
          </I18nextProvider>
        </ThemeProvider>
      </MemoryRouter>,
    ),
  };
}

/**
 * A write can fail in any phase, and a player has to be told in the phase they
 * are in.
 *
 * This used to be rendered inside the turn — the one branch where a failure was
 * already visible, since the board simply would not change. A vote that
 * silently does not land looks exactly like a vote that did, and the player
 * sits there believing they have voted while the room waits on them.
 */
/**
 * At five players you spend eight turns of every ten here, so this is the
 * resting state of the device rather than an interstitial. It names the person
 * being waited on, which is what makes looking up at the room the obvious next
 * move.
 */
describe("PlayerPage, while waiting", () => {
  // Turn two of ten, so the seat in play is Ana and not this device. The
  // fixture ships a round with every turn spent, which has no active player at
  // all — a state this screen is never in while it matters.
  const midTurn = { turnIndex: 1 };

  test("names whose turn it is, and announces the change", () => {
    show("turns", {}, midTurn);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Ana");
    expect(status).toHaveTextContent("is editing");
  });

  test("does not mirror the board while somebody else edits", () => {
    const { container } = show("turns", {}, midTurn);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.textContent).not.toContain("untitled-component.html");
  });
});

describe("PlayerPage, when a write fails", () => {
  test("says so when a vote does not land", async () => {
    const { user } = show("voting", {
      vote: () => Promise.reject(new Error("PERMISSION_DENIED")),
    });

    await user.click(screen.getByRole("button", { name: /Ines/ }));
    await user.click(screen.getByRole("button", { name: "Lock it in" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("That vote didn't land"),
    );
  });

  /** And the copy is about the move they made, not about somebody else's. */
  test("does not tell a voter their edit failed", async () => {
    const { user } = show("voting", {
      vote: () => Promise.reject(new Error("PERMISSION_DENIED")),
    });

    await user.click(screen.getByRole("button", { name: /Ines/ }));
    await user.click(screen.getByRole("button", { name: "Lock it in" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByText(/edit didn't land/)).toBeNull();
  });

  test("stays quiet while nothing has failed", () => {
    show("voting", { vote: () => Promise.resolve() });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
