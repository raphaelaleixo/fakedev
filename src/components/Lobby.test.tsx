import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { createInitialRoom, joinPlayer, type RoomState } from "react-gameroom";
import Lobby from "./Lobby";
import i18n from "../i18n";
import theme from "../theme/theme";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import { seatColorFor } from "../game/match";
import type { FakeDevPlayerData } from "../game/types";

function roomWith(count: number): RoomState<FakeDevPlayerData> {
  let room = createInitialRoom<FakeDevPlayerData>({
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    requireFull: false,
  });
  for (let seat = 1; seat <= count; seat++) {
    room = joinPlayer(room, seat, `Dev${seat}`, { color: seatColorFor(seat) });
  }
  return { ...room, roomId: "7KQP2" };
}

function renderLobby(count: number, onStart = () => undefined) {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <Lobby roomState={roomWith(count)} onStart={onStart} />
      </I18nextProvider>
    </ThemeProvider>,
  );
}

describe("Lobby", () => {
  test("shows the room code so players can find the room", () => {
    renderLobby(3);
    expect(screen.getAllByText("7KQP2").length).toBeGreaterThan(0);
  });

  test("lists every player who has joined", () => {
    renderLobby(3);
    for (const name of ["Dev1", "Dev2", "Dev3"]) {
      expect(screen.getByText(`"${name}"`)).toBeInTheDocument();
    }
  });

  test("renders an empty room without falling over", () => {
    renderLobby(0);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  /**
   * The masthead already carries the game's name, so repeating it here was
   * saying it twice. The page still needs exactly one h1 — it is what names
   * the view and where RouteFocus lands on arrival — so it stays, unseen.
   */
  test("names the view in one heading, without repeating the wordmark", () => {
    renderLobby(4);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(expect.stringContaining("7KQP2"));
    expect(headings[0].textContent).not.toContain("Amsterdam");
  });

  /**
   * `disabled` drops the control out of the tab order, so a keyboard user can
   * never reach it to find out why they are waiting. `aria-disabled` says the
   * same thing and leaves it reachable; the label carries the reason.
   */
  test("keeps start reachable while the table is short, and refuses to fire", () => {
    const onStart = vi.fn();
    renderLobby(3, onStart);

    const start = screen.getByRole("button", { name: /waiting/i });
    expect(start).toHaveAttribute("aria-disabled", "true");
    expect(start).toBeEnabled();

    start.click();
    expect(onStart).not.toHaveBeenCalled();
  });

  test("refuses to start below the minimum player count", () => {
    renderLobby(MIN_PLAYERS - 1);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  test("enables start once the table is big enough", () => {
    renderLobby(MIN_PLAYERS);
    expect(screen.getByRole("button")).toBeEnabled();
  });

  test("starts the round when the host says so", async () => {
    const onStart = vi.fn();
    const { getByRole } = renderLobby(MIN_PLAYERS, onStart);
    getByRole("button").click();
    expect(onStart).toHaveBeenCalledOnce();
  });

  test("renders a full table of ten", () => {
    renderLobby(MAX_PLAYERS);
    expect(screen.getByText('"Dev10"')).toBeInTheDocument();
  });
});
