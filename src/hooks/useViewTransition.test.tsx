import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useTransitionSettled, useViewTransition } from "./useViewTransition";

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

function Beat({ status }: { status: string }) {
  const shown = useViewTransition(status);
  return <p>{`${shown} ${useTransitionSettled() ? "settled" : "moving"}`}</p>;
}

/**
 * Anything on a timer has to start counting from the end of the movement, not
 * from the commit that began it.
 *
 * The resolution's beats are the case: the phase commits *inside* the
 * transition callback, so a `setTimeout` armed on mount is racing the
 * choreography rather than following it. Slow motion makes the race visible —
 * the Impostor was being ringed while the list was still growing, a white
 * outline arriving mid-flight — but the margins are only ever a few hundred
 * milliseconds, and a slow commit closes them at any speed.
 */
describe("useTransitionSettled", () => {
  let release: () => void;

  beforeEach(() => {
    (document as Partial<Document>).startViewTransition = ((cb: () => void) => {
      cb();
      const finished = new Promise<void>((resolve) => {
        release = () => resolve();
      });
      return {
        ready: Promise.resolve(),
        finished,
        updateCallbackDone: Promise.resolve(),
        skipTransition() {},
        types: new Set<string>(),
      };
    }) as Document["startViewTransition"];
  });

  afterEach(() => {
    delete (document as Partial<Document>).startViewTransition;
  });

  test("reads as settled while nothing is moving", () => {
    render(<Beat status="reveal" />);
    expect(screen.getByText("reveal settled")).toBeInTheDocument();
  });

  test("is unsettled for as long as the transition runs, and settles when it ends", async () => {
    const { rerender } = render(<Beat status="reveal" />);
    rerender(<Beat status="steal" />);

    await waitFor(() => expect(screen.getByText("steal moving")).toBeInTheDocument());

    release();
    await waitFor(() => expect(screen.getByText("steal settled")).toBeInTheDocument());
  });
});
