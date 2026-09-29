/* ============================================================
   Comida · capa de datos del navegador

   · Una tienda en memoria (recetas, huecos, registro, ajustes) que la
     interfaz lee con useTienda().
   · Cada cambio se aplica al momento en pantalla y se guarda en una
     cola persistente (localStorage) de peticiones idempotentes
     (PUT/DELETE por clave). Si no hay red, se reintenta luego.
   · Al abrir y al volver a la pestaña se trae todo del servidor (son
     pocos datos), pero solo cuando la cola está vacía: lo que está
     pendiente de subir nunca se pisa.
   ============================================================ */

import { useSyncExternalStore } from "react";
import { claveHueco } from "./planificador.js";
import { diasDe } from "./fechas.js";

const API = "/api";
const K_DATOS = "comida:datos:v1";
const K_COLA = "comida:cola:v1";

const leer = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: seguimos en memoria */ } };

const VACIO = { recetas: {}, huecos: {}, registro: {}, ajustes: {}, quien: null };
let datos = leer(K_DATOS, null) || VACIO;
let cola = leer(K_COLA, []).map((op) => ({ ...op, enVuelo: false }));
let estado = { listo: !!leer(K_DATOS, null), cargando: false, error: null, sinConexion: false, sesionCaducada: false, errorCola: null, pendientes: cola.length, avisos: [] };
let foto = { datos, estado };
const oyentes = new Set();

function emitir() {
  estado = { ...estado, pendientes: cola.length };
  foto = { datos, estado };
  for (const o of oyentes) o();
}
const suscribir = (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); };
export const useTienda = () => useSyncExternalStore(suscribir, () => foto);
export const leerDatos = () => datos;

/* ---------- avisos (toasts) ---------- */
let nAviso = 0;
export function avisar(texto, tipo = "info") {
  const id = ++nAviso;
  estado = { ...estado, avisos: [...estado.avisos, { id, texto, tipo }] };
  emitir();
  setTimeout(() => { estado = { ...estado, avisos: estado.avisos.filter((a) => a.id !== id) }; emitir(); }, tipo === "error" ? 7000 : 3200);
}

/* ---------- servidor → tienda ---------- */
function desdeServidor(t) {
  return {
    quien: t.quien,
    recetas: Object.fromEntries(t.recetas.map((r) => [r.id, r])),
    huecos: Object.fromEntries(t.huecos.map((h) => [claveHueco(h.fecha, h.momento), h])),
    registro: Object.fromEntries(t.registro.map((r) => [claveHueco(r.fecha, r.momento), r])),
    ajustes: t.ajustes || {},
  };
}

