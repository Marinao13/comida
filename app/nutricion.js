/* ============================================================
   Recuento de raciones y comparación con los objetivos

   Un "componente" es una clave de subfamilia (lentejas, hoja_verde…).
   Una lista de componentes puede repetir claves: dos veces "naranjas"
   son dos raciones de verdura naranja.
   ============================================================ */

import { FAMILIAS, FAM, SUB, SUBFAMILIAS, TOTALES, FAMILIA_A_GRUPO } from "../src/catalogo.mjs";
import { sumaDias, diasDe, lunesDelAño } from "./fechas.js";

export const VERDURAS_CLAVE = ["hoja_verde", "rojas", "cruciferas", "naranjas"];
const PRINCIPALES = new Set(["comida", "cena"]);

/* listas: array de arrays de componentes → { sub, fam, tot } con el número de raciones */
export function contar(listas) {
  const sub = {}, fam = {}, tot = {};
  for (const lista of listas) {
    for (const k of lista || []) {
      const s = SUB[k];
      if (!s) continue;
      sub[k] = (sub[k] || 0) + 1;
      if (!s.base) fam[s.familia] = (fam[s.familia] || 0) + 1;
    }
  }
  for (const t of TOTALES) tot[t.clave] = t.familias.reduce((n, f) => n + (fam[f] || 0), 0);
  return { sub, fam, tot };
}

/* 'falta' | 'ok' | 'alto' | null (sin objetivo) */
export function estado(n, objetivo) {
  if (!objetivo) return null;
  if (objetivo.min != null && n < objetivo.min) return "falta";
  if (objetivo.max != null && n > objetivo.max) return "alto";
  return "ok";
}

export const ESTADOS = {
  ok: { nombre: "En objetivo", icono: "✓", clase: "ok" },
  falta: { nombre: "Por debajo", icono: "↓", clase: "falta" },
  alto: { nombre: "Por encima", icono: "↑", clase: "alto" },
  pocos: { nombre: "Pocos datos", icono: "·", clase: "pocos" },
};

/* Texto corto del objetivo a partir de los números */
export function textoObjetivo(o, dia = false) {
  if (!o) return "";
  const suf = o.periodo === "mes" ? " al mes" : dia ? " al día" : "/sem";
  if (o.min != null && o.max != null) return o.min === o.max ? `${o.min}${suf}` : `${o.min}–${o.max}${suf}`;
  if (o.min != null) return `≥${o.min}${suf}`;
  return `≤${o.max}${suf}`;
}

/* ---------------- Detectar componentes en los ingredientes ---------------- */

export const normaliza = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Coinciden antes que los alimentos y no cuentan: evitan falsos positivos ("caldo de pollo" no es carne)
const NO_CUENTAN = ["nuez moscada", "leche de coco", "pan rallado", "zumo de limon", "caldo de pollo", "caldo de pescado", "caldo de verduras",
  "caldo de carne", "salsa de soja", "pimenton", "pimienta", "harina", "aceite", "vinagre", "concentrado de tomate"];

const INDICE = (() => {
  const lista = [];
  for (const n of NO_CUENTAN) lista.push({ n, clave: null });
  for (const s of SUBFAMILIAS) for (const al of s.alimentos || []) for (const nombre of al.nombres) {
    const n = normaliza(nombre);
    lista.push({ n, clave: s.clave, nombre });
  }
  // variantes de plural/singular, sin repetir
  const vistos = new Set(), final = [];
  for (const e of lista) {
    const variantes = new Set([e.n]);
    if (/[aeiou]$/.test(e.n)) variantes.add(e.n + "s"); else variantes.add(e.n + "es");
    if (/es$/.test(e.n)) variantes.add(e.n.slice(0, -2));
    if (/s$/.test(e.n)) variantes.add(e.n.slice(0, -1));
    for (const v of variantes) if (v.length > 2 && !vistos.has(v)) { vistos.add(v); final.push({ ...e, v }); }
  }
  return final.sort((x, y) => y.v.length - x.v.length);
})();

const escapa = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RE_INDICE = INDICE.map((e) => ({ ...e, re: new RegExp(`(^|[^a-zñ])${escapa(e.v)}(?=[^a-zñ]|$)`) }));

