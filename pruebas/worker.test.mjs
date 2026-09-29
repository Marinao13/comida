/* El Worker: la API nunca abre sin Access bien configurado y un JWT válido */
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const ENV = { COMIDA_TEAM_DOMAIN: "https://equipo.cloudflareaccess.com", COMIDA_AUD: "aud-de-prueba", DATABASE_URL: "postgresql://x", ASSETS: { fetch: () => new Response("app") } };
const pide = (ruta, env = ENV, headers = {}) => worker.fetch(new Request("https://comida.ejemplo.workers.dev" + ruta, { headers }), env);

test("salud sin autenticación y la app servida desde assets", async () => {
  assert.equal((await pide("/api/salud")).status, 200);
  assert.equal(await (await pide("/semana")).text(), "app");
});

test("sin AUD configurado la API responde 500 y no abre", async () => {
  const r = await pide("/api/todo", { ...ENV, COMIDA_AUD: "" });
  assert.equal(r.status, 500);
  assert.match((await r.json()).error, /COMIDA_AUD/);
});

test("sin JWT, o con uno mal formado, 401", async () => {
  assert.equal((await pide("/api/todo")).status, 401);
  assert.equal((await pide("/api/todo", ENV, { "cf-access-jwt-assertion": "no.es.jwt" })).status, 401);
  assert.equal((await pide("/api/recetas/x", ENV, { cookie: "CF_Authorization=basura" })).status, 401);
});
