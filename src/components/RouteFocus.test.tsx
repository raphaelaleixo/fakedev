import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter, Link } from "react-router-dom";
import RouteFocus from "./RouteFocus";

function show() {
  const router = createMemoryRouter(
    [
      {
        element: <RouteFocus />,
        children: [
          {
            path: "/",
            element: (
              <>
                <h1>Cover</h1>
                <Link to="/next">Go</Link>
              </>
            ),
          },
          { path: "/next", element: <h1>Next page</h1> },
        ],
      },
    ],
    { initialEntries: ["/"] },
  );
  render(<RouterProvider router={router} />);
  return { user: userEvent.setup() };
}

describe("RouteFocus", () => {
  /**
   * Without this, activating a link leaves focus on an element that no longer
   * exists, so it falls back to <body> — a keyboard user lands at the top of
   * nowhere with nothing announced.
   */
  test("moves focus to the arriving page's heading", async () => {
    const { user } = show();
    await user.click(screen.getByRole("link", { name: "Go" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Next page" })).toHaveFocus(),
    );
  });

  /** Focusable, but never in the tab sequence. */
  test("does not add the heading to the tab order", async () => {
    const { user } = show();
    await user.click(screen.getByRole("link", { name: "Go" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Next page" })).toHaveAttribute(
        "tabindex",
        "-1",
      ),
    );
  });

  /** Stealing focus from the address bar on a cold load is its own bug. */
  test("leaves focus alone on first paint", () => {
    show();
    expect(screen.getByRole("heading", { name: "Cover" })).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });
});
