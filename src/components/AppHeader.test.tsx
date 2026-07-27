import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { createInitialRoom, joinPlayer, type RoomState } from "react-gameroom";
import AppHeader from "./AppHeader";
import i18n from "../i18n";
import theme from "../theme/theme";
import { MAX_PLAYERS, MIN_PLAYERS } from "../game/constants";
import type { FakeDevPlayerData } from "../game/types";

function room(): RoomState<FakeDevPlayerData> {
  const base = createInitialRoom<FakeDevPlayerData>({
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    requireFull: false,
  });
  return { ...joinPlayer(base, 1, "Rafa", { color: "crimson" }), roomId: "7KQP2" };
}

function show(ui: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
        </ThemeProvider>
      </MemoryRouter>,
    ),
  };
}

describe("AppHeader", () => {
  test("always offers a way home", () => {
    show(<AppHeader />);
    expect(screen.getByLabelText("Home")).toHaveAttribute("href", "/");
  });

  test("shows the room code when there's a room", () => {
    show(<AppHeader roomState={room()} />);
    expect(screen.getByRole("button", { name: "7KQP2" })).toBeInTheDocument();
  });

  test("omits the room code outside a room", () => {
    show(<AppHeader />);
    expect(screen.queryByRole("button", { name: "7KQP2" })).toBeNull();
  });

  test("opens the room info so a dropped player can get back in", async () => {
    const { user } = show(<AppHeader roomState={room()} />);
    await user.click(screen.getByRole("button", { name: "7KQP2" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("names the seat on a controller", () => {
    show(<AppHeader roomState={room()} seatName="Rafa" seatColor="crimson" />);
    expect(screen.getByText("Rafa")).toBeInTheDocument();
  });

  test("leaves the seat badge off the big screen", () => {
    show(<AppHeader roomState={room()} />);
    expect(screen.queryByText("Rafa")).toBeNull();
  });
});
