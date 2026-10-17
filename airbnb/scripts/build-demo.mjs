// Builds the browser-only demo into demo-site/: one index.html holding the
// app, its CSS and fonts, plus photos/ beside it. The demo answers the app's
// API in the page (src/lib/demo/server.ts), so it can be hosted as static
// files anywhere, including under a sub-path.
//
//   node scripts/build-demo.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist-demo");
const out = path.join(root, "demo-site");

rmSync(dist, { recursive: true, force: true });
execFileSync("npx", ["expo", "export", "-p", "web", "--output-dir", dist], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, EXPO_PUBLIC_DEMO: "1" },
});

const html = readFileSync(path.join(dist, "index.html"), "utf8");
const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]
  .map(([, href]) => readFileSync(path.join(dist, href), "utf8"))
  .join("\n");
const [, scriptSrc] = html.match(/<script src="([^"]+)"/);
let js = readFileSync(path.join(dist, scriptSrc), "utf8");

// Every bundled asset (fonts, a few icons) becomes a data: URI, so nothing is
// fetched by absolute path.
const types = { ttf: "font/ttf", otf: "font/otf", png: "image/png", jpg: "image/jpeg" };
js = js.replace(/"\/assets\/([^"]+?\.(ttf|otf|png|jpg))"/g, (match, file, ext) => {
  const source = path.join(dist, "assets", file);
  if (!existsSync(source)) return match;
  return JSON.stringify(`data:${types[ext]};base64,${readFileSync(source).toString("base64")}`);
});
js = js.replace(/<\/script/gi, "<\\/script");

// The router reads the path, so the page starts at /home wherever it's hosted.
// Photos load from beside the page, wherever that is.
const boot = `window.__ROAM_BASE__ = new URL(".", location.href).href;
try { history.replaceState(null, "", "/home"); } catch (e) {}`;

const page = `<title>Roam</title>
<style>
html, body { height: 100%; background: #ffffff; }
body { overflow: hidden; }
#root { display: flex; height: 100%; flex: 1; }
${css}
</style>
<noscript>Roam needs JavaScript to run.</noscript>
<div id="root"></div>
<script>${boot}</script>
<script>${js}</script>
`;

mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "index.html"), page);
rmSync(dist, { recursive: true, force: true });

// Photos: the seed's Sanity images, sized for phones, saved once.
const seed = JSON.parse(readFileSync(path.join(root, "data/seed.json"), "utf8"));
const photos = path.join(out, "photos");
mkdirSync(photos, { recursive: true });
const have = new Set(readdirSync(photos));
const urls = [
  ...seed.stays.flatMap((s) => s.photos.map((p) => [p.url, 1000])),
  ...seed.hosts.filter((h) => h.photoUrl).map((h) => [h.photoUrl, 400]),
];
for (const [url, width] of urls) {
  const file = url.split("/").pop().replace(/\.\w+$/, ".jpg");
  if (have.has(file)) continue;
  const res = await fetch(`${url}?w=${width}&fm=jpg&q=68`);
  if (!res.ok) throw new Error(`photo ${file}: ${res.status}`);
  writeFileSync(path.join(photos, file), Buffer.from(await res.arrayBuffer()));
}
console.log(`demo-site/index.html ${(page.length / 1e6).toFixed(1)} MB, ${readdirSync(photos).length} photos`);
