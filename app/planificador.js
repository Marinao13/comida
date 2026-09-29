/* ============================================================
   Planificador · reparto de grupos en la semana y sugerencias de recetas

   Todo es puro (sin React ni red) para poder probarlo con node --test.

   Reparto: 14 huecos (comida y cena de 7 días). Los huecos fijos no se
   tocan; el resto recibe los grupos que faltan para cumplir el reparto
   (4 legumbres, 2 azul, 2 blanco, 2 carne blanca, 1 roja, 2 huevos,
   1 libre por defecto). Se prueban muchas combinaciones al azar (con
   semilla, reproducible) y se pule la mejor con intercambios, buscando
   la que menos penaliza:
     · el mismo grupo dos veces el mismo día              +10
     · dos pescados o dos carnes el mismo día              +3
     · el mismo grupo en la cena y la comida siguiente     +4
     · el mismo grupo en días seguidos                     +1
     · preferencias: legumbre por la noche +2, huevos a mediodía +0.7,
       libre entre semana +0.6
   ============================================================ */

import { GRUPOS, GRUPO, SUB } from "../src/catalogo.mjs";
import { diasDe, lunesDe, semanaISO, diasEntre, haceDias } from "./fechas.js";
import { contar, VERDURAS_CLAVE } from "./nutricion.js";

export const claveHueco = (fecha, momento) => `${fecha}|${momento}`;
export const ORDEN_MOMENTO = { desayuno: 0, comida: 1, cena: 2, otros: 3 };
export const PREFERENCIAS_POR_DEFECTO = { desayunos: true, legumbresAMediodia: true, huevosPorLaNoche: true, libreFinde: true };

