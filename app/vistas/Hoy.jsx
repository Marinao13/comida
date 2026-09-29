import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Pencil, Undo2, CalendarPlus, Search, X, Plus, Store, Ban } from "lucide-react";
import { MOMENTOS, SUB, FAM, GRUPO } from "../../src/catalogo.mjs";
import { ponRegistro, quitarRegistro, avisar, leerDatos } from "../datos.js";
import { claveHueco, componentesHueco } from "../planificador.js";
import { contar, estado as estadoDe, indexaPorFecha, resumenDias, normaliza } from "../nutricion.js";
import { hoyISO, sumaDias, fechaLarga, lunesDe, diasDe, mayuscula } from "../fechas.js";
import { Hoja, Pastilla, Componentes, SelectorComponentes, FilaObjetivo } from "../ui.jsx";

const RAPIDOS = [
  ["Fruta", ["vitamina_c", "bayas", "fruta_naranja", "otras_frutas"]],
  ["Frutos secos", ["nueces", "almendras", "otros_frutos_secos"]],
  ["Lácteos", ["leche_yogur", "queso_fresco", "queso_curado"]],
  ["Verdura", ["hoja_verde", "rojas", "cruciferas", "naranjas", "otras_verduras"]],
  ["Otros", ["pan", "procesada"]],
];

const ORIGEN_TXT = { plan: "Según el plan", receta: "Otra receta", libre: "Otra cosa", fuera: "Fuera de casa", nada: "Me la salté" };

