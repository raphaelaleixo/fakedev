import { beforeEach, describe, expect, test, vi } from "vitest";
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

beforeEach(() => {
  // Call counts leak between tests otherwise, and this suite asserts on them.
  createRoom.mockReset();
});

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

describe("HomePage markup", () => {
  /**
   * The title is split across two lines for the look, not for the meaning —
   * the game is called "A Fake Dev Goes to Amsterdam", which is what <title>
   * says and what the one h1 has to say too.
   */
  test("carries the whole title in a single h1", () => {
    renderHome();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName("A Fake Dev Goes to Amsterdam");
  });

  test("puts the page in a main landmark and the credits in contentinfo", () => {
    renderHome();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  /** Both drawings restate what the text already says, so they're decoration. */
  test("hides the cover art and the logo from assistive tech", () => {
    renderHome();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });
});

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

  /**
   * A `disabled` button drops out of the tab order the moment it's pressed,
   * taking the user's focus with it. `aria-disabled` says the same thing to
   * assistive tech while leaving the button reachable, so the guard lives in
   * the handler instead.
   */
  test("keeps the primary action focusable while the room is opening", async () => {
    let release: (id: string) => void = () => undefined;
    createRoom.mockReturnValue(new Promise<string>((resolve) => (release = resolve)));
    const { user } = renderHome();

    const button = screen.getByRole("button", { name: "New game" });
    await user.click(button);

    const pending = screen.getByRole("button", { name: "Opening…" });
    expect(pending).toHaveAttribute("aria-disabled", "true");
    expect(pending).toBeEnabled();
    expect(pending).toHaveFocus();

    // A second press while in flight must not open a second room.
    await user.click(pending);
    expect(createRoom).toHaveBeenCalledTimes(1);
    release("7KQP2");
  });

  /** Joining still goes through the code screen — only creating skips it. */
  test("sends the other action to code entry", async () => {
    const { user, router } = renderHome();

    await user.click(screen.getByRole("link", { name: "Join a room" }));

    expect(router.state.location.pathname).toBe("/join");
  });
});
