/* La API contra Postgres embebido (pglite, en memoria): mismas consultas que en Neon */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { crearApi } from "../src/api.mjs";

let api;
const pide = async (metodo, ruta, cuerpo) => {
  const r = await api(new Request("http://x/api" + ruta, {
    method: metodo, headers: { "content-type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  }), "yo@prueba");
  return { status: r.status, datos: await r.json() };
};
const ID = "11111111-2222-4333-8444-555555555555";

before(async () => {
  const db = new PGlite();
  const esquema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  await db.exec(esquema);
  await db.exec(esquema); // idempotente
  api = crearApi({
    sql: async (texto, params) => (await db.query(texto, params || [])).rows,
    lote: (stmts) => db.transaction(async (tx) => { for (const s of stmts) await tx.query(s.sql, s.params || []); }),
  });
});

test("arranca con los tres desayunos de partida", async () => {
  const { status, datos } = await pide("GET", "/todo");
  assert.equal(status, 200);
  assert.equal(datos.recetas.filter((r) => r.grupo === "desayuno").length, 3);
  assert.deepEqual(datos.recetas.find((r) => r.nombre.startsWith("Avena")).componentes, ["avena", "leche_yogur", "otras_frutas"]);
});

test("receta: crea, repite sin duplicar, valida y borra", async () => {
  const receta = { nombre: 'Lentejas "de la abuela"', grupo: "legumbres", subfamilia: "lentejas", momentos: ["comida"],
    componentes: ["lentejas", "naranjas", "otras_verduras"], ingredientes: "lentejas\nzanahoria", etiquetas: ["batch", "invierno"] };
  let r = await pide("PUT", "/recetas/" + ID, receta);
  assert.equal(r.status, 200, JSON.stringify(r.datos));
  assert.equal(r.datos.receta.nombre, 'Lentejas "de la abuela"');
  assert.deepEqual(r.datos.receta.etiquetas, ["batch", "invierno"]);
  r = await pide("PUT", "/recetas/" + ID, { ...receta, favorita: true });
  assert.equal(r.datos.receta.favorita, true);
  const todo = await pide("GET", "/todo");
  assert.equal(todo.datos.recetas.filter((x) => x.id === ID).length, 1);

  assert.equal((await pide("PUT", "/recetas/no-uuid", receta)).status, 400);
  assert.equal((await pide("PUT", "/recetas/" + ID, { ...receta, componentes: ["pizza"] })).status, 400);
  assert.equal((await pide("PUT", "/recetas/" + ID, { ...receta, grupo: "nada" })).status, 400);
  assert.equal((await pide("PUT", "/recetas/" + ID, { ...receta, enlace: "javascript:alert(1)" })).status, 400);
});

test("semana: sustituye los huecos de la semana en bloque", async () => {
  const huecos = [
    { fecha: "2026-09-28", momento: "comida", grupo: "legumbres", subfamilia: "lentejas", receta_id: ID, fijo: true },
    { fecha: "2026-09-28", momento: "cena", grupo: "huevos" },
    { fecha: "2026-10-04", momento: "cena", grupo: "libre" },
  ];
  let r = await pide("PUT", "/semana/2026-09-28", { huecos });
  assert.equal(r.status, 200, JSON.stringify(r.datos));
  assert.equal(r.datos.huecos.length, 3);
  r = await pide("PUT", "/semana/2026-09-28", { huecos: huecos.slice(0, 1) });
  assert.equal(r.datos.huecos.length, 1);
  assert.equal(r.datos.huecos[0].fijo, true);
  assert.equal((await pide("PUT", "/semana/2026-09-29", { huecos })).status, 400, "no es lunes");
  assert.equal((await pide("PUT", "/semana/2026-09-28", { huecos: [{ ...huecos[0], fecha: "2026-10-05" }] })).status, 400, "fuera de la semana");
  assert.equal((await pide("PUT", "/semana/2026-09-28", { huecos: [{ ...huecos[0], receta_id: "99999999-2222-4333-8444-555555555555" }] })).status, 400);
});

test("hueco suelto y registro", async () => {
  let r = await pide("PUT", "/huecos/2026-09-29/cena", { grupo: "pescado_azul", subfamilia: "azul_pequeno" });
  assert.equal(r.status, 200, JSON.stringify(r.datos));
  assert.equal(r.datos.hueco.grupo, "pescado_azul");
  r = await pide("PUT", "/registro/2026-09-28/comida", { origen: "plan", receta_id: ID, componentes: ["lentejas", "naranjas", "naranjas"] });
  assert.equal(r.status, 200, JSON.stringify(r.datos));
  assert.deepEqual(r.datos.registro.componentes, ["lentejas", "naranjas", "naranjas"]);
  r = await pide("PUT", "/registro/2026-09-28/otros", { origen: "libre", componentes: ["vitamina_c", "nueces"] });
  assert.equal(r.status, 200);
  r = await pide("PUT", "/registro/2026-09-28/comida", { origen: "fuera", descripcion: "Menú del día", componentes: ["blanco"] });
  assert.equal(r.datos.registro.origen, "fuera");
  assert.equal(r.datos.registro.receta_id, null);
  assert.equal((await pide("PUT", "/registro/2026-09-28/merienda", { origen: "libre" })).status, 400);
  assert.equal((await pide("DELETE", "/registro/2026-09-28/otros")).status, 200);
  const todo = await pide("GET", "/todo");
  assert.equal(todo.datos.registro.length, 1);
  assert.equal(todo.datos.registro[0].fecha, "2026-09-28");
});

test("ajustes y borrado lógico de receta", async () => {
  assert.equal((await pide("PUT", "/ajustes/reparto", { valor: { legumbres: 5 } })).status, 200);
  assert.equal((await pide("DELETE", "/recetas/" + ID)).status, 200);
  const todo = await pide("GET", "/todo");
  assert.deepEqual(todo.datos.ajustes.reparto, { legumbres: 5 });
  assert.ok(todo.datos.recetas.find((x) => x.id === ID).borrado_en, "sigue en la lista, marcada como borrada");
});
