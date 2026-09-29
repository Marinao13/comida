/* ============================================================
   Comida · API de datos

   Independiente del entorno: funciona igual en el Worker (Neon) y en el
   servidor local (Postgres embebido). Solo necesita `sql(texto, params)`
   que devuelva filas, `lote(stmts)` para varias sentencias en una
   transacción, y quién llama (correo verificado por Access).

   Rutas (todas bajo /api):
     GET    /todo                         recetas, plan, registro y ajustes
     PUT    /recetas/:id                  crea o modifica (el id lo pone el cliente, UUID)
     DELETE /recetas/:id                  borrado lógico
     PUT    /huecos/:fecha/:momento       un hueco del plan
     DELETE /huecos/:fecha/:momento
     PUT    /semana/:lunes                los huecos de toda una semana de golpe (reparto)
     PUT    /registro/:fecha/:momento     lo que comiste
     DELETE /registro/:fecha/:momento
     PUT    /ajustes/:clave               { valor }
     GET    /salud/db                     comprobación de conexión

   Todo es idempotente: repetir un PUT deja lo mismo (la app reintenta
   lo que no pudo subir sin miedo a duplicar).
   ============================================================ */

import { CLAVES_SUBFAMILIA, CLAVES_GRUPO_HUECO, CLAVES_TIPO_RECETA, CLAVES_MOMENTO, CLAVES_MOMENTO_REGISTRO } from "./catalogo.mjs";

const json = (obj, status = 200) => Response.json(obj, { status, headers: { "cache-control": "no-store" } });
const error = (msg, status = 400) => json({ error: msg }, status);

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_CLAVE_AJUSTE = /^[a-z_]{1,40}$/;
const ORIGENES = new Set(["plan", "receta", "libre", "fuera", "nada"]);

const texto = (x, max = 500) => String(x ?? "").trim().slice(0, max);
const fechaValida = (f) => RE_FECHA.test(f || "") && !Number.isNaN(Date.parse(f + "T00:00:00Z")) && new Date(f + "T00:00:00Z").toISOString().slice(0, 10) === f;
const uuidONull = (x) => (x && RE_UUID.test(x) ? x : null);
const entero = (x, min, max) => { const n = Number(x); return Number.isInteger(n) && n >= min && n <= max ? n : null; };