async function pedir(metodo, ruta, cuerpo) {
  // redirect: manual → si la sesión de Access ha caducado, lo sabemos en vez de fallar por CORS
  const r = await fetch(API + ruta, {
    method: metodo, redirect: "manual", credentials: "same-origin",
    headers: cuerpo === undefined ? {} : { "content-type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (r.type === "opaqueredirect" || r.status === 401) { const e = new Error("sesión caducada"); e.sesion = true; throw e; }
  let d = null;
  try { d = await r.json(); } catch (e) { /* sin cuerpo */ }
  if (!r.ok) { const e = new Error(d?.error || `error ${r.status}`); e.status = r.status; throw e; }
  return d;
}

let cargando = null;
let ultimaCarga = 0;
let cambios = 0;               // sube con cada cambio local: si cambia durante un GET, su respuesta ya es vieja
let recarga = null;
export async function cargar({ forzar = false } = {}) {
  if (cargando) return cargando;
  if (!forzar && Date.now() - ultimaCarga < 20000) return;
  cargando = (async () => {
    await vaciarCola();
    if (cola.length) return;                                    // aún hay cosas sin subir: no pisamos nada
    estado = { ...estado, cargando: true }; emitir();
    const antes = cambios;
    try {
      const t = await pedir("GET", "/todo");
      if (cambios !== antes || cola.length) {
        // algo cambió mientras llegaba la respuesta: no la aplicamos y lo intentamos de nuevo en un rato
        clearTimeout(recarga);
        recarga = setTimeout(() => cargar({ forzar: true }), 3000);
        estado = { ...estado, cargando: false };
      } else {
        datos = desdeServidor(t);
        escribir(K_DATOS, datos);
        ultimaCarga = Date.now();
        estado = { ...estado, listo: true, cargando: false, error: null, sinConexion: false, sesionCaducada: false };
      }
    } catch (e) {
      estado = { ...estado, cargando: false, sesionCaducada: !!e.sesion, sinConexion: !e.status && !e.sesion, error: e.status ? e.message : null };
    }
    emitir();
  })();
  try { await cargando; } finally { cargando = null; }
}

/* ---------- cola de cambios ---------- */
let vaciando = null;
let reintento = null;

function encolar(metodo, ruta, cuerpo) {
  cambios++;
  // Cada petición deja el recurso completo: una anterior sobre la misma ruta ya no hace falta.
  //  · Una receta se sustituye EN SU SITIO: los huecos y apuntes que la nombran van detrás y
  //    el servidor los rechazaría si la receta llegara después.
  //  · El resto se quita y la nueva va al final, para respetar el orden respecto a /semana.
  const op = { metodo, ruta, cuerpo, intentos: 0 };
  const i = cola.findIndex((x) => x.ruta === ruta && !x.enVuelo);
  if (ruta.startsWith("/recetas/") && i >= 0) cola[i] = op;
  else { cola = cola.filter((x) => x.ruta !== ruta || x.enVuelo); cola.push(op); }
  escribir(K_COLA, cola);
  escribir(K_DATOS, datos);
  emitir();
  vaciarCola();
}

export async function vaciarCola() {
  if (vaciando) return vaciando;
  vaciando = (async () => {
    while (cola.length) {
      const op = cola[0];
      op.enVuelo = true;
      try {
        await pedir(op.metodo, op.ruta, op.cuerpo);
        cola.shift();
        estado = { ...estado, sinConexion: false, sesionCaducada: false, errorCola: null };
      } catch (e) {
        op.enVuelo = false;
        if (e.sesion) { estado = { ...estado, sesionCaducada: true }; break; }
        if (!e.status || e.status >= 500) {
          // sin red o fallo del servidor (Neon parado, sin cuota…): nunca se tira; se reintenta cada vez más espaciado
          op.intentos = (op.intentos || 0) + 1;
          estado = { ...estado, sinConexion: !e.status, errorCola: e.status && op.intentos >= 3 ? e.message : null };
          clearTimeout(reintento);
          reintento = setTimeout(() => vaciarCola(), Math.min(120000, 4000 * 2 ** Math.min(op.intentos - 1, 5)));
          break;
        }
        cola.shift();                                           // 4xx: el servidor no lo acepta; reintentar no sirve
        avisar(`No se guardó: ${e.message}`, "error");
      } finally {
        escribir(K_COLA, cola);
        emitir();
      }
    }
  })();
  try { await vaciando; } finally { vaciando = null; }
}

/* Último recurso si el servidor rechaza siempre el primer cambio pendiente (Ajustes) */
export function descartarPrimero() {
  const op = cola.find((x) => !x.enVuelo);
  if (!op) return;
  cola = cola.filter((x) => x !== op);
  estado = { ...estado, errorCola: null };
  escribir(K_COLA, cola);
  emitir();
  cargar({ forzar: true });
}
export const primerPendiente = () => cola[0] ? `${cola[0].metodo} ${cola[0].ruta}` : null;

/* ---------- operaciones ---------- */
const ahora = () => new Date().toISOString();
const sinRuido = (o) => { const x = { ...o }; delete x.actualizado_en; delete x.creado_en; delete x.creado_por; delete x.borrado_en; return x; };

export const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID()
  : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));

export function guardarReceta(r) {
  const receta = { ...r, id: r.id || nuevoId(), actualizado_en: ahora(), borrado_en: null };
  datos = { ...datos, recetas: { ...datos.recetas, [receta.id]: receta } };
  encolar("PUT", `/recetas/${receta.id}`, sinRuido(receta));
  return receta;
}

export function borrarReceta(id) {
  const r = datos.recetas[id];
  if (!r) return;
  datos = { ...datos, recetas: { ...datos.recetas, [id]: { ...r, borrado_en: ahora() } } };
  encolar("DELETE", `/recetas/${id}`);
}

const cuerpoHueco = (h) => ({ grupo: h.grupo, subfamilia: h.subfamilia || null, receta_id: h.receta_id || null, guarnicion_id: h.guarnicion_id || null, fijo: !!h.fijo });

export function ponHueco(h) {
  const k = claveHueco(h.fecha, h.momento);
  datos = { ...datos, huecos: { ...datos.huecos, [k]: { ...h, actualizado_en: ahora() } } };
  encolar("PUT", `/huecos/${h.fecha}/${h.momento}`, cuerpoHueco(h));
}

export function quitarHueco(fecha, momento) {
  const huecos = { ...datos.huecos };
  delete huecos[claveHueco(fecha, momento)];
  datos = { ...datos, huecos };
  encolar("DELETE", `/huecos/${fecha}/${momento}`);
}

/* Sustituye toda la semana (reparto nuevo, intercambios, rellenar con recetas…) */
export function ponSemana(lunes, lista) {
  const dias = new Set(diasDe(lunes));
  const huecos = Object.fromEntries(Object.entries(datos.huecos).filter(([, h]) => !dias.has(h.fecha)));
  for (const h of lista) huecos[claveHueco(h.fecha, h.momento)] = { ...h, actualizado_en: ahora() };
  datos = { ...datos, huecos };
  encolar("PUT", `/semana/${lunes}`, { huecos: lista.map((h) => ({ fecha: h.fecha, momento: h.momento, ...cuerpoHueco(h) })) });
}

export function ponRegistro(r) {
  const k = claveHueco(r.fecha, r.momento);
  const fila = { origen: "libre", receta_id: null, guarnicion_id: null, descripcion: "", componentes: [], nota: "", ...r, actualizado_en: ahora() };
  datos = { ...datos, registro: { ...datos.registro, [k]: fila } };
  const { fecha, momento, ...cuerpo } = sinRuido(fila);
  encolar("PUT", `/registro/${fecha}/${momento}`, cuerpo);
}

export function quitarRegistro(fecha, momento) {
  const registro = { ...datos.registro };
  delete registro[claveHueco(fecha, momento)];
  datos = { ...datos, registro };
  encolar("DELETE", `/registro/${fecha}/${momento}`);
}

export function ponAjuste(clave, valor) {
  datos = { ...datos, ajustes: { ...datos.ajustes, [clave]: valor } };
  encolar("PUT", `/ajustes/${clave}`, { valor });
}

/* Copia de seguridad: todo en un JSON */
export function exportar() {
  const copia = {
    app: "comida", exportado: ahora(), quien: datos.quien,
    recetas: Object.values(datos.recetas), huecos: Object.values(datos.huecos),
    registro: Object.values(datos.registro), ajustes: datos.ajustes,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = `comida-${ahora().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- arranque: cargar, reintentar al volver ---------- */
export function arrancar() {
  cargar({ forzar: true });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") cargar(); });
  window.addEventListener("online", () => cargar({ forzar: true }));
  window.addEventListener("focus", () => cargar());
}
