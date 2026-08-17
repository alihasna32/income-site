import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const openNext = join(root, ".open-next");
const dist = join(openNext, "pages-dist");

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

cpSync(join(openNext, "assets"), dist, { recursive: true });
copyFileSync(join(openNext, "worker.js"), join(dist, "_worker.js"));

for (const dir of ["cloudflare", "middleware", ".build", "server-functions", "dynamodb-provider"]) {
  const src = join(openNext, dir);
  if (existsSync(src)) cpSync(src, join(dist, dir), { recursive: true });
}

const count = readdirSync(dist, { recursive: true }).filter((p) =>
  statSync(join(dist, p)).isFile()
).length;
console.log(`pages-dist assembled at ${dist} (${count} asset files)`);