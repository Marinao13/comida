import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from "recharts";
import { FAM, SUB, TOTALES } from "../../src/catalogo.mjs";
import { indexaPorFecha, resumenSemana, resumenAño, semanaValida, estado as estadoDe, enCuatroSemanas, textoObjetivo, ESTADOS } from "../nutricion.js";
import { hoyISO, lunesDe, sumaDias, rangoSemana, semanaISO, nombreMes, fechaCorta } from "../fechas.js";
import { FilaObjetivo, Estado } from "../ui.jsx";

const TOT = Object.fromEntries(TOTALES.map((t) => [t.clave, t]));

/* Qué se enseña y en qué orden. tipo: fam (familia), tot (total), sub (subfamilia) */
const BLOQUES = [
  { titulo: "Platos principales", filas: [
    { tipo: "fam", clave: "legumbres", subs: ["lentejas", "garbanzos", "alubias", "otras_legumbres"] },
    { tipo: "tot", clave: "pescado_total" },
    { tipo: "fam", clave: "pescado_azul", subs: ["azul_pequeno", "azul_otro", "atun_lata", "mercurio"] },
    { tipo: "fam", clave: "pescado_blanco", subs: ["blanco", "marisco"] },
    { tipo: "tot", clave: "carne_total" },
    { tipo: "fam", clave: "carne_blanca", subs: ["pollo_pavo", "conejo_aves"] },
    { tipo: "fam", clave: "carne_roja", subs: ["roja_magra", "roja_grasa"] },
    { tipo: "fam", clave: "huevos" },
    { tipo: "fam", clave: "procesados" },
  ] },
  { titulo: "Cada día", filas: [
    { tipo: "fam", clave: "verduras", subs: ["hoja_verde", "rojas", "cruciferas", "naranjas", "otras_verduras"] },
    { tipo: "fam", clave: "fruta", subs: ["vitamina_c", "bayas", "fruta_naranja", "otras_frutas"] },
    { tipo: "fam", clave: "frutos_secos", subs: ["nueces", "almendras", "otros_frutos_secos"] },
    { tipo: "fam", clave: "cereales", subs: ["pan", "avena", "pasta", "arroz", "otros_cereales"] },
    { tipo: "fam", clave: "tuberculos" },
    { tipo: "fam", clave: "lacteos", subs: ["leche_yogur", "queso_fresco", "queso_curado"] },
  ] },
];

/* Filas del mapa del año */
const FILAS_AÑO = [
  { tipo: "fam", clave: "legumbres" }, { tipo: "tot", clave: "pescado_total" }, { tipo: "fam", clave: "pescado_azul" },
  { tipo: "tot", clave: "carne_total" }, { tipo: "fam", clave: "carne_roja" }, { tipo: "fam", clave: "huevos" }, { tipo: "fam", clave: "procesados" },
  { tipo: "fam", clave: "verduras" }, { tipo: "sub", clave: "hoja_verde" }, { tipo: "sub", clave: "rojas" }, { tipo: "sub", clave: "cruciferas" }, { tipo: "sub", clave: "naranjas" },
  { tipo: "fam", clave: "fruta" }, { tipo: "sub", clave: "vitamina_c" }, { tipo: "fam", clave: "frutos_secos" },
];

const def = (f) => (f.tipo === "fam" ? FAM[f.clave] : f.tipo === "tot" ? TOT[f.clave] : SUB[f.clave]);
const valor = (f, conteo) => (f.tipo === "fam" ? conteo.fam[f.clave] : f.tipo === "tot" ? conteo.tot[f.clave] : conteo.sub[f.clave]) || 0;
const nombreFila = (f) => (f.tipo === "sub" ? "· " + SUB[f.clave].nombre : def(f).nombre);
const objetivoSemanal = (f) => { const o = def(f).objetivo; return o && o.periodo !== "mes" ? o : null; };

export default function Equilibrio({ registroLista }) {
  const [vista, setVista] = useState("semana");
  const porFecha = useMemo(() => indexaPorFecha(registroLista), [registroLista]);
  return (
    <div className="pila-g">
      <div className="fila entre">
        <div>
          <h2>Equilibrio</h2>
          <div className="nota">Lo que has apuntado frente a las frecuencias recomendadas (AESAN 2022). Son medias semanales: una semana rara no cambia nada.</div>
        </div>
        <div className="seg" role="tablist">
          <button className={vista === "semana" ? "on" : ""} onClick={() => setVista("semana")}>Semana</button>
          <button className={vista === "año" ? "on" : ""} onClick={() => setVista("año")}>Año</button>
        </div>
      </div>
      {vista === "semana" ? <VistaSemana porFecha={porFecha} /> : <VistaAño registroLista={registroLista} porFecha={porFecha} />}
    </div>
  );
}