/* ---------- azar reproducible ---------- */
export function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const baraja = (lista, r) => { const x = [...lista]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

/* ---------- reparto ---------- */
const META = { pescado_azul: "pescado", pescado_blanco: "pescado", carne_blanca: "carne", carne_roja: "carne" };
// Si hay menos huecos libres que grupos (p. ej. varios "fuera"), se quita en este orden
const PRIORIDAD_QUITAR = ["libre", "carne_roja", "huevos", "carne_blanca", "pescado_blanco", "pescado_azul", "legumbres"];
const NEUTROS = new Set(["fuera", undefined, null]);

/* seq: 14 grupos [lun comida, lun cena, mar comida, …, dom cena] */
export function penalizacion(seq, pref = PREFERENCIAS_POR_DEFECTO) {
  let p = 0;
  for (let d = 0; d < 7; d++) {
    const c = seq[2 * d], n = seq[2 * d + 1];
    if (!NEUTROS.has(c) && c === n) p += c === "libre" ? 2 : 10;
    else if (META[c] && META[c] === META[n]) p += 3;
    if (pref.legumbresAMediodia && n === "legumbres") p += 2;
    if (pref.huevosPorLaNoche && c === "huevos") p += 0.7;
    if (pref.libreFinde && d < 5) p += (c === "libre" ? 0.6 : 0) + (n === "libre" ? 0.6 : 0);
    if (d < 6) {
      const sig = seq[2 * d + 2];
      if (!NEUTROS.has(n) && n === sig) p += 4;
      else if (META[n] && META[n] === META[sig]) p += 1.5;
      const hoy = new Set([c, n]), man = new Set([seq[2 * d + 2], seq[2 * d + 3]]);
      for (const g of hoy) if (!NEUTROS.has(g) && g !== "libre" && man.has(g)) p += 1;
    }
  }
  return p;
}

/*  lunes      fecha del lunes (AAAA-MM-DD)
    reparto    { legumbres: 4, … } huecos por grupo
    actuales   Map claveHueco → hueco (los fijos se respetan)
    desayunos  recetas de desayuno para ir rotando
    → lista de huecos de la semana (14 o 21)                                   */
export function generarReparto({ lunes, reparto, actuales = new Map(), semilla = 1, pref = PREFERENCIAS_POR_DEFECTO, desayunos = [] }) {
  const r = azar(semilla ^ hash(lunes));
  const dias = diasDe(lunes);
  const pos = dias.flatMap((fecha) => ["comida", "cena"].map((momento) => ({ fecha, momento })));
  const seq = new Array(14).fill(null);
  const libres = [];
  const quedan = { ...reparto };
  pos.forEach((p, i) => {
    const h = actuales.get(claveHueco(p.fecha, p.momento));
    if (h?.fijo) { seq[i] = h.grupo; if (quedan[h.grupo] > 0) quedan[h.grupo]--; }
    else libres.push(i);
  });

  const bolsa = GRUPOS.flatMap((g) => new Array(Math.max(0, quedan[g.clave] || 0)).fill(g.clave));
  while (bolsa.length > libres.length) {
    const g = PRIORIDAD_QUITAR.find((x) => bolsa.includes(x));
    bolsa.splice(bolsa.lastIndexOf(g), 1);
  }
  while (bolsa.length < libres.length) bolsa.push("libre");

  // búsqueda: muchas barajas al azar + pulido por intercambios
  let mejor = null, mejorP = Infinity;
  const prueba = [...seq];
  for (let it = 0; it < 500 && libres.length; it++) {
    const b = baraja(bolsa, r);
    libres.forEach((i, k) => { prueba[i] = b[k]; });
    const p = penalizacion(prueba, pref);
    if (p < mejorP) { mejorP = p; mejor = [...prueba]; }
  }
  if (!mejor) mejor = [...seq];
  for (let mejora = true; mejora;) {
    mejora = false;
    for (let x = 0; x < libres.length; x++) for (let y = x + 1; y < libres.length; y++) {
      const i = libres[x], j = libres[y];
      if (mejor[i] === mejor[j]) continue;
      [mejor[i], mejor[j]] = [mejor[j], mejor[i]];
      const p = penalizacion(mejor, pref);
      if (p < mejorP - 1e-9) { mejorP = p; mejora = true; } else [mejor[i], mejor[j]] = [mejor[j], mejor[i]];
    }
  }

  // sugerencia de subfamilia: rota por semanas y descuenta la de los fijos
  const semana = semanaISO(lunes).semana;
  const pistas = {};
  for (const g of GRUPOS) {
    const rot = g.rotacion;
    if (!rot.length) continue;
    const usadas = pos.map((p) => actuales.get(claveHueco(p.fecha, p.momento))).filter((h) => h?.fijo && h.grupo === g.clave && h.subfamilia).map((h) => h.subfamilia);
    const necesarias = libres.filter((i) => mejor[i] === g.clave).length;
    const ciclo = [];
    for (let k = 0; ciclo.length < necesarias + usadas.length && k < 50; k++) ciclo.push(rot[(k + semana) % rot.length]);
    for (const u of usadas) { const i = ciclo.indexOf(u); if (i >= 0) ciclo.splice(i, 1); }
    pistas[g.clave] = baraja(ciclo.slice(0, necesarias), r);
  }

  const huecos = pos.map((p, i) => {
    const h = actuales.get(claveHueco(p.fecha, p.momento));
    if (h?.fijo) return { ...h };
    const grupo = mejor[i];
    return { fecha: p.fecha, momento: p.momento, grupo, subfamilia: pistas[grupo]?.shift() || null, receta_id: null, guarnicion_id: null, fijo: false };
  });

  // desayunos: se respetan los fijos; el resto rota entre las recetas de desayuno
  const ciclo = baraja(desayunos.map((x) => x.id), r);
  let k = 0;
  for (const fecha of dias) {
    const h = actuales.get(claveHueco(fecha, "desayuno"));
    if (h?.fijo) huecos.push({ ...h });
    else if (pref.desayunos) huecos.push({ fecha, momento: "desayuno", grupo: "desayuno", subfamilia: null, receta_id: ciclo.length ? ciclo[k++ % ciclo.length] : null, guarnicion_id: null, fijo: false });
  }
  return ordenaHuecos(huecos);
}

export const ordenaHuecos = (lista) => [...lista].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : ORDEN_MOMENTO[a.momento] - ORDEN_MOMENTO[b.momento]));

/* Cuántos huecos de cada grupo hay en una semana (solo comidas y cenas) */
export function cuentaGrupos(huecosSemana) {
  const n = {};
  for (const h of huecosSemana) if (h.momento !== "desayuno") n[h.grupo] = (n[h.grupo] || 0) + 1;
  return n;
}

