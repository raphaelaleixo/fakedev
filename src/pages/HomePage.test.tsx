import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { I18nextProvider } from "react-i18next";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import HomePage from "./HomePage";
import i18n from "../i18n";
import theme from "../theme/theme";

/**
 * The cover's primary action is the only place in the app that *opens* a room
 * without going through the code-entry screen first, so the wiring between the
 * button and `createRoom` is worth holding down. The rest of the page is
 * presentation and gets checked by eye.
 *
 * `GameContext` is stubbed because importing it for real would initialise
 * Firebase. This is the one seam in the suite that mocks a module.
 */
const createRoom = vi.fn();
vi.mock("../contexts/GameContext", () => ({
  useGame: () => ({ createRoom: () => createRoom() }),
}));

function renderHome() {
  const router = createMemoryRouter(
    [
      { path: "/", element: <HomePage /> },
      { path: "/room/:id", element: <p>lobby for {"7KQP2"}</p> },
      { path: "/join", element: <p>code entry</p> },
    ],
    { initialEntries: ["/"] },
  );
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </ThemeProvider>,
  );
  return { user: userEvent.setup(), router };
}

describe("HomePage", () => {
  test("opens a room and lands on its lobby, with no code entry in between", async () => {
    createRoom.mockResolvedValue("7KQP2");
    const { user, router } = renderHome();

    await user.click(screen.getByRole("button", { name: "New game" }));

    expect(createRoom).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/room/7KQP2");
  });

  test("stays put and says so when the room can't be opened", async () => {
    createRoom.mockRejectedValue(new Error("offline"));
    const { user, router } = renderHome();

    await user.click(screen.getByRole("button", { name: "New game" }));

    expect(router.state.location.pathname).toBe("/");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    // The button has to come back, or the cover is a dead end.
    expect(screen.getByRole("button", { name: "New game" })).toBeEnabled();
  });

  /** Joining still goes through the code screen — only creating skips it. */
  test("sends the other action to code entry", async () => {
    const { user, router } = renderHome();

    await user.click(screen.getByRole("link", { name: "Join a room" }));

    expect(router.state.location.pathname).toBe("/join");
  });
});