/* Array de Postgres como literal ('{"a","b"}') para que Neon y pglite lo reciban igual */
const arr = (lista) => "{" + lista.map((s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";

function componentesValidos(lista) {
  if (!Array.isArray(lista)) return { error: "componentes tiene que ser una lista" };
  if (lista.length > 60) return { error: "demasiados componentes" };
  const malos = lista.filter((k) => !CLAVES_SUBFAMILIA.has(k));
  if (malos.length) return { error: "componentes desconocidos: " + [...new Set(malos)].join(", ") };
  return { ok: lista };
}

const sumaDias = (fecha, n) => {
  const d = new Date(fecha + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/* Columnas con fechas como texto: el cliente recibe lo mismo desde Neon y desde pglite */
const COLS_RECETA = `id, nombre, grupo, subfamilia, momentos, componentes, ingredientes, pasos, raciones, minutos, enlace, etiquetas,
                     favorita, nota, creado_por, creado_en::text as creado_en, actualizado_en::text as actualizado_en, borrado_en::text as borrado_en`;
const COLS_HUECO = `fecha::text as fecha, momento, grupo, subfamilia, receta_id, guarnicion_id, fijo, actualizado_en::text as actualizado_en`;
const COLS_REGISTRO = `fecha::text as fecha, momento, origen, receta_id, guarnicion_id, descripcion, componentes, nota, creado_por,
                       actualizado_en::text as actualizado_en`;

export function crearApi({ sql, lote }) {
  const enLote = async (stmts) => {
    if (lote) return lote(stmts);
    for (const s of stmts) await sql(s.sql, s.params);
  };

  /* ---------- recetas ---------- */
  async function ponReceta(id, b, quien) {
    if (!RE_UUID.test(id)) return error("el id tiene que ser un UUID");
    const nombre = texto(b.nombre, 160);
    if (!nombre) return error("falta el nombre");
    if (!CLAVES_TIPO_RECETA.has(b.grupo)) return error("tipo de receta no válido");
    const subfamilia = b.subfamilia && CLAVES_SUBFAMILIA.has(b.subfamilia) ? b.subfamilia : null;
    const momentos = Array.isArray(b.momentos) ? b.momentos.filter((m) => CLAVES_MOMENTO.has(m)) : ["comida", "cena"];
    const comp = componentesValidos(b.componentes ?? []);
    if (comp.error) return error(comp.error);
    const etiquetas = Array.isArray(b.etiquetas) ? [...new Set(b.etiquetas.map((e) => texto(e, 40)).filter(Boolean))].slice(0, 20) : [];
    const enlace = texto(b.enlace, 600);
    if (enlace && !/^https?:\/\//i.test(enlace)) return error("el enlace tiene que empezar por http:// o https://");

    const [r] = await sql(
      `insert into recetas (id, nombre, grupo, subfamilia, momentos, componentes, ingredientes, pasos, raciones, minutos, enlace, etiquetas, favorita, nota, creado_por)
       values ($1, $2, $3, $4, $5::text[], $6::text[], $7, $8, $9, $10, $11, $12::text[], $13, $14, $15)
       on conflict (id) do update set nombre = excluded.nombre, grupo = excluded.grupo, subfamilia = excluded.subfamilia,
         momentos = excluded.momentos, componentes = excluded.componentes, ingredientes = excluded.ingredientes, pasos = excluded.pasos,
         raciones = excluded.raciones, minutos = excluded.minutos, enlace = excluded.enlace, etiquetas = excluded.etiquetas,
         favorita = excluded.favorita, nota = excluded.nota, actualizado_en = now(), borrado_en = null
       returning ${COLS_RECETA}`,
      [id, nombre, b.grupo, subfamilia, arr(momentos), arr(comp.ok), texto(b.ingredientes, 8000), texto(b.pasos, 20000),
        entero(b.raciones, 1, 99), entero(b.minutos, 1, 2000), enlace || null, arr(etiquetas), !!b.favorita, texto(b.nota, 2000), quien]);
    return json({ ok: true, receta: r });
  }

  /* ---------- plan ---------- */
  function validaHueco(fecha, momento, b) {
    if (!fechaValida(fecha)) return { error: "fecha no válida" };
    if (!CLAVES_MOMENTO.has(momento)) return { error: "momento no válido" };
    if (!CLAVES_GRUPO_HUECO.has(b.grupo)) return { error: "grupo no válido: " + b.grupo };
    const subfamilia = b.subfamilia && CLAVES_SUBFAMILIA.has(b.subfamilia) ? b.subfamilia : null;
    return { ok: [fecha, momento, b.grupo, subfamilia, uuidONull(b.receta_id), uuidONull(b.guarnicion_id), !!b.fijo] };
  }
  const SQL_HUECO = `insert into huecos (fecha, momento, grupo, subfamilia, receta_id, guarnicion_id, fijo)
                     values ($1, $2, $3, $4, $5, $6, $7)
                     on conflict (fecha, momento) do update set grupo = excluded.grupo, subfamilia = excluded.subfamilia,
                       receta_id = excluded.receta_id, guarnicion_id = excluded.guarnicion_id, fijo = excluded.fijo, actualizado_en = now()`;

  async function recetasExisten(ids) {
    const unicos = [...new Set(ids.filter(Boolean))];
    if (!unicos.length) return [];
    const filas = await sql(`select id from recetas where id = any($1::uuid[])`, [arr(unicos)]);
    const hay = new Set(filas.map((f) => f.id));
    return unicos.filter((id) => !hay.has(id));
  }

  async function ponHueco(fecha, momento, b) {
    const v = validaHueco(fecha, momento, b);
    if (v.error) return error(v.error);
    const faltan = await recetasExisten([v.ok[4], v.ok[5]]);
    if (faltan.length) return error("receta desconocida: " + faltan.join(", "));
    await sql(SQL_HUECO, v.ok);
    const [h] = await sql(`select ${COLS_HUECO} from huecos where fecha = $1 and momento = $2`, [fecha, momento]);
    return json({ ok: true, hueco: h });
  }

  async function ponSemana(lunes, b) {
    if (!fechaValida(lunes) || new Date(lunes + "T00:00:00Z").getUTCDay() !== 1) return error("la semana se indica con la fecha de su lunes");
    if (!Array.isArray(b.huecos) || b.huecos.length > 21) return error("huecos no válidos");
    const domingo = sumaDias(lunes, 6);
    const filas = [];
    for (const h of b.huecos) {
      if (!(h.fecha >= lunes && h.fecha <= domingo)) return error(`el hueco ${h.fecha} no es de esta semana`);
      const v = validaHueco(h.fecha, h.momento, h);
      if (v.error) return error(v.error);
      filas.push(v.ok);
    }
    const faltan = await recetasExisten(filas.flatMap((f) => [f[4], f[5]]));
    if (faltan.length) return error("receta desconocida: " + faltan.join(", "));
    // Una sola transacción (en el Worker, una sola petición HTTP a Neon)
    await enLote([
      { sql: `delete from huecos where fecha between $1 and $2`, params: [lunes, domingo] },
      ...filas.map((params) => ({ sql: SQL_HUECO, params })),
    ]);
    const huecos = await sql(`select ${COLS_HUECO} from huecos where fecha between $1 and $2 order by fecha, momento`, [lunes, domingo]);
    return json({ ok: true, huecos });
  }

  /* ---------- registro ---------- */
  async function ponRegistro(fecha, momento, b, quien) {
    if (!fechaValida(fecha)) return error("fecha no válida");
    if (!CLAVES_MOMENTO_REGISTRO.has(momento)) return error("momento no válido");
    if (!ORIGENES.has(b.origen)) return error("origen no válido");
    const comp = componentesValidos(b.componentes ?? []);
    if (comp.error) return error(comp.error);
    const receta = uuidONull(b.receta_id), guarnicion = uuidONull(b.guarnicion_id);
    const faltan = await recetasExisten([receta, guarnicion]);
    if (faltan.length) return error("receta desconocida: " + faltan.join(", "));
    const [r] = await sql(
      `insert into registro (fecha, momento, origen, receta_id, guarnicion_id, descripcion, componentes, nota, creado_por)
       values ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9)
       on conflict (fecha, momento) do update set origen = excluded.origen, receta_id = excluded.receta_id,
         guarnicion_id = excluded.guarnicion_id, descripcion = excluded.descripcion, componentes = excluded.componentes,
         nota = excluded.nota, creado_por = excluded.creado_por, actualizado_en = now()
       returning ${COLS_REGISTRO}`,
      [fecha, momento, b.origen, receta, guarnicion, texto(b.descripcion, 300), arr(comp.ok), texto(b.nota, 1000), quien]);
    return json({ ok: true, registro: r });
  }

  return async function manejar(req, quien) {
    const url = new URL(req.url);
    const ruta = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
    let p;
    try { p = ruta.split("/").filter(Boolean).map(decodeURIComponent); } catch (e) { return error("ruta no válida"); }
    const leerJson = async () => { try { const b = await req.json(); return b && typeof b === "object" ? b : null; } catch (e) { return null; } };
    const M = req.method;

    try {
      if (M === "GET" && ruta === "/salud/db") {
        const [f] = await sql(`select (select count(*) from recetas where borrado_en is null)::int as recetas,
                                      (select count(*) from registro)::int as registro,
                                      (select count(*) from huecos)::int as huecos`);
        return json({ ok: true, quien, ...f });
      }

      if (M === "GET" && ruta === "/todo") {
        const [recetas, huecos, registro, ajustes] = await Promise.all([
          sql(`select ${COLS_RECETA} from recetas order by nombre`),
          sql(`select ${COLS_HUECO} from huecos order by fecha, momento`),
          sql(`select ${COLS_REGISTRO} from registro order by fecha, momento`),
          sql(`select clave, valor from ajustes`),
        ]);
        return json({ quien, recetas, huecos, registro, ajustes: Object.fromEntries(ajustes.map((a) => [a.clave, a.valor])) });
      }

      if (p[0] === "recetas" && p.length === 2) {
        if (M === "PUT") { const b = await leerJson(); if (!b) return error("cuerpo no válido"); return await ponReceta(p[1], b, quien); }
        if (M === "DELETE") {
          if (!RE_UUID.test(p[1])) return error("id no válido");
          await sql(`update recetas set borrado_en = now(), actualizado_en = now() where id = $1 and borrado_en is null`, [p[1]]);
          return json({ ok: true });
        }
      }

      if (p[0] === "huecos" && p.length === 3) {
        if (M === "PUT") { const b = await leerJson(); if (!b) return error("cuerpo no válido"); return await ponHueco(p[1], p[2], b); }
        if (M === "DELETE") {
          if (!fechaValida(p[1]) || !CLAVES_MOMENTO.has(p[2])) return error("hueco no válido");
          await sql(`delete from huecos where fecha = $1 and momento = $2`, [p[1], p[2]]);
          return json({ ok: true });
        }
      }

      if (p[0] === "semana" && p.length === 2 && M === "PUT") {
        const b = await leerJson(); if (!b) return error("cuerpo no válido");
        return await ponSemana(p[1], b);
      }

      if (p[0] === "registro" && p.length === 3) {
        if (M === "PUT") { const b = await leerJson(); if (!b) return error("cuerpo no válido"); return await ponRegistro(p[1], p[2], b, quien); }
        if (M === "DELETE") {
          if (!fechaValida(p[1]) || !CLAVES_MOMENTO_REGISTRO.has(p[2])) return error("registro no válido");
          await sql(`delete from registro where fecha = $1 and momento = $2`, [p[1], p[2]]);
          return json({ ok: true });
        }
      }

      if (p[0] === "ajustes" && p.length === 2 && M === "PUT") {
        if (!RE_CLAVE_AJUSTE.test(p[1])) return error("clave no válida");
        const b = await leerJson(); if (!b || !("valor" in b)) return error("falta 'valor'");
        const valor = JSON.stringify(b.valor);
        if (valor.length > 20000) return error("ajuste demasiado grande");
        await sql(`insert into ajustes (clave, valor) values ($1, $2::jsonb)
                   on conflict (clave) do update set valor = excluded.valor, actualizado_en = now()`, [p[1], valor]);
        return json({ ok: true });
      }

      return error("no existe", 404);
    } catch (e) {
      console.error("API", M, ruta, e);
      return error("error del servidor: " + String(e.message || e), 500);
    }
  };
}