/* ---------- componentes de un hueco o de una semana planeada ---------- */
export function componentesHueco(h, porId) {
  if (!h) return [];
  const lista = [...(porId[h.receta_id]?.componentes || []), ...(porId[h.guarnicion_id]?.componentes || [])];
  if (!h.receta_id && h.subfamilia) lista.unshift(...(h.subfamilia === "huevo" ? ["huevo", "huevo"] : [h.subfamilia]));
  return lista;
}
export const balancePlan = (huecosSemana, porId) => contar(huecosSemana.map((h) => componentesHueco(h, porId)));

/* ---------- uso de cada receta: cuándo se comió o se planeó ---------- */
export function usosRecetas(registro, huecos) {
  const m = new Map();
  const uso = (id) => { if (!m.has(id)) m.set(id, { veces: 0, ultima: null, comidas: [], planes: [] }); return m.get(id); };
  for (const r of registro) for (const id of [r.receta_id, r.guarnicion_id]) if (id) {
    const u = uso(id); u.veces++; u.comidas.push(r.fecha); if (!u.ultima || r.fecha > u.ultima) u.ultima = r.fecha;
  }
  for (const h of huecos) for (const id of [h.receta_id, h.guarnicion_id]) if (id) uso(id).planes.push(h.fecha);
  return m;
}

const PROTEINA_ANIMAL = new Set(["pescado_azul", "pescado_blanco", "carne_blanca", "carne_roja", "procesados"]);
const esVegetal = (r) => !(r.componentes || []).some((k) => PROTEINA_ANIMAL.has(SUB[k]?.familia));
const nombreSub = (k) => (SUB[k]?.nombre || k).toLowerCase();

/* ¿Qué recetas pueden ir en este hueco? */
export function candidatas(hueco, tipo, recetas) {
  return recetas.filter((r) => {
    if (r.borrado_en) return false;
    if (tipo === "guarnicion") return r.grupo === "verdura" && hueco.momento !== "desayuno";
    if (hueco.grupo === "fuera") return false;
    if (hueco.grupo === "desayuno" || hueco.momento === "desayuno") return r.grupo === "desayuno";
    const momentoOk = !r.momentos?.length || r.momentos.includes(hueco.momento);
    if (!momentoOk) return false;
    if (hueco.grupo === "libre") return !["desayuno", "verdura", "otro"].includes(r.grupo);
    return r.grupo === hueco.grupo;
  });
}

/*  Sugerencias para un hueco, de mejor a peor, con los motivos.
    semana: huecos de la semana (con recetas ya puestas); usos: de usosRecetas()        */
