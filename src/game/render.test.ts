import { describe, expect, test } from "vitest";
import { renderTreeToHtml } from "./render";
import { LOREM } from "./constants";
import type { RenderTree } from "./types";

function tree(overrides: Partial<RenderTree> = {}): RenderTree {
  return {
    outer: { styles: {} },
    "outer-text": { styles: {}, present: false },
    inner: { styles: {} },
    "inner-text": { styles: {}, present: false },
    ...overrides,
  };
}

describe("renderTreeToHtml", () => {
  test("nests inner inside outer, with no spans until they are played", () => {
    expect(renderTreeToHtml(tree())).toBe("<div><div></div></div>");
  });

  test("puts outer's span before inner, and inner's inside it", () => {
    const html = renderTreeToHtml(
      tree({
        "outer-text": { styles: {}, present: true },
        "inner-text": { styles: {}, present: true },
      }),
    );
    expect(html).toBe(
      `<div><span>${LOREM}</span><div><span>${LOREM}</span></div></div>`,
    );
  });

  test("serializes declarations into one style attribute", () => {
    const html = renderTreeToHtml(
      tree({ outer: { styles: { "background-color": "#eee", padding: "8px" } } }),
    );
    expect(html).toContain('style="background-color: #eee; padding: 8px"');
  });

  test("styles a span independently of its box", () => {
    const html = renderTreeToHtml(
      tree({ "inner-text": { styles: { "font-style": "italic" }, present: true } }),
    );
    expect(html).toContain('<span style="font-style: italic">');
  });

  /**
   * Copy is never chosen, so it can't carry markup — but the escaping stays as
   * a guard on values, which are free-form.
   */
  test("escapes a value that would break out of the attribute", () => {
    const html = renderTreeToHtml(tree({ outer: { styles: { color: '" onload="x' } } }));
    expect(html).not.toContain('onload="x');
    expect(html).toContain("&quot;");
  });

  test("drops a property name that is not a plain identifier", () => {
    const html = renderTreeToHtml(tree({ outer: { styles: { 'x" onload': "1" } } }));
    expect(html).not.toContain("onload");
  });
});
