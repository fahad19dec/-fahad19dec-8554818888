// Builds the browser-only demo into demo-site/: one index.html holding the
// app, its CSS and fonts, admin.html (a stand-in for the admin dashboard,
// from scripts/demo-admin/) and photos/ beside them. The demo answers the
// app's API in the page (src/lib/demo/server.ts) and both pages share their
// data in localStorage, so it can be hosted as static files anywhere,
// including under a sub-path.
//
//   node scripts/build-demo.mjs
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const brand = createRequire(import.meta.url)("../brand.config.js");
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

// The router reads the path, so the page starts at /home wherever it's hosted,
// or at the path after "#" (the admin links to "#/stay/<slug>"). Photos and
// admin.html load from beside the page.
const boot = `window.__ROAM_BASE__ = new URL(".", location.href).href;
document.getElementById("demo-admin").href = window.__ROAM_BASE__ + "admin.html";
try { history.replaceState(null, "", /^#\\/[\\w/-]+$/.test(location.hash) ? location.hash.slice(1) : "/home"); } catch (e) {}`;

const page = `<title>${brand.name}</title>
<style>
html, body { height: 100%; background: ${brand.colors.surface}; }
body { overflow: hidden; display: flex; flex-direction: column; }
#demo-bar { flex: none; display: flex; justify-content: center; gap: 6px; padding: 5px 12px; background: ${brand.colors.ink}; color: #fff; font: 600 12px/1.4 system-ui, sans-serif; }
#demo-bar a { color: ${brand.colors.primary}; }
#root { display: flex; flex: 1; min-height: 0; }
${css}
</style>
<noscript>${brand.name} needs JavaScript to run.</noscript>
<div id="demo-bar">Demo &middot; <a id="demo-admin" href="admin.html">Open the admin dashboard &rarr;</a></div>
<div id="root"></div>
<script>${boot}</script>
<script>${js}</script>
`;

mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "index.html"), page);
rmSync(dist, { recursive: true, force: true });

// The admin page: the shared pricing, report reasons and demo store compiled
// to plain script (their exports become page globals), then admin.js.
const shared = ["src/lib/booking/pricing.ts", "src/lib/report-reasons.ts", "src/lib/demo/store.ts"]
  .map((file) =>
    ts
      .transpileModule(readFileSync(path.join(root, file), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
      .outputText.replace(/^import .*$/gm, "")
      .replace(/^export /gm, ""),
  )
  .join("\n");
// The amenity labels the app shows, for the listing form's checkboxes.
const amenityLabels = ts
  .transpileModule(readFileSync(path.join(root, "src/lib/search/parse.ts"), "utf8").match(/export const amenityLabels[\s\S]*?\n};/)[0], {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  })
  .outputText.replace(/^export /gm, "");
const adminSeed = JSON.parse(readFileSync(path.join(root, "data/seed.json"), "utf8"));
const photoFile = (url) => (url.startsWith("https://cdn.sanity.io/images/") ? `photos/${url.split("/").pop().replace(/\.\w+$/, ".jpg")}` : url);
const SEED = {
  stays: adminSeed.stays.map((stay) => ({ ...stay, photos: stay.photos.map((p) => ({ ...p, url: photoFile(p.url) })) })),
  hosts: adminSeed.hosts.map(({ slug, name }) => ({ slug, name })),
  policies: adminSeed.policies.map(({ slug, title }) => ({ slug, title })),
};
const adminScript = `const BRAND = ${JSON.stringify(brand)};
const SEED = ${JSON.stringify(SEED)};
${shared}
${amenityLabels}
${readFileSync(path.join(root, "scripts/demo-admin/admin.js"), "utf8")}`.replace(/<\/script/gi, "<\\/script");
const tokens = Object.entries(brand.colors).map(([k, v]) => `--brand-${k}: ${v};`).join(" ");
const adminPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${brand.name} Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
<style>:root { ${tokens} }
${readFileSync(path.join(root, "scripts/demo-admin/admin.css"), "utf8")}</style>
</head>
<body>
<div id="root"></div>
<dialog id="dialog"></dialog>
<div id="toast" role="status" aria-live="polite"></div>
<script>${adminScript}</script>
</body>
</html>
`;
writeFileSync(path.join(out, "admin.html"), adminPage);

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
console.log(`demo-site/index.html ${(page.length / 1e6).toFixed(1)} MB, admin.html ${(adminPage.length / 1e6).toFixed(1)} MB, ${readdirSync(photos).length} photos`);
