// Build step for Netlify: copies the app into dist/ and writes js/config.js from
// environment variables, so keys live in Netlify settings instead of the code.
// No packages needed; runs with plain Node.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist");
const COPY = ["index.html", "manifest.webmanifest", "css", "js", "img"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of COPY) {
  const src = path.join(root, item);
  if (!fs.existsSync(src)) { console.warn("Skipping missing " + item); continue; }
  fs.cpSync(src, path.join(out, item), { recursive: true });
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const site = process.env.APP_URL || "https://app.built-by-faith.com";
const config = "/* Written at build time from Netlify environment variables. */\n" +
  "window.BBF_CONFIG = " + JSON.stringify({ supabaseUrl: url, supabaseAnonKey: anon, siteUrl: site, cardForTrial: process.env.CARD_FOR_TRIAL === "true" }, null, 2) + ";\n";
fs.writeFileSync(path.join(out, "js", "config.js"), config);

console.log("Built Built by Faith app into dist/ in " + (url && anon ? "LIVE mode (Supabase connected)" : "DEMO mode (no Supabase keys yet)"));