/* ================= Semana ================= */
function VistaSemana({ porFecha }) {
  const hoy = hoyISO();
  const [lunes, setLunes] = useState(lunesDe(hoy));
  const [abiertas, setAbiertas] = useState({});
  const r = resumenSemana(porFecha, lunes);
  const enCurso = lunes === lunesDe(hoy);
  const mercurio = enCuatroSemanas(porFecha, lunes, "mercurio");

  return (
    <div className="pila-g">
      <div className="fila entre">
        <div className="dia-nav">
          <button className="btn icono" onClick={() => setLunes(sumaDias(lunes, -7))} aria-label="Semana anterior"><ChevronLeft size={20} /></button>
          <div>
            <div className="ojal">Semana {semanaISO(lunes).semana}</div>
            <div className="fecha">{rangoSemana(lunes)}</div>
          </div>
          <button className="btn icono" onClick={() => setLunes(sumaDias(lunes, 7))} aria-label="Semana siguiente"><ChevronRight size={20} /></button>
          {!enCurso && <button className="btn mini" onClick={() => setLunes(lunesDe(hoy))}>Esta semana</button>}
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="l">Comidas y cenas apuntadas</div><div className="v">{r.comidas}<span className="tenue" style={{ fontSize: 15 }}> / 14</span></div></div>
        <div className="kpi"><div className="l">Según el plan</div><div className="v">{r.segunPlan}</div></div>
        <div className="kpi"><div className="l">Fuera de casa</div><div className="v">{r.fuera}</div></div>
        <div className="kpi"><div className="l">Pez espada, atún rojo, cazón (4 semanas)</div><div className="v">{mercurio}<span className="tenue" style={{ fontSize: 15 }}> · ≤1 al mes</span></div></div>
      </div>

      {enCurso && <div className="banner">Semana en curso: lo que falta aún puede llegar. Mira sobre todo lo que ya se ha pasado.</div>}
      {!enCurso && !semanaValida(r) && <div className="banner ambar">Semana con pocos datos ({r.comidas} de 14 comidas apuntadas): las cifras se quedan cortas.</div>}

      <div className="rejilla-2">
        {BLOQUES.map((b) => (
          <div key={b.titulo} className="tarjeta">
            <h3 style={{ marginBottom: 4 }}>{b.titulo}</h3>
            {b.filas.map((f) => {
              const d = def(f), n = valor(f, r.conteo), o = d.objetivo;
              const abierta = abiertas[f.clave];
              return (
                <React.Fragment key={f.clave}>
                  <FilaObjetivo nombre={<span>{d.nombre}{d.orientativa && <span className="tenue" style={{ fontWeight: 400 }}> · orientativo</span>}</span>}
                    n={n} objetivo={o} texto={d.texto} estado={enCurso && estadoDe(n, o) === "falta" ? null : estadoDe(n, o)}
                    extra={f.subs && <button className="btn icono" style={{ padding: 2 }} onClick={() => setAbiertas((x) => ({ ...x, [f.clave]: !abierta }))} aria-label={abierta ? "Ocultar variedad" : "Ver variedad"} aria-expanded={!!abierta}>{abierta ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>} />
                  {abierta && f.subs.map((k) => {
                    const s = SUB[k];
                    const nn = k === "mercurio" ? mercurio : r.conteo.sub[k] || 0;
                    const oo = s.objetivo;
                    return <FilaObjetivo key={k} sub nombre={s.nombre} n={nn} objetivo={oo} texto={s.texto} estado={estadoDe(nn, oo)} />;
                  })}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Año ================= */
function VistaAño({ registroLista, porFecha }) {
  const hoy = hoyISO();
  const añoActual = semanaISO(hoy).año;
  const años = useMemo(() => {
    const s = new Set([añoActual]);
    for (const r of registroLista) s.add(semanaISO(r.fecha).año);
    return [...s].sort((a, b) => b - a);
  }, [registroLista, añoActual]);
  const [año, setAño] = useState(añoActual);
  const [fila, setFila] = useState(FILAS_AÑO[0]);
  const [info, setInfo] = useState(null);
  const semanas = useMemo(() => resumenAño(registroLista, año), [registroLista, año]);
  const lunesHoy = lunesDe(hoy);
  const mapa = useRef(null);
  // en pantallas estrechas, que se vean las semanas recientes
  useEffect(() => {
    const m = mapa.current;
    if (!m || m.scrollWidth <= m.clientWidth) return;
    const i = semanas.findIndex((x) => x.lunes === lunesHoy);
    const celda = i >= 0 ? m.querySelector("tbody tr")?.children[i + 1] : null;
    m.scrollLeft = celda ? Math.max(0, celda.offsetLeft + celda.offsetWidth + 60 - m.clientWidth) : m.scrollWidth;
  }, [año]);

  const pasadas = semanas.filter((s) => s.lunes <= lunesHoy);
  const validas = semanas.filter((s) => semanaValida(s) && s.lunes < lunesHoy);
  const totalComidas = pasadas.reduce((n, s) => n + s.comidas, 0);
  const segunPlan = pasadas.reduce((n, s) => n + s.segunPlan, 0);
  const recetasDistintas = new Set(registroLista.filter((r) => semanaISO(r.fecha).año === año).flatMap((r) => [r.receta_id, r.guarnicion_id]).filter(Boolean)).size;

  const estadoCelda = (f, s) => {
    if (s.lunes > lunesHoy) return "futuro";
    if (!semanaValida(s)) return "pocos";
    if (s.lunes === lunesHoy) return "pocos";
    return estadoDe(valor(f, s.conteo), objetivoSemanal(f)) || "pocos";
  };

  const resumenFila = (f) => {
    const o = objetivoSemanal(f);
    const vals = validas.map((s) => valor(f, s.conteo));
    const media = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const est = validas.map((s) => estadoDe(valor(f, s.conteo), o));
    return { media, ok: est.filter((e) => e === "ok").length, falta: est.filter((e) => e === "falta").length, alto: est.filter((e) => e === "alto").length, n: vals.length, o };
  };

  // cabecera de meses: la primera semana cuyo jueves cae en cada mes
  const meses = semanas.map((s, i) => { const m = Number(sumaDias(s.lunes, 3).slice(5, 7)) - 1; const prev = i ? Number(sumaDias(semanas[i - 1].lunes, 3).slice(5, 7)) - 1 : -1; return m !== prev ? nombreMes(m, true) : ""; });

  return (
    <div className="pila-g">
      <div className="fila entre">
        <div className="fila">
          <label className="etq" htmlFor="eq-año" style={{ margin: 0 }}>Año</label>
          <select id="eq-año" className="campo" style={{ width: "auto" }} value={año} onChange={(e) => setAño(Number(e.target.value))}>
            {años.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="l">Semanas con datos suficientes</div><div className="v">{validas.length}<span className="tenue" style={{ fontSize: 15 }}> / {pasadas.filter((s) => s.lunes < lunesHoy).length}</span></div></div>
        <div className="kpi"><div className="l">Comidas y cenas apuntadas</div><div className="v">{totalComidas}</div></div>
        <div className="kpi"><div className="l">Según el plan</div><div className="v">{totalComidas ? Math.round((segunPlan / totalComidas) * 100) : 0} %</div></div>
        <div className="kpi"><div className="l">Recetas distintas</div><div className="v">{recetasDistintas}</div></div>
      </div>

      <div className="tarjeta pila">
        <div className="fila entre">
          <h3>Semana a semana</h3>
          <div className="leyenda" aria-label="Leyenda">
            {["ok", "falta", "alto"].map((e) => <span key={e}><i style={{ background: `var(--${e})` }} />{ESTADOS[e].icono} {ESTADOS[e].nombre}</span>)}
            <span><i style={{ background: "repeating-linear-gradient(45deg,#E9E6DD 0 3px,#F5F3EC 3px 6px)" }} />Pocos datos o en curso</span>
          </div>
        </div>
        <div className="mapa" ref={mapa}>
          <table>
            <thead>
              <tr>
                <th />
                {meses.map((m, i) => <th key={i} className="mes"><span>{m}</span></th>)}
                <th style={{ paddingLeft: 8, fontWeight: 600 }}>en objetivo</th>
              </tr>
            </thead>
            <tbody>
              {FILAS_AÑO.map((f) => {
                const res = resumenFila(f);
                return (
                  <tr key={f.clave} className={"fam" + (fila.clave === f.clave ? " activa" : "")} onClick={() => setFila(f)}>
                    <th scope="row">{nombreFila(f)}</th>
                    {semanas.map((s) => {
                      const e = estadoCelda(f, s);
                      return (
                        <td key={s.lunes} className={"celda " + e}
                          onMouseEnter={(ev) => setInfo({ x: ev.clientX, y: ev.clientY, f, s, e })}
                          onMouseMove={(ev) => setInfo((i) => i && { ...i, x: ev.clientX, y: ev.clientY })}
                          onMouseLeave={() => setInfo(null)} />
                      );
                    })}
                    <td className="pct">{res.n ? `${Math.round((res.ok / res.n) * 100)} %` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="nota">Una semana cuenta cuando tiene al menos 7 de sus 14 comidas y cenas apuntadas. Toca una fila para ver su evolución.</div>
      </div>

      <GraficoFila fila={fila} semanas={semanas} lunesHoy={lunesHoy} />

      <div className="tarjeta">
        <h3 style={{ marginBottom: 8 }}>Resumen del año</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="tabla">
            <thead>
              <tr><th>Grupo</th><th className="n">Media por semana</th><th>Objetivo</th><th className="n">En objetivo</th><th className="n">Por debajo</th><th className="n">Por encima</th></tr>
            </thead>
            <tbody>
              {FILAS_AÑO.map((f) => {
                const res = resumenFila(f);
                return (
                  <tr key={f.clave}>
                    <td>{nombreFila(f)}</td>
                    <td className="n">{res.n ? res.media.toFixed(1) : "—"}</td>
                    <td className="lapiz">{textoObjetivo(res.o)}</td>
                    <td className="n">{res.n ? `${res.ok} sem.` : "—"}</td>
                    <td className="n">{res.n ? `${res.falta} sem.` : "—"}</td>
                    <td className="n">{res.n ? `${res.alto} sem.` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!validas.length && <div className="nota" style={{ marginTop: 8 }}>Aún no hay semanas completas este año. Apunta lo que comes en «Hoy» y esto se irá llenando.</div>}
      </div>

      {info && (
        <div className="info-flotante" style={{ left: Math.min(info.x + 12, window.innerWidth - 250), top: info.y + 14 }}>
          <b>Semana {semanaISO(info.s.lunes).semana}</b> · {rangoSemana(info.s.lunes)}<br />
          {nombreFila(info.f).replace("· ", "")}: <b>{valor(info.f, info.s.conteo)}</b>{objetivoSemanal(info.f) ? ` (${textoObjetivo(objetivoSemanal(info.f))})` : ""}<br />
          {info.e === "futuro" ? "Aún no ha llegado" : info.e === "pocos" ? `Pocos datos o en curso · ${info.s.comidas}/14 comidas` : `${ESTADOS[info.e].icono} ${ESTADOS[info.e].nombre} · ${info.s.comidas}/14 comidas`}
        </div>
      )}
    </div>
  );
}

/* Barras semanales + media de 4 semanas, con la banda del objetivo */
function GraficoFila({ fila, semanas, lunesHoy }) {
  const o = objetivoSemanal(fila);
  const datos = useMemo(() => {
    const out = [];
    const ultimas = [];
    for (const s of semanas) {
      if (s.lunes > lunesHoy) break;
      const valida = semanaValida(s) && s.lunes < lunesHoy;
      const n = valida ? valor(fila, s.conteo) : null;
      if (valida) { ultimas.push(n); if (ultimas.length > 4) ultimas.shift(); }
      out.push({ etiqueta: fechaCorta(s.lunes), semana: semanaISO(s.lunes).semana, n, media: valida && ultimas.length ? ultimas.reduce((a, b) => a + b, 0) / ultimas.length : null });
    }
    return out;
  }, [fila, semanas, lunesHoy]);
  const hayDatos = datos.some((d) => d.n != null);
  const techo = Math.max(1, ...datos.map((d) => d.n || 0), o?.max || 0, o?.min || 0);
  const paso = techo > 12 ? 5 : techo > 6 ? 2 : 1;
  const arriba = Math.ceil((techo + 0.5) / paso) * paso;
  const marcas = Array.from({ length: arriba / paso + 1 }, (_, i) => i * paso);

  return (
    <div className="tarjeta pila">
      <div className="fila entre">
        <h3>{nombreFila(fila).replace("· ", "")} por semana</h3>
        <div className="leyenda">
          <span><i style={{ background: "var(--serie1)", borderRadius: 2 }} />Raciones de la semana</span>
          <span><i style={{ background: "var(--serie2)", height: 2, width: 16, borderRadius: 1 }} />Media de 4 semanas</span>
          {o && <span><i style={{ background: "rgba(12,163,12,.16)", border: "1px solid rgba(12,163,12,.55)" }} />Objetivo {textoObjetivo(o)}</span>}
        </div>
      </div>
      {!hayDatos ? <div className="nota">Sin semanas completas todavía.</div> : (
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <ComposedChart data={datos} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: "#898781" }} tickLine={false} axisLine={{ stroke: "#c3c2b7" }} interval="preserveStartEnd" minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#898781" }} tickLine={false} axisLine={false} domain={[0, arriba]} ticks={marcas} />
              {o && <ReferenceArea y1={o.min ?? 0} y2={o.max ?? arriba} fill="rgba(12,163,12,.10)" stroke="rgba(12,163,12,.45)" strokeDasharray="0" ifOverflow="extendDomain" />}
              <Tooltip cursor={{ fill: "rgba(29,42,34,.05)" }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="info-flotante" style={{ position: "static" }}>
                    <b>Semana {d.semana}</b> · desde el {d.etiqueta}<br />
                    {d.n == null ? "Pocos datos" : <>Raciones: <b>{d.n}</b>{d.media != null && <> · media 4 sem.: {d.media.toFixed(1)}</>}</>}
                  </div>
                );
              }} />
              <Bar dataKey="n" fill="#2a78d6" maxBarSize={14} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Line dataKey="media" stroke="#eb6834" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