export function sugerir({ hueco, tipo = "principal", recetas, semana = [], usos = new Map(), semilla = 0 }) {
  const porId = Object.fromEntries(recetas.map((r) => [r.id, r]));
  const lunes = lunesDe(hueco.fecha);
  const fechasSemana = new Set(semana.map((h) => h.fecha));
  const otros = semana.filter((h) => !(h.fecha === hueco.fecha && h.momento === hueco.momento));
  const vecesSemana = new Map();
  for (const id of otros.flatMap((h) => [h.receta_id, h.guarnicion_id]).filter(Boolean)) vecesSemana.set(id, (vecesSemana.get(id) || 0) + 1);
  const mismoDia = new Set(otros.filter((h) => h.fecha === hueco.fecha).flatMap((h) => [h.receta_id, h.guarnicion_id]).filter(Boolean));
  const base = tipo === "guarnicion" ? [...otros, { ...hueco, guarnicion_id: null }] : otros;
  const plan = balancePlan(base, porId);
  const faltan = VERDURAS_CLAVE.filter((k) => (plan.sub[k] || 0) < (SUB[k].objetivo?.min || 0));

  return candidatas(hueco, tipo, recetas).map((r) => {
    let puntos = 0;
    const motivos = [];
    if (tipo === "principal" && hueco.subfamilia && hueco.grupo !== "libre" && (r.subfamilia === hueco.subfamilia || r.componentes?.includes(hueco.subfamilia))) {
      puntos += 2.5; motivos.push(`toca ${nombreSub(hueco.subfamilia)}`);
    }
    if (tipo === "principal" && hueco.grupo === "libre" && esVegetal(r)) { puntos += 1; motivos.push("vegetal"); }

    const u = usos.get(r.id);
    const fechas = u ? [...u.comidas, ...u.planes.filter((f) => !fechasSemana.has(f))] : [];
    if (!fechas.length) { puntos += 2; motivos.push(u?.veces ? "hace mucho que no la haces" : "aún no la has hecho"); }
    else {
      const cerca = fechas.reduce((m, f) => (Math.abs(diasEntre(f, hueco.fecha)) < Math.abs(diasEntre(m, hueco.fecha)) ? f : m));
      const dist = Math.abs(diasEntre(cerca, hueco.fecha));
      if (dist < 7) { puntos -= 2; motivos.push(cerca < hueco.fecha ? `la hiciste ${haceDias(diasEntre(cerca, hueco.fecha))}` : "planeada en los días siguientes"); }
      else { puntos += Math.min(dist, 42) / 14; if (dist >= 21 && cerca < hueco.fecha) motivos.push(`no la haces desde ${haceDias(dist)}`); }
    }
    const veces = vecesSemana.get(r.id) || 0;
    if (veces) { puntos -= 4 * veces; motivos.push(veces === 1 ? "ya está esta semana" : `ya está ${veces} veces esta semana`); }
    if (mismoDia.has(r.id)) { puntos -= 6; motivos.push("ya está ese día"); }
    const cubre = faltan.filter((k) => r.componentes?.includes(k));
    if (cubre.length) { puntos += (tipo === "guarnicion" ? 1.5 : 0.8) * cubre.length; motivos.push("aporta " + cubre.map(nombreSub).join(" y ")); }
    if (r.favorita) { puntos += tipo === "guarnicion" ? 0.5 : 1; motivos.push("favorita"); }
    puntos += ((hash(r.id + ":" + semilla) % 1000) / 1000) * 0.4;
    return { receta: r, puntos, motivos, veces, mismoDia: mismoDia.has(r.id) };
  }).sort((x, y) => y.puntos - x.puntos || x.receta.nombre.localeCompare(y.receta.nombre, "es"));
}

const verdurasDe = (r) => (r?.componentes || []).filter((k) => SUB[k]?.familia === "verduras" && !SUB[k].base).length;

/* Pone la mejor receta (y guarnición si el plato no trae verdura) en cada hueco vacío de la semana.
   · Un plato, como mucho dos veces por semana (cocinar el doble vale); una guarnición, tres (una
     ensalada se repite sin problema); nunca dos veces el mismo día. Los desayunos sí rotan libremente.
   · Primero los huecos de grupo concreto y al final los libres, que aceptan casi todo.
   · Las guarniciones van primero a los platos elegidos que no traen verdura.
   Si ninguna receta cumple, el hueco se queda sin receta. */
export function rellenarSemana({ semana, recetas, usos = new Map(), semilla = 0 }) {
  const porId = Object.fromEntries(recetas.map((r) => [r.id, r]));
  const res = ordenaHuecos(semana).map((h) => ({ ...h }));
  const vale = (h, max) => (s) => !s.mismoDia && (h.momento === "desayuno" || s.veces < max);

  for (const h of [...res.filter((x) => x.grupo !== "libre"), ...res.filter((x) => x.grupo === "libre")]) {
    if (h.grupo === "fuera" || h.receta_id) continue;
    const s = sugerir({ hueco: h, tipo: "principal", recetas, semana: res, usos, semilla }).find(vale(h, 2));
    if (s) h.receta_id = s.receta.id;
  }

  const sinVerdura = res.filter((h) => h.momento !== "desayuno" && h.grupo !== "fuera" && !h.guarnicion_id && verdurasDe(porId[h.receta_id]) < 1);
  for (const h of [...sinVerdura.filter((x) => x.receta_id), ...sinVerdura.filter((x) => !x.receta_id)]) {
    const s = sugerir({ hueco: h, tipo: "guarnicion", recetas, semana: res, usos, semilla }).find(vale(h, 3));
    if (s) h.guarnicion_id = s.receta.id;
  }
  return res;
}

export { GRUPO };
