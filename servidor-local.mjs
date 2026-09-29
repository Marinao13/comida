#!/usr/bin/env node
/* ============================================================
   Comida · servidor LOCAL para probar sin Neon ni Cloudflare

   · Postgres embebido (pglite) guardado en ./.datos-local
   · Misma API que el Worker (src/api.mjs), sin autenticación: el usuario
     lo fija COMIDA_LOCAL_USER (por defecto local@comida)
   · --demo usa otra carpeta (./.datos-demo) y la siembra con recetas y
     meses de registro inventados para ver cómo queda el equilibrio.
     Nunca toca ./.datos-local ni Neon.

   Uso:
     node servidor-local.mjs            http://localhost:8790
     node servidor-local.mjs --demo     datos de ejemplo
     PUERTO=8791 node servidor-local.mjs

   Para empezar de cero: borra la carpeta .datos-local (o .datos-demo)
   ============================================================ */

import http from "node:http";
import { readFileSync, existsSync, createReadStream, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { crearApi } from "./src/api.mjs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DEMO = process.argv.includes("--demo");
const PUERTO = Number(process.env.PUERTO) || 8790;
const QUIEN = process.env.COMIDA_LOCAL_USER || "local@comida";
const PUBLIC = path.join(aqui, "public");
const DATOS = path.join(aqui, DEMO ? ".datos-demo" : ".datos-local");

if (!existsSync(path.join(PUBLIC, "app.js"))) console.log("⚠ Falta public/app.js: ejecuta antes  npm run build\n");

const db = new PGlite(DATOS);
await db.exec(readFileSync(path.join(aqui, "db/schema.sql"), "utf8"));

const api = crearApi({
  sql: async (texto, params) => (await db.query(texto, params || [])).rows,
  lote: (stmts) => db.transaction(async (tx) => { for (const s of stmts) await tx.query(s.sql, s.params || []); }),
});

if (DEMO) {
  const [{ n }] = (await db.query(`select count(*)::int as n from registro`)).rows;
  if (n === 0) {
    const { sembrarDemo } = await import("./pruebas/demo.mjs");
    const t0 = Date.now();
    const r = await sembrarDemo(api, QUIEN);
    console.log(`✔ Demo sembrada en ${Date.now() - t0} ms: ${r.recetas} recetas, ${r.semanas} semanas, ${r.apuntes} apuntes\n`);
  }
}

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  try {
    if (url.pathname === "/api/salud") { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true, app: "comida-local" })); return; }
    // Solo en local: consultas SQL sueltas desde sql.mjs (el Worker de producción NO tiene esta ruta)
    if (url.pathname === "/api/consulta" && req.method === "POST") {
      if (!String(req.headers["content-type"] || "").startsWith("application/json")) { res.writeHead(415); res.end(); return; }
      const trozos = [];
      for await (const c of req) trozos.push(c);
      res.writeHead(200, { "content-type": "application/json" });
      try {
        const { sql } = JSON.parse(Buffer.concat(trozos).toString("utf8"));
        res.end(JSON.stringify({ filas: (await db.query(sql)).rows }));
      } catch (e) { res.end(JSON.stringify({ error: String(e.message || e) })); }
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      const trozos = [];
      for await (const c of req) trozos.push(c);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
      const peticion = new Request(url, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(trozos) });
      const salida = await api(peticion, QUIEN);
      res.writeHead(salida.status, Object.fromEntries(salida.headers));
      res.end(Buffer.from(await salida.arrayBuffer()));
      return;
    }
    let f = path.join(PUBLIC, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
    if (!f.startsWith(PUBLIC) || !existsSync(f) || statSync(f).isDirectory()) f = path.join(PUBLIC, "index.html");
    res.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
    createReadStream(f).pipe(res);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
}).listen(PUERTO, "127.0.0.1", () => {
  console.log(`Comida (local${DEMO ? ", demo" : ""}) · http://localhost:${PUERTO}  · usuario ${QUIEN} · datos en ${DATOS}`);
});
