const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "_site");
const { totalDays } = require("../src/_data/courseMeta.cjs");
const dayFiles = Array.from({ length: totalDays }, (_, index) => `day${String(index + 1).padStart(2, "0")}.html`);
const generatedFiles = [
  ".nojekyll",
  "index.html",
  "review.html",
  "certificate.html",
  "app.js",
  "favicon.svg",
  "styles.css",
  ...dayFiles,
  "en/index.html",
  "en/review.html",
  "en/certificate.html",
  ...dayFiles.map(filename => `en/${filename}`),
];

if (!fs.existsSync(output) || !fs.statSync(output).isDirectory()) {
  throw new Error("Eleventy output is missing. Run the site build before syncing GitHub Pages files.");
}

for (const relativePath of generatedFiles) {
  const source = path.join(output, relativePath);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Refusing to sync an incomplete build: missing _site/${relativePath}`);
  }
}

for (const relativePath of generatedFiles) {
  const source = path.join(output, relativePath);
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

console.log(`Synced ${generatedFiles.length} verified Eleventy files to the repository root.`);
