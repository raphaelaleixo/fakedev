/**
 * Rasterises `public/favicon.svg` into the two sizes that cannot be an SVG.
 *
 * The SVG is the source and is hand-drawn — a single stepped gable, because the
 * cover's row of five houses has no version that survives 16 pixels. These are
 * derived from it:
 *
 *   - `favicon-32.png`, for Safari before 16.4, which ignores an SVG icon.
 *   - `apple-touch-icon.png` at 180, which iOS requires as a PNG. iOS applies
 *     its own rounded mask and composites anything transparent as black, so the
 *     circle is swapped for a full-bleed square for that one file — otherwise
 *     the icon is our dark circle sitting inside black corners.
 *
 * Same `qlmanage` caveat as the share card: it is WebKit, which is fine for a
 * still image and is not evidence about the browser the app targets.
 *
 *   node scripts/icons.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../public/favicon.svg", import.meta.url));
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

const svg = readFileSync(source, "utf8");
// The field circle, not the one inside the clip path — hence `data-field`.
const CIRCLE = /<circle data-field[^>]*\/>/;
if (!CIRCLE.test(svg)) throw new Error("favicon.svg has no data-field circle to square off");

for (const [size, name, square] of [
  [32, "favicon-32.png", false],
  [180, "apple-touch-icon.png", true],
]) {
  const work = mkdtempSync(join(tmpdir(), "icon-"));
  const file = join(work, "favicon.svg");
  writeFileSync(
    file,
    square ? svg.replace(CIRCLE, '<rect width="32" height="32" fill="#101935" />') : svg,
  );
  execFileSync("qlmanage", ["-t", "-s", String(size), "-o", work, file], { stdio: "ignore" });
  renameSync(join(work, "favicon.svg.png"), out(name));
  console.log(name, execFileSync("sips", ["-g", "pixelWidth", out(name)], { encoding: "utf8" }).trim().split("\n").pop().trim());
}
