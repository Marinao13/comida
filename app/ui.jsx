/* Piezas pequeñas que comparten las vistas */
import React, { useEffect, useRef, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { FAMILIAS, SUB, GRUPO, TIPO_RECETA } from "../src/catalogo.mjs";
import { ESTADOS, textoObjetivo } from "./nutricion.js";

/* ---------- hoja (modal / panel inferior en el móvil) ---------- */
const pilaHojas = [];                                   // hojas abiertas, la última encima
function teclaHoja(e) { if (e.key === "Escape" && pilaHojas.length) pilaHojas[pilaHojas.length - 1].current(); }

export function Hoja({ titulo, subtitulo, onCerrar, pie, ancha, children }) {
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  useEffect(() => {
    const yo = { get current() { return cerrar.current; } };
    pilaHojas.push(yo);
    if (pilaHojas.length === 1) { document.addEventListener("keydown", teclaHoja); document.body.style.overflow = "hidden"; }
    return () => {
      pilaHojas.splice(pilaHojas.indexOf(yo), 1);
      if (!pilaHojas.length) { document.removeEventListener("keydown", teclaHoja); document.body.style.overflow = ""; }
    };
  }, []);
  return (
    <div className="velo" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className={"hoja" + (ancha ? " ancha" : "")} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="cab-hoja">
          <div className="crece">
            <h3>{titulo}</h3>
            {subtitulo && <div className="nota">{subtitulo}</div>}
          </div>
          <button className="btn icono" onClick={onCerrar} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="cuerpo">{children}</div>
        {pie && <div className="pie">{pie}</div>}
      </div>
    </div>
  );
}

/* ---------- pastilla de grupo (hueco o tipo de receta) ---------- */
export function Pastilla({ grupo, corto, className = "" }) {
  const g = GRUPO[grupo] || TIPO_RECETA[grupo];
  if (!g) return null;
  return (
    <span className={"pastilla " + className} style={{ background: g.suave, color: g.color }}>
      <span className="bola" style={{ background: g.color }} />
      {corto ? g.corto || g.nombre : g.nombre}
    </span>
  );
}

/* ---------- estado con icono y texto (nunca solo color) ---------- */
export function Estado({ estado, corto }) {
  if (!estado) return <span className="estado tenue">—</span>;
  const e = ESTADOS[estado];
  return (
    <span className={"estado " + e.clase} title={e.nombre}>
      <span className="ic" aria-hidden="true">{e.icono}</span>
      {!corto && e.nombre}
    </span>
  );
}

/* ---------- barra con la banda del objetivo ---------- */
export function BarraObjetivo({ n, objetivo, escala, estado }) {
  const tope = Math.max(escala || 0, n, objetivo?.max || 0, objetivo?.min || 0, 1) * 1.12;
  const pct = (x) => `${Math.min(100, (x / tope) * 100)}%`;
  const min = objetivo?.min ?? 0, max = objetivo?.max ?? tope;
  return (
    <div className="objetivo" aria-hidden="true">
      {objetivo && <div className="banda" style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }} />}
      {n > 0 && <div className={"relleno " + (estado || "")} style={{ width: pct(n) }} />}
    </div>
  );
}

export function FilaObjetivo({ nombre, n, objetivo, texto, estado, escala, sub, dia, extra }) {
  return (
    <div className={"fila-objetivo" + (sub ? " sub" : "")}>
      <div className="nom">{nombre}</div>
      <BarraObjetivo n={n} objetivo={objetivo} escala={escala} estado={estado} />
      <div className="cifra fila" style={{ justifyContent: "flex-end", gap: 10 }}>
        <span className="txt" title={texto || undefined}><b>{Number.isInteger(n) ? n : n.toFixed(1)}</b> {objetivo ? <span className="tenue">· {textoObjetivo(objetivo, dia)}</span> : texto ? <span className="tenue">· {texto}</span> : null}</span>
        {!sub && <Estado estado={estado} corto />}
        {extra}
      </div>
    </div>
  );
}

