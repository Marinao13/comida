#!/usr/bin/env node
/* ============================================================
   Chequeo previo al despliegue: ¿está todo listo para producción?

     node comprobar.mjs     (o npm run comprobar)

   Revisa wrangler.jsonc, .dev.vars, la conexión a Neon y el estado
   de la base. No cambia nada.
   ============================================================ */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
let fallos = 0;
const ok = (c, msg, pista) => { console.log((c ? "  ✔ " : "  ✘ ") + msg + (!c && pista ? "\n      → " + pista : "")); if (!c) fallos++; };

console.log("WRANGLER.JSONC");
// solo comentarios de línea completa: las URL llevan //
const wr = JSON.parse(readFileSync(path.join(aqui, "wrangler.jsonc"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""));
ok(wr.name === "comida", `el Worker se llama "${wr.name}"`);
ok(!!wr.vars?.COMIDA_TEAM_DOMAIN, "COMIDA_TEAM_DOMAIN definido");
ok(!!wr.vars?.COMIDA_AUD, "COMIDA_AUD definido", "crea la aplicación de Access para comida.<subdominio>.workers.dev y pega su AUD Tag en wrangler.jsonc");
ok(!!wr.vars?.COMIDA_PERMITIDOS, "COMIDA_PERMITIDOS con tu correo", "opcional pero recomendable");

console.log("\nNEON");
let url = process.env.DATABASE_URL;
const devVars = path.join(aqui, ".dev.vars");
if (!url && existsSync(devVars)) { const m = readFileSync(devVars, "utf8").match(/^DATABASE_URL\s*=\s*(.+)$/m); if (m) url = m[1].trim().replace(/^["']|["']$/g, ""); }
ok(!!url, "DATABASE_URL disponible (entorno o .dev.vars)", "copia .dev.vars.example a .dev.vars y pega la cadena de conexión de Neon");
if (url) {
  ok(/sslmode=require|neon\.tech/.test(url), "la cadena apunta a Neon con TLS");
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const t0 = Date.now();
    const tablas = (await sql.query(`select table_name from information_schema.tables where table_schema = 'public'`)).map((t) => t.table_name);
    ok(true, `conecta (${Date.now() - t0} ms; la primera petición tras un rato parado tarda más)`);
    const esquema = ["recetas", "huecos", "registro", "ajustes"].every((t) => tablas.includes(t));
    ok(esquema, "el esquema está creado", "npm run esquema");
    if (esquema) {
      const [c] = await sql.query(`select (select count(*) from recetas where borrado_en is null)::int as r, (select count(*) from registro)::int as a,
        (select max(fecha)::text from registro) as ultima`);
      console.log(`  · ${c.r} recetas, ${c.a} apuntes${c.ultima ? ` · último el ${c.ultima}` : ""}`);
    }
  } catch (e) { ok(false, "no se pudo conectar a Neon: " + (e.message || e)); }
}

console.log("\nFRONTEND");
ok(existsSync(path.join(aqui, "public/app.js")), "public/app.js compilado", "npm run build");
ok(existsSync(path.join(aqui, "public/icono-512.png")), "iconos de la PWA", "npm run iconos");

console.log("\n" + (fallos ? `✘ ${fallos} cosa(s) por resolver antes de desplegar` : "✔ Listo para: npm run deploy"));
process.exit(fallos ? 1 : 0);
