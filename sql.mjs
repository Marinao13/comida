#!/usr/bin/env node
/* ============================================================
   Consultar la base de datos con SQL

   Uso:
     node sql.mjs "select * from registro order by fecha desc limit 10"
                                          contra el servidor local si está arrancado,
                                          si no, abre ./.datos-local directamente
     node sql.mjs --demo "…"              la base de la demo (./.datos-demo)
     node sql.mjs --neon "select count(*) from recetas"   contra Neon (DATABASE_URL o .dev.vars)
     node sql.mjs                         sin consulta: lista tablas

   Truco: las raciones de una semana
     select unnest(componentes) as c, count(*) from registro
      where fecha between '2026-09-28' and '2026-10-04' group by 1 order by 2 desc
   ============================================================ */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const consulta = args.filter((a) => !a.startsWith("--")).join(" ").trim()
  || `select table_name as nombre, table_type as tipo from information_schema.tables where table_schema = 'public' order by table_type, table_name`;

function imprimir(filas) {
  if (!filas.length) { console.log("(sin filas)"); return; }
  const cols = Object.keys(filas[0]);
  const txt = filas.map((f) => cols.map((c) => f[c] === null || f[c] === undefined ? "" : typeof f[c] === "object" ? JSON.stringify(f[c]) : String(f[c])));
  const ancho = cols.map((c, i) => Math.min(60, Math.max(c.length, ...txt.map((t) => t[i].length))));
  const linea = (t) => t.map((v, i) => v.slice(0, 60).padEnd(ancho[i])).join("  ");
  console.log(linea(cols)); console.log(ancho.map((a) => "─".repeat(a)).join("  "));
  for (const t of txt) console.log(linea(t));
  console.log(`\n${filas.length} fila${filas.length === 1 ? "" : "s"}`);
}

if (args.includes("--neon")) {
  let url = process.env.DATABASE_URL;
  const devVars = path.join(aqui, ".dev.vars");
  if (!url && existsSync(devVars)) { const m = readFileSync(devVars, "utf8").match(/^DATABASE_URL\s*=\s*(.+)$/m); if (m) url = m[1].trim().replace(/^["']|["']$/g, ""); }
  if (!url) { console.error("No hay DATABASE_URL ni en el entorno ni en .dev.vars"); process.exit(2); }
  const { neon } = await import("@neondatabase/serverless");
  imprimir(await neon(url).query(consulta));
} else {
  // ¿está el servidor local arrancado? entonces preguntamos por él (pglite no admite dos procesos a la vez)
  const puerto = Number(process.env.PUERTO) || 8790;
  let porServidor = null;
  try {
    const r = await fetch(`http://localhost:${puerto}/api/consulta`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sql: consulta }) });
    porServidor = await r.json();
  } catch (e) { /* no está arrancado */ }
  if (porServidor) {
    if (porServidor.error) { console.error("Error:", porServidor.error); process.exit(1); }
    imprimir(porServidor.filas);
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite(path.join(aqui, args.includes("--demo") ? ".datos-demo" : ".datos-local"));
    try { imprimir((await db.query(consulta)).rows); }
    catch (e) { console.error("Error:", e.message); process.exit(1); }
    finally { await db.close(); }
  }
}