/* Devuelve [{ clave, nombre, linea }] sin repetir clave, en orden de aparición */
export function detectar(ingredientes) {
  const vistos = new Map();
  for (const lineaOriginal of String(ingredientes || "").split(/\n+/)) {
    let linea = " " + normaliza(lineaOriginal) + " ";
    const hallados = [];
    for (const e of RE_INDICE) {                       // de más largo a más corto: "pimiento verde" antes que "pimiento"
      const m = e.re.exec(linea);
      if (!m) continue;
      const ini = m.index + m[1].length;
      linea = linea.slice(0, ini) + " ".repeat(e.v.length) + linea.slice(ini + e.v.length); // no vuelve a coincidir
      if (e.clave) hallados.push({ ini, e });
    }
    for (const { e } of hallados.sort((x, y) => x.ini - y.ini)) {
      if (!vistos.has(e.clave)) vistos.set(e.clave, { clave: e.clave, nombre: e.nombre, linea: lineaOriginal.trim() });
    }
  }
  return [...vistos.values()];
}

/* Componentes propuestos para una receta: una ración de cada subfamilia detectada (huevo x2 en platos de huevo) */
export function componentesPropuestos(ingredientes, grupo) {
  return detectar(ingredientes).flatMap((d) => (d.clave === "huevo" && grupo === "huevos" ? ["huevo", "huevo"] : [d.clave]));
}

/* Tipo de receta más probable según sus componentes */
export function grupoSugerido(componentes) {
  for (const k of componentes || []) {
    const f = SUB[k]?.familia;
    if (FAMILIA_A_GRUPO[f]) return FAMILIA_A_GRUPO[f];
  }
  const fams = new Set((componentes || []).map((k) => SUB[k]?.familia));
  if (fams.size && [...fams].every((f) => f === "verduras")) return "verdura";
  return null;
}

/* Subfamilia de proteína principal de una receta (para el hueco "toca lentejas") */
export function subfamiliaPrincipal(componentes) {
  return (componentes || []).find((k) => FAMILIA_A_GRUPO[SUB[k]?.familia]) || null;
}

/* ---------------- Registro por semanas ---------------- */

/* registro: array de filas { fecha, momento, origen, componentes } */
export function indexaPorFecha(registro) {
  const m = new Map();
  for (const r of registro) { if (!m.has(r.fecha)) m.set(r.fecha, []); m.get(r.fecha).push(r); }
  return m;
}

export function resumenDias(porFecha, dias) {
  const filas = dias.flatMap((d) => porFecha.get(d) || []);
  const principales = filas.filter((r) => PRINCIPALES.has(r.momento));
  const comidas = principales.filter((r) => r.origen !== "nada").length;
  return {
    conteo: contar(filas.map((r) => r.componentes)),
    comidas,                                            // comidas y cenas apuntadas (de 14 en una semana)
    segunPlan: principales.filter((r) => r.origen === "plan").length,
    fuera: principales.filter((r) => r.origen === "fuera").length,
    filas: filas.length,
  };
}

export const resumenSemana = (porFecha, lunes) => ({ lunes, ...resumenDias(porFecha, diasDe(lunes)) });

/* Semana con datos suficientes para juzgarla: al menos la mitad de comidas y cenas apuntadas */
export const semanaValida = (r) => r.comidas >= 7;

/* Estado de una familia (o total) en una semana, teniendo en cuenta los límites mensuales */
export function estadoFamilia(clave, conteo) {
  const f = FAM[clave] || TOTALES.find((t) => t.clave === clave);
  const n = FAM[clave] ? conteo.fam[clave] || 0 : conteo.tot[clave] || 0;
  return { n, estado: estado(n, f.objetivo), objetivo: f.objetivo };
}

export function resumenAño(registro, año) {
  const porFecha = indexaPorFecha(registro);
  return lunesDelAño(año).map((lunes) => resumenSemana(porFecha, lunes));
}

/* Raciones de una subfamilia con límite mensual en las 4 semanas que acaban en `lunes` */
export function enCuatroSemanas(porFecha, lunes, clave) {
  const dias = Array.from({ length: 28 }, (_, i) => sumaDias(lunes, i - 21));
  return resumenDias(porFecha, dias).conteo.sub[clave] || 0;
}

export { FAMILIAS, FAM, SUB, TOTALES };
