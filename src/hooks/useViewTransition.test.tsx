import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useViewTransition } from "./useViewTransition";

function Phase({ status }: { status: string }) {
  return <p>{useViewTransition(status)}</p>;
}

describe("useViewTransition", () => {
  afterEach(() => {
    delete (document as Partial<Document>).startViewTransition;
  });

  /**
   * jsdom has no startViewTransition, which is also the state of any browser
   * that hasn't shipped it — the value has to pass through untouched rather
   * than lag a commit behind for nothing.
   */
  test("passes the value straight through where the API is missing", () => {
    const { rerender } = render(<Phase status="lobby" />);
    expect(screen.getByText("lobby")).toBeInTheDocument();

    rerender(<Phase status="playing" />);
    expect(screen.getByText("playing")).toBeInTheDocument();
  });
});

describe("useViewTransition, with the API present", () => {
  const started = vi.fn();

  beforeEach(() => {
    started.mockClear();
    (document as Partial<Document>).startViewTransition = ((cb: () => void) => {
      started();
      cb();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition() {},
        types: new Set<string>(),
      };
    }) as Document["startViewTransition"];
  });

  /**
   * The whole point: the browser must own the update, so the new value may
   * only appear from inside the callback it was given.
   */
  test("lets the change through from inside the transition", async () => {
    const { rerender } = render(<Phase status="lobby" />);
    rerender(<Phase status="playing" />);

    await waitFor(() => expect(started).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("playing")).toBeInTheDocument());
  });
});
