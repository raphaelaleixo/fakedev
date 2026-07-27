import { describe, expect, test } from "vitest";
import { renderTreeToHtml } from "./render";
import type { RenderTree } from "./types";

function tree(overrides: Partial<RenderTree> = {}): RenderTree {
  return {
    outer: { tag: "div", attributes: {}, styles: {} },
    inner: { tag: "div", attributes: {}, styles: {} },
    label: "",
    text: "",
    ...overrides,
  };
}

describe("renderTreeToHtml", () => {
  test("nests inner inside outer", () => {
    expect(renderTreeToHtml(tree())).toBe("<div><div></div></div>");
  });

  test("puts the label in outer, before inner", () => {
    const html = renderTreeToHtml(tree({ label: "I'm not a robot", text: "Submit" }));
    expect(html).toBe("<div>I&#39;m not a robot<div>Submit</div></div>");
  });

  test("applies the tag of each element", () => {
    const html = renderTreeToHtml(
      tree({
        outer: { tag: "label", attributes: {}, styles: {} },
        inner: { tag: "button", attributes: {}, styles: {} },
      }),
    );
    expect(html).toBe("<label><button></button></label>");
  });

  test("serializes attributes", () => {
    const html = renderTreeToHtml(
      tree({
        inner: { tag: "input", attributes: { type: "checkbox" }, styles: {} },
      }),
    );
    expect(html).toContain('<input type="checkbox">');
  });

  test("serializes styles into one style attribute", () => {
    const html = renderTreeToHtml(
      tree({
        outer: {
          tag: "div",
          attributes: {},
          styles: { "background-color": "#eee", padding: "8px" },
        },
      }),
    );
    expect(html).toContain('style="background-color: #eee; padding: 8px"');
  });

  test("drops a boolean attribute set to false rather than rendering it", () => {
    const html = renderTreeToHtml(
      tree({ inner: { tag: "button", attributes: { disabled: "false" }, styles: {} } }),
    );
    expect(html).not.toContain("disabled");
  });

  test("renders a boolean attribute set to true as a bare attribute", () => {
    const html = renderTreeToHtml(
      tree({ inner: { tag: "button", attributes: { disabled: "true" }, styles: {} } }),
    );
    expect(html).toContain("<button disabled>");
  });

  test("closes a void element without children, as a browser would", () => {
    const html = renderTreeToHtml(
      tree({ inner: { tag: "input", attributes: {}, styles: {} }, text: "lost" }),
    );
    expect(html).toBe("<div><input></div>");
  });

  test("keeps the label when a void inner swallows the text slot", () => {
    const html = renderTreeToHtml(
      tree({
        inner: { tag: "input", attributes: {}, styles: {} },
        label: "Email",
        text: "lost",
      }),
    );
    expect(html).toBe("<div>Email<input></div>");
  });

  test("escapes text so a stray angle bracket cannot inject markup", () => {
    const html = renderTreeToHtml(tree({ text: "<script>alert(1)</script>" }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("escapes attribute values so a quote cannot break out", () => {
    const html = renderTreeToHtml(
      tree({
        inner: { tag: "input", attributes: { placeholder: '" onload="x' }, styles: {} },
      }),
    );
    expect(html).not.toContain('onload="x');
    expect(html).toContain("&quot;");
  });

  test("rejects a tag name that is not a plain identifier", () => {
    const html = renderTreeToHtml(
      tree({ outer: { tag: 'div onload="x"', attributes: {}, styles: {} } }),
    );
    expect(html).toBe("<div><div></div></div>");
  });

  test("rejects an attribute name that is not a plain identifier", () => {
    const html = renderTreeToHtml(
      tree({ inner: { tag: "div", attributes: { 'x" onload="y': "1" }, styles: {} } }),
    );
    expect(html).not.toContain("onload");
  });
});
