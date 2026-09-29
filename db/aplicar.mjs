/* ============================================================
   Aplica db/schema.sql en Neon (crea las tablas si no existen)

   Uso:
     node db/aplicar.mjs          (o npm run esquema)

   DATABASE_URL se lee del entorno o de .dev.vars (misma variable que usa el Worker).
   Es idempotente: se puede repetir sin perder nada.
   ============================================================ */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const aqui = dirname(fileURLToPath(import.meta.url));

let url = process.env.DATABASE_URL;
const devVars = resolve(aqui, "../.dev.vars");
if (!url && existsSync(devVars)) {
  const m = readFileSync(devVars, "utf8").match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (m) url = m[1].trim().replace(/^["']|["']$/g, "");
}
if (!url) { console.error("No hay DATABASE_URL ni en el entorno ni en .dev.vars (copia .dev.vars.example)."); process.exit(2); }

const { Pool } = await import("@neondatabase/serverless");
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query(readFileSync(resolve(aqui, "schema.sql"), "utf8"));
  const c = (await client.query(`select (select count(*) from recetas)::int as recetas, (select count(*) from registro)::int as registro,
                                        (select count(*) from huecos)::int as huecos`)).rows[0];
  console.log(`✔ Esquema aplicado. En Neon hay ${c.recetas} recetas, ${c.registro} apuntes y ${c.huecos} huecos planeados.`);
} finally {
  client.release();
  await pool.end();
}
