/**
 * Builds `public/ogimage.png` — the card that shows up when the game's link is
 * pasted anywhere.
 *
 * It is generated rather than drawn by hand so it cannot drift from the cover:
 * the houses come straight out of `Skyline.tsx` and the colours out of
 * `tokens.ts`, so a change to either is one `npm run og` away from being in the
 * card too.
 *
 * The typeface has to be *embedded*. Bricolage Grotesque is not installed on
 * this machine and a rasteriser has no network, so the font is fetched from
 * Google Fonts at build time and inlined as a data URI. Nothing about it is
 * committed — the PNG is the artifact.
 *
 * Rasterising is `qlmanage`, which is WebKit. That is fine for a still image
 * where nothing is interactive, but it is not the browser the app targets, so
 * do not treat this pipeline as evidence that anything renders.
 *
 *   node scripts/og-image.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WIDTH = 1200;
const HEIGHT = 630;
/** Where the flame band starts. The ink above it is the empty half. */
const BAND_TOP = 396;
/**
 * One left margin for the art and the type, because the cover is left-aligned
 * and the card should read as the same page rather than a centred poster of it.
 */
const GUTTER = 48;
/** The cover overlaps the art into the band by a pixel or two — no hairline. */
const SEAM = 2;

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/** One token out of `tokens.ts`, so the card cannot drift from the app. */
function token(name) {
  const match = read("src/theme/tokens.ts").match(new RegExp(`${name}:\\s*"([^"]+)"`));
  if (!match) throw new Error(`No token named ${name}`);
  return match[1];
}

/** A string out of the locale, so the card says exactly what the cover says. */
function copy(key) {
  const strings = JSON.parse(read("src/locales/en.json"));
  return key.split(".").reduce((node, part) => node[part], strings);
}

/** The houses, straight out of the component that draws them on the cover. */
function skyline() {
  const source = read("src/components/Skyline.tsx");
  const viewBox = source.match(/viewBox="([^"]+)"/)?.[1];
  const path = source.match(/<path d="([^"]+)"/)?.[1];
  if (!viewBox || !path) throw new Error("Could not read the skyline");
  const [, , w, h] = viewBox.split(/\s+/).map(Number);
  return { path, ratio: w / h };
}

async function embeddedFont() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((r) => r.text());
  const url = css.match(/https:\/\/[^)]+\.(?:ttf|woff2)/)?.[0];
  if (!url) throw new Error("Google Fonts did not return a font file");
  const font = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  return `data:font/ttf;base64,${font.toString("base64")}`;
}

const { path, ratio } = skyline();
const ink = token("ink");
const flame = token("flame");
const onFlame = token("onFlame");

// Smaller than the ink half it sits in — on the cover the houses are a fraction
// of the headline's width, not the whole field, and the emptiness beside them is
// what stops the card looking busy.
const artHeight = 256;
const artWidth = artHeight * ratio;

/**
 * The card is drawn inside a *square*, then cropped back.
 *
 * `qlmanage` fits what it renders into a square of the size it is given, so a
 * 1200×630 source came out scaled by 1200/630 and clipped. Authoring 1200×1200
 * makes that fit a no-op — every pixel is 1:1 — and `sips` takes the middle
 * 630 rows afterwards.
 */
const PAD = (WIDTH - HEIGHT) / 2;

const svg = (fontUri) => `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${WIDTH}" viewBox="0 0 ${WIDTH} ${WIDTH}">
  <style>
    @font-face {
      font-family: "Bricolage Grotesque";
      font-weight: 800;
      src: url("${fontUri}") format("truetype");
    }
    text { font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; }
  </style>

  <rect width="${WIDTH}" height="${WIDTH}" fill="${ink}"/>

  <g transform="translate(0 ${PAD})">
    <rect y="${BAND_TOP}" width="${WIDTH}" height="${HEIGHT - BAND_TOP}" fill="${flame}"/>

    <!-- One transform on the raw path, rather than a nested <svg> with its own
         width and viewBox: WebKit ignored the nested sizing and drew the houses
         at their own scale. -->
    <g transform="translate(${GUTTER} ${BAND_TOP + SEAM - artHeight}) scale(${artWidth / 808})">
      <path d="${path}" fill="${flame}"/>
    </g>

    <!-- Split the way the *cover* splits it, not the way the masthead does: the
         name on one line and where it goes on the next, the long line huge and
         tight and the short one small and spaced out. Left-aligned on the same
         gutter as the houses, and in ink rather than the band's own dark brown —
         two colours only, which is what makes the card read at thumbnail size. -->
    <text x="${GUTTER}" y="536" fill="${ink}"
          font-size="116" letter-spacing="-4">${copy("home.titleMain").toUpperCase()}</text>
    <text x="${GUTTER + 4}" y="586" fill="${ink}"
          font-size="40" letter-spacing="4.6">${copy("home.titleTail").toUpperCase()}</text>
  </g>
</svg>`;

const work = mkdtempSync(join(tmpdir(), "og-"));
const source = join(work, "og.svg");
writeFileSync(source, svg(await embeddedFont()));

execFileSync("qlmanage", ["-t", "-s", String(WIDTH), "-o", work, source], { stdio: "ignore" });
renameSync(join(work, "og.svg.png"), new URL("../public/ogimage.png", import.meta.url));
// Back down to the card, from the middle of the square it was drawn in.
execFileSync("sips", ["-c", String(HEIGHT), String(WIDTH), "public/ogimage.png"], {
  stdio: "ignore",
});

const size = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", "public/ogimage.png"], {
  encoding: "utf8",
});
console.log(size.trim());