export default function Hoy({ datos, recetasLista, abrirReceta, fecha, setFecha, verSemana }) {
  const [editor, setEditor] = useState(null);   // { momento, inicial }
  const hoy = hoyISO();
  const activas = useMemo(() => recetasLista.filter((r) => !r.borrado_en), [recetasLista]);
  const porId = datos.recetas;
  const otros = datos.registro[claveHueco(fecha, "otros")];

  const registroLista = useMemo(() => Object.values(datos.registro), [datos.registro]);
  const porFecha = useMemo(() => indexaPorFecha(registroLista), [registroLista]);
  const delDia = resumenDias(porFecha, [fecha]).conteo;
  const lunes = lunesDe(fecha);
  const diasSemana = diasDe(lunes).filter((d) => d <= fecha);
  const semanaHasta = resumenDias(porFecha, diasSemana);

  const loComi = (m, h) => {
    const componentes = componentesHueco(h, porId);
    if (!h.receta_id && !componentes.length) { setEditor({ momento: m, inicial: { origen: "plan" } }); return; }
    ponRegistro({ fecha, momento: m, origen: "plan", receta_id: h.receta_id || null, guarnicion_id: h.guarnicion_id || null, componentes });
  };

  const otrosAhora = () => leerDatos().registro[claveHueco(fecha, "otros")];
  const sumaOtro = (k) => ponRegistro({ ...otrosAhora(), fecha, momento: "otros", origen: "libre", componentes: [...(otrosAhora()?.componentes || []), k] });
  const quitaOtro = (k) => {
    const actual = otrosAhora();
    const lista = [...(actual?.componentes || [])];
    const i = lista.lastIndexOf(k);
    if (i < 0) return;
    lista.splice(i, 1);
    if (lista.length) ponRegistro({ ...actual, componentes: lista }); else quitarRegistro(fecha, "otros");
  };

  return (
    <div className="pila-g">
      <div className="fila entre">
        <div className="dia-nav">
          <button className="btn icono" onClick={() => setFecha(sumaDias(fecha, -1))} aria-label="Día anterior"><ChevronLeft size={20} /></button>
          <div className="fecha">{fecha === hoy ? `Hoy, ${fechaLarga(fecha)}` : mayuscula(fechaLarga(fecha))}</div>
          <button className="btn icono" onClick={() => setFecha(sumaDias(fecha, 1))} aria-label="Día siguiente"><ChevronRight size={20} /></button>
          {fecha !== hoy && <button className="btn mini" onClick={() => setFecha(hoy)}>Hoy</button>}
        </div>
        <input type="date" className="campo" style={{ width: "auto" }} value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} aria-label="Ir a una fecha" />
      </div>

      <div className="pila">
        {MOMENTOS.map((m) => {
          const h = datos.huecos[claveHueco(fecha, m.clave)];
          const r = datos.registro[claveHueco(fecha, m.clave)];
          return (
            <div key={m.clave} className="tarjeta comida-card">
              <div className="momento">{m.nombre}</div>
              <div className="pila" style={{ minWidth: 0 }}>
                {h ? (
                  <div>
                    <div className="fila" style={{ gap: 6, marginBottom: 3 }}>
                      <Pastilla grupo={h.grupo} />
                      {h.subfamilia && !h.receta_id && <span className="nota">{SUB[h.subfamilia]?.nombre}</span>}
                    </div>
                    {h.receta_id ? <div className="plato">{porId[h.receta_id]?.nombre || "(receta borrada)"}</div>
                      : h.grupo !== "fuera" && <div className="nota">Sin receta elegida</div>}
                    {h.guarnicion_id && <div className="guarn">+ {porId[h.guarnicion_id]?.nombre || "(receta borrada)"}</div>}
                  </div>
                ) : (
                  <div className="fila">
                    <span className="nota">Sin plan para este momento.</span>
                    {m.clave !== "desayuno" && <button className="btn mini fantasma" onClick={() => verSemana(fecha)}><CalendarPlus size={14} /> Planificar la semana</button>}
                  </div>
                )}

                {r ? (
                  <div className={"hecho" + (r.origen === "plan" ? "" : r.origen === "nada" ? " nada" : " otra")}>
                    {r.origen === "plan" ? <Check size={16} color="var(--ok)" /> : r.origen === "nada" ? <Ban size={15} /> : r.origen === "fuera" ? <Store size={15} /> : <Pencil size={14} />}
                    <b>{ORIGEN_TXT[r.origen]}</b>
                    {r.origen !== "plan" && (r.receta_id || r.descripcion) && (
                      <span>· {r.receta_id ? porId[r.receta_id]?.nombre : r.descripcion}{r.guarnicion_id ? ` + ${porId[r.guarnicion_id]?.nombre}` : ""}</span>
                    )}
                    <span className="crece" />
                    <button className="btn mini fantasma" onClick={() => setEditor({ momento: m.clave, inicial: r })}><Pencil size={13} /> Cambiar</button>
                    <button className="btn mini fantasma" onClick={() => quitarRegistro(fecha, m.clave)} aria-label="Deshacer"><Undo2 size={13} /></button>
                    {r.origen !== "nada" && <div style={{ flexBasis: "100%" }}><Componentes lista={r.componentes} /></div>}
                  </div>
                ) : (
                  <div className="fila">
                    {h && h.grupo !== "fuera" && <button className="btn verde" onClick={() => loComi(m.clave, h)}><Check size={16} /> Lo comí</button>}
                    <button className="btn" onClick={() => setEditor({ momento: m.clave, inicial: { origen: "receta" } })}>Otra cosa</button>
                    <button className="btn" onClick={() => setEditor({ momento: m.clave, inicial: { origen: "fuera" } })}><Store size={15} /> Fuera</button>
                    <button className="btn fantasma" onClick={() => ponRegistro({ fecha, momento: m.clave, origen: "nada", componentes: [] })}>Me la salté</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="tarjeta comida-card">
          <div className="momento">Entre horas y postres</div>
          <div className="pila">
            {otros?.componentes?.length > 0 && (
              <div className="chips">
                {Object.entries(otros.componentes.reduce((n, k) => ({ ...n, [k]: (n[k] || 0) + 1 }), {})).map(([k, n]) => (
                  <span key={k} className="chip suave">{SUB[k]?.nombre}{n > 1 && <span className="n">×{n}</span>}
                    <span className="x" role="button" tabIndex={0} aria-label={"Quitar " + SUB[k]?.nombre} onClick={() => quitaOtro(k)} onKeyDown={(e) => e.key === "Enter" && quitaOtro(k)}><X size={13} /></span>
                  </span>
                ))}
              </div>
            )}
            <div className="rapidos">
              {RAPIDOS.map(([nombre, claves]) => (
                <React.Fragment key={nombre}>
                  <div className="nota" style={{ fontWeight: 650 }}>{nombre}</div>
                  <div className="chips">
                    {claves.map((k) => <button key={k} className="chip" onClick={() => sumaOtro(k)}><Plus size={12} /> {SUB[k].nombre}</button>)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="nota">Cada toque es una ración: la fruta del postre, un puñado de nueces, un yogur…</div>
          </div>
        </div>
      </div>

      <div className="rejilla-2">
        <div className="tarjeta">
          <h3 style={{ marginBottom: 6 }}>{fecha === hoy ? "Hoy llevas" : "Ese día"}</h3>
          {["verduras", "fruta", "lacteos", "cereales"].map((k) => {
            const f = FAM[k], n = delDia.fam[k] || 0;
            return <FilaObjetivo key={k} nombre={f.nombre} n={n} objetivo={f.dia} dia estado={estadoDe(n, f.dia)} texto={f.texto.split(" (")[0]} />;
          })}
          <div className="nota" style={{ marginTop: 6 }}>Cereales y lácteos son orientativos: apúntalos solo si te sirve.</div>
        </div>
        <div className="tarjeta">
          <h3 style={{ marginBottom: 6 }}>Esta semana, hasta {fecha === hoy ? "hoy" : "ese día"}</h3>
          <div className="nota" style={{ marginBottom: 8 }}>{semanaHasta.comidas} de {diasSemana.length * 2} comidas y cenas apuntadas · {semanaHasta.segunPlan} según el plan</div>
          {[
            ["Legumbres", semanaHasta.conteo.fam.legumbres, FAM.legumbres.objetivo],
            ["Pescado", semanaHasta.conteo.tot.pescado_total, { min: 3 }],
            ["Carne", semanaHasta.conteo.tot.carne_total, { max: 3 }],
            ["Verdura", semanaHasta.conteo.fam.verduras, FAM.verduras.objetivo],
            ["Fruta", semanaHasta.conteo.fam.fruta, FAM.fruta.objetivo],
            ["Frutos secos", semanaHasta.conteo.fam.frutos_secos, FAM.frutos_secos.objetivo],
          ].map(([nombre, n = 0, o]) => {
            // a mitad de semana solo avisamos de lo que ya se ha pasado del máximo
            const e = o.max != null && n > o.max ? "alto" : o.min != null && n >= o.min ? "ok" : null;
            return <FilaObjetivo key={nombre} nombre={nombre} n={n || 0} objetivo={o} estado={e} />;
          })}
        </div>
      </div>

      {editor && (
        <RegistroEditor fecha={fecha} momento={editor.momento} inicial={editor.inicial} hueco={datos.huecos[claveHueco(fecha, editor.momento)]}
          recetas={activas} porId={porId} abrirReceta={abrirReceta} onCerrar={() => setEditor(null)} />
      )}
    </div>
  );
}

/* ================= ¿Qué comiste? ================= */
function RegistroEditor({ fecha, momento, inicial, hueco, recetas, porId, abrirReceta, onCerrar }) {
  const esDesayuno = momento === "desayuno";
  const deHueco = inicial.origen === "plan" && !inicial.componentes;
  const [b, setB] = useState(() => {
    const base = { origen: "receta", receta_id: null, guarnicion_id: null, descripcion: "", componentes: [], nota: "", ...inicial };
    if (deHueco && hueco) Object.assign(base, { receta_id: hueco.receta_id || null, guarnicion_id: hueco.guarnicion_id || null, componentes: componentesHueco(hueco, porId) });
    return base;
  });
  const [compTocados, setCompTocados] = useState(false);   // solo cuenta lo tocado en esta edición
  const [busca, setBusca] = useState("");
  const pestana = b.origen === "plan" || b.origen === "receta" ? "receta" : b.origen;

  const recalcula = (x) => (compTocados ? x.componentes : [...(porId[x.receta_id]?.componentes || []), ...(porId[x.guarnicion_id]?.componentes || [])]);
  const origenReceta = (x) => (hueco && x.receta_id && x.receta_id === hueco.receta_id && (x.guarnicion_id || null) === (hueco.guarnicion_id || null) ? "plan" : "receta");
  const elige = (campo, id) => setB((x) => { const n = { ...x, [campo]: id }; n.componentes = recalcula(n); n.origen = origenReceta(n); return n; });
  const cambiaPestana = (p) => setB((x) => ({ ...x, origen: p === "receta" ? origenReceta(x) : p }));

  const q = normaliza(busca.trim());
  const principales = recetas
    .filter((r) => r.grupo !== "verdura" || !esDesayuno)
    .filter((r) => !q || normaliza(r.nombre).includes(q))
    .sort((a, c) => {
      const pa = (esDesayuno ? a.grupo === "desayuno" : a.grupo === hueco?.grupo) ? 0 : 1;
      const pc = (esDesayuno ? c.grupo === "desayuno" : c.grupo === hueco?.grupo) ? 0 : 1;
      return pa - pc || a.nombre.localeCompare(c.nombre, "es");
    });
  const verduras = recetas.filter((r) => r.grupo === "verdura").sort((a, c) => a.nombre.localeCompare(c.nombre, "es"));

  const guardar = () => {
    if (b.origen === "receta" && !b.receta_id) { avisar("Elige una receta o apúntalo como «Otra cosa»", "error"); return; }
    if ((b.origen === "libre" || b.origen === "fuera") && !b.descripcion.trim() && !b.componentes.length) { avisar("Describe qué comiste o marca qué llevaba", "error"); return; }
    const fila = { fecha, momento, origen: b.origen, nota: b.nota, componentes: b.origen === "nada" ? [] : b.componentes,
      receta_id: pestana === "receta" ? b.receta_id : null, guarnicion_id: pestana === "receta" ? b.guarnicion_id : null,
      descripcion: pestana === "receta" ? "" : b.descripcion.trim() };
    ponRegistro(fila);
    onCerrar();
  };

  return (
    <Hoja titulo={`¿Qué has comido? · ${MOMENTOS.find((m) => m.clave === momento).nombre}`} subtitulo={mayuscula(fechaLarga(fecha))} onCerrar={onCerrar} ancha
      pie={<><button className="btn" onClick={onCerrar}>Cancelar</button><button className="btn verde" onClick={guardar}>Guardar</button></>}>
      <div className="pila-g">
        <div className="seg" role="tablist">
          {[["receta", "Una receta"], ["libre", "Otra cosa"], ["fuera", "Fuera de casa"], ["nada", "Me la salté"]].map(([k, t]) => (
            <button key={k} className={pestana === k ? "on" : ""} onClick={() => cambiaPestana(k)} role="tab" aria-selected={pestana === k}>{t}</button>
          ))}
        </div>

        {pestana === "receta" && (
          <div className="pila">
            {hueco?.receta_id && (
              <div className="nota">Planeado: <b>{porId[hueco.receta_id]?.nombre}</b>{hueco.guarnicion_id ? ` + ${porId[hueco.guarnicion_id]?.nombre}` : ""}
                {b.origen !== "plan" && <button className="btn mini fantasma" onClick={() => setB((x) => { const n = { ...x, receta_id: hueco.receta_id, guarnicion_id: hueco.guarnicion_id || null }; n.componentes = recalcula(n); n.origen = "plan"; return n; })}>Usar lo planeado</button>}
              </div>
            )}
            <div className="fila entre">
              <span className="etq" style={{ margin: 0 }}>Plato</span>
              <button className="btn mini fantasma" onClick={() => abrirReceta({ grupo: esDesayuno ? "desayuno" : hueco?.grupo && !["libre", "fuera"].includes(hueco.grupo) ? hueco.grupo : undefined }, { alGuardar: (r) => elige("receta_id", r.id) })}><Plus size={14} /> Nueva receta</button>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: 11, color: "var(--tenue)" }} />
              <input className="campo" style={{ paddingLeft: 32 }} placeholder="Buscar receta" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="lista-sel">
              {principales.length === 0 && <div className="nota" style={{ padding: 10 }}>Sin recetas. Usa «Otra cosa» o crea una.</div>}
              {principales.map((r) => <button key={r.id} className={r.id === b.receta_id ? "on" : ""} onClick={() => elige("receta_id", r.id)}><span className="crece">{r.nombre}</span><Pastilla grupo={r.grupo} corto /></button>)}
            </div>
            {!esDesayuno && verduras.length > 0 && (
              <div>
                <label className="etq" htmlFor="reg-guarn">Acompañamiento</label>
                <select id="reg-guarn" className="campo" value={b.guarnicion_id || ""} onChange={(e) => elige("guarnicion_id", e.target.value || null)}>
                  <option value="">Sin acompañamiento</option>
                  {verduras.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {(pestana === "libre" || pestana === "fuera") && (
          <div>
            <label className="etq" htmlFor="reg-desc">{pestana === "fuera" ? "Dónde o qué" : "Qué comiste"}</label>
            <input id="reg-desc" className="campo" value={b.descripcion} onChange={(e) => setB((x) => ({ ...x, descripcion: e.target.value }))}
              placeholder={pestana === "fuera" ? "Menú del día: ensalada y merluza" : "Sobras de arroz con verduras"} />
          </div>
        )}

        {pestana !== "nada" && (
          <div className="tarjeta plana">
            <div className="ojal" style={{ marginBottom: 8 }}>Qué llevaba (una ración de cada)</div>
            <SelectorComponentes valor={b.componentes} onCambio={(f) => { setCompTocados(true); setB((x) => ({ ...x, componentes: f(x.componentes) })); }}
              inicial={pestana === "receta" ? "verduras" : "legumbres"} />
            <div className="nota" style={{ marginTop: 8 }}>Ajusta si cambiaste algo: otra fruta, ensalada de más, sin pan…</div>
          </div>
        )}

        <div>
          <label className="etq" htmlFor="reg-nota">Nota (opcional)</label>
          <input id="reg-nota" className="campo" value={b.nota} onChange={(e) => setB((x) => ({ ...x, nota: e.target.value }))} placeholder="Ración grande, sin hambre…" />
        </div>
      </div>
    </Hoja>
  );
}