/* ---------- componentes: resumen compacto ---------- */
export function agrupaComponentes(lista) {
  const n = {};
  for (const k of lista || []) n[k] = (n[k] || 0) + 1;
  return Object.entries(n);
}

export function Componentes({ lista, vacio = "sin componentes" }) {
  const g = agrupaComponentes(lista);
  if (!g.length) return <span className="nota">{vacio}</span>;
  return (
    <div className="comps">
      {g.map(([k, n]) => (
        <span key={k} className={"comp" + (SUB[k]?.base ? " base" : "")}>{SUB[k]?.nombre || k}{n > 1 ? ` ×${n}` : ""}</span>
      ))}
    </div>
  );
}

/* ---------- selector de componentes: elegidos arriba, familias abajo ---------- */
const FAMS_SELECTOR = FAMILIAS.map((f) => ({ clave: f.clave, nombre: f.nombre.replace(" y hortalizas", "").replace(" y semillas", ""), subs: f.subfamilias }));

export function SelectorComponentes({ valor, onCambio, inicial = "verduras" }) {
  const [fam, setFam] = useState(inicial);
  const g = agrupaComponentes(valor);
  // onCambio recibe una función (lista anterior → nueva): dos toques seguidos no se pisan
  const suma = (k, d) => onCambio((prev) => {
    if (d > 0) return [...prev, k];
    const i = prev.lastIndexOf(k);
    return i >= 0 ? [...prev.slice(0, i), ...prev.slice(i + 1)] : prev;
  });
  const actual = FAMS_SELECTOR.find((f) => f.clave === fam) || FAMS_SELECTOR[0];
  return (
    <div className="selector pila">
      <div className="chips">
        {!g.length && <span className="nota">Nada todavía: añade abajo lo que lleva (una ración de cada).</span>}
        {g.map(([k, n]) => (
          <span key={k} className="contador" title={SUB[k]?.nombre}>
            <button onClick={() => suma(k, -1)} aria-label={"Quitar " + SUB[k]?.nombre}><Minus size={13} /></button>
            <span className="et">{SUB[k]?.nombre || k}{n > 1 ? ` ×${n}` : ""}</span>
            <button onClick={() => suma(k, 1)} aria-label={"Añadir " + SUB[k]?.nombre}><Plus size={13} /></button>
          </span>
        ))}
      </div>
      <div>
        <div className="familias" role="tablist">
          {FAMS_SELECTOR.map((f) => (
            <button key={f.clave} className={f.clave === fam ? "on" : ""} onClick={() => setFam(f.clave)} role="tab" aria-selected={f.clave === fam}>{f.nombre}</button>
          ))}
        </div>
        <div className="subs">
          {actual.subs.map((s) => (
            <button key={s.clave} className="chip" onClick={() => suma(s.clave, 1)} title={(s.alimentos || []).flatMap((x) => x.nombres).slice(0, 8).join(", ")}>
              <Plus size={13} /> {s.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- varios ---------- */
export function Vacio({ icono, titulo, children }) {
  return (
    <div className="tarjeta" style={{ textAlign: "center", padding: "28px 18px" }}>
      {icono && <div style={{ color: "var(--hoja)", marginBottom: 8 }}>{icono}</div>}
      <h3>{titulo}</h3>
      <div className="nota" style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

export function Interruptor({ marcado, onCambio, children, nota }) {
  return (
    <label className="interruptor">
      <input type="checkbox" checked={!!marcado} onChange={(e) => onCambio(e.target.checked)} />
      <span><span style={{ fontWeight: 600 }}>{children}</span>{nota && <div className="nota">{nota}</div>}</span>
    </label>
  );
}

export const nombreReceta = (recetas, id) => (id ? recetas[id]?.nombre || "(receta borrada)" : null);
