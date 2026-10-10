/**
 * Static server + Supabase RPC mock for the krimi nikhil invitation.
 *
 * The home page IS the invitation: "/" serves the app directly and the URL
 * stays "/" (index.html swaps in the internal demo route the bundled router
 * needs, then restores "/" once mounted — see the script in index.html).
 *  - static files (bundle, fonts, media) are served as-is
 *  - every other route (gallery, signup, checkout, ...) 302s back to "/"
 *  - the Supabase RPC mock answers from mock-data/demo_templates.json
 *    (trimmed to royal-prestige)
 *
 *   node server.mjs   ->  http://localhost:5399  (opens the invitation)
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC = join(HERE, "public");
const PORT = Number(process.env.PORT || 5399);
const TEMPLATE = "royal-prestige";
const INVITE = `/invite/demo?template=${TEMPLATE}`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};

const templates = JSON.parse(
  await readFile(join(HERE, "public", "mock-data", "demo_templates.json"), "utf8")
);

// English -> Gujarati dictionary, served by the translate-content mock below
// (same files the static shim in public/index.html reads in production)
const GU_DICT = JSON.parse(
  await readFile(join(HERE, "public", "mock-data", "translations-gu.json"), "utf8")
);

function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, {
    "content-type": type,
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

function redirectHome(res) {
  res.writeHead(302, { location: "/" });
  res.end();
}

// resolve a request path to a file under public/ (traversal-safe), or null
async function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(PUBLIC, clean);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
    return file;
  } catch {
    return null;
  }
}

async function serveFile(res, file) {
  if (!file) return send(res, 404, JSON.stringify({ error: "not found" }));
  try {
    const buf = await readFile(file);
    const ext = extname(file).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    // markup/scripts/styles always revalidate so edits show on a normal reload
    const noCache = type.startsWith("text/html") || ext === ".js" || ext === ".css";
    res.writeHead(200, {
      "content-type": type,
      "cache-control": noCache ? "no-cache" : "public, max-age=3600",
      "access-control-allow-origin": "*",
    });
    res.end(buf);
  } catch {
    send(res, 404, JSON.stringify({ error: "not found" }));
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;

  if (req.method === "OPTIONS") return send(res, 204, "");

  // ---- translate-content mock: answers the app's translation call with the
  // local English -> Gujarati dictionary (unknown strings pass through as-is) ----
  if (pathname === "/functions/v1/translate-content" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let args = {};
    try {
      args = JSON.parse(body || "{}");
    } catch {}
    const texts = args.texts || {};
    const dict = args.targetLanguage === "gu" ? GU_DICT : {};
    const translations = {};
    for (const [k, v] of Object.entries(texts)) {
      translations[k] = typeof v === "string" && dict[v] ? dict[v] : v;
    }
    return send(res, 200, JSON.stringify({ translations }));
  }

  // ---- Supabase RPC mock ----
  if (pathname === "/rest/v1/rpc/get_template_demo_data" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let args = {};
    try {
      args = JSON.parse(body || "{}");
    } catch {}
    const id = args.p_template_id || args.p_template_slug || "";
    const row = templates[id];
    if (!row) return send(res, 200, JSON.stringify([]));
    return send(res, 200, JSON.stringify([row]));
  }

  // generic REST table reads -> empty result set (keeps the SPA quiet)
  if (pathname.startsWith("/rest/v1/") && req.method === "GET") {
    return send(res, 200, JSON.stringify([]));
  }

  // The home page IS the invitation
  if (pathname === "/") {
    return serveFile(res, join(PUBLIC, "index.html"));
  }

  // Internal demo route still serves the app (the home page script restores "/")
  if (pathname === "/invite/demo") {
    if (url.searchParams.get("template") === TEMPLATE) {
      return serveFile(res, join(PUBLIC, "index.html"));
    }
    return redirectHome(res); // other templates do not exist here
  }
  if (pathname === "/index.html") return redirectHome(res);

  // Static files (anything with a file extension)
  if (extname(pathname)) {
    return serveFile(res, await resolveFile(pathname));
  }

  // Everything else is not part of this site: back to the home page
  return redirectHome(res);
});

server.listen(PORT, () => {
  console.log(`krimi nikhil   ->  http://localhost:${PORT}   (this is the invitation)`);
  console.log(`mock templates  ->  ${Object.keys(templates).length} (${Object.keys(templates).join(", ")})`);
});
