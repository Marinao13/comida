import React, { useMemo, useState } from "react";
import { Plus, Search, Star, Clock, Users, Pencil, Trash2, ExternalLink, Copy, Lightbulb, BookOpen } from "lucide-react";
import { TIPOS_RECETA, TIPO_RECETA, GRUPO, GRUPOS, GRUPO_DESAYUNO, MOMENTOS, SUB } from "../../src/catalogo.mjs";
import { guardarReceta, borrarReceta, avisar } from "../datos.js";
import { componentesPropuestos, detectar, grupoSugerido, subfamiliaPrincipal, normaliza } from "../nutricion.js";
import { hoyISO, diasEntre, haceDias } from "../fechas.js";
import { Hoja, Pastilla, Componentes, SelectorComponentes, Vacio, Interruptor } from "../ui.jsx";

const ideasDe = (tipo) => (tipo === "desayuno" ? GRUPO_DESAYUNO.ideas : GRUPO[tipo]?.ideas || []);

export default function Recetas({ recetasLista, usos, abrirReceta }) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todas");
  const [orden, setOrden] = useState("nombre");

  const activas = useMemo(() => recetasLista.filter((r) => !r.borrado_en), [recetasLista]);
  const porTipo = useMemo(() => { const n = {}; for (const r of activas) n[r.grupo] = (n[r.grupo] || 0) + 1; return n; }, [activas]);
  const hoy = hoyISO();

  const lista = useMemo(() => {
    const q = normaliza(busca.trim());
    let l = activas.filter((r) => (tipo === "todas" || r.grupo === tipo) &&
      (!q || normaliza(r.nombre + " " + r.ingredientes + " " + (r.etiquetas || []).join(" ")).includes(q)));
    const ultima = (r) => usos.get(r.id)?.ultima || "";
    if (orden === "nombre") l.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    if (orden === "olvidadas") l.sort((a, b) => ultima(a).localeCompare(ultima(b)) || a.nombre.localeCompare(b.nombre, "es"));
    if (orden === "hechas") l.sort((a, b) => (usos.get(b.id)?.veces || 0) - (usos.get(a.id)?.veces || 0) || a.nombre.localeCompare(b.nombre, "es"));
    return l;
  }, [activas, busca, tipo, orden, usos]);

  const sinPrincipales = !activas.some((r) => r.grupo !== "desayuno");
  const nombres = new Set(activas.map((r) => normaliza(r.nombre)));
  const ideas = tipo !== "todas" ? ideasDe(tipo).filter((i) => !nombres.has(normaliza(i))) : [];

  return (
    <div className="pila-g">
      <div className="fila entre">
        <div>
          <h2>Recetas</h2>
          <div className="nota">{activas.length} guardadas. Cada una dice qué raciones aporta; con eso se sugieren para cada hueco y se cuenta lo que comes.</div>
        </div>
        <button className="btn verde" onClick={() => abrirReceta({ grupo: tipo !== "todas" ? tipo : undefined })}><Plus size={16} /> Nueva receta</button>
      </div>

      {sinPrincipales && (
        <div className="tarjeta pila">
          <div className="fila"><Lightbulb size={18} color="var(--hoja)" /><h3>Por dónde empezar</h3></div>
          <div className="nota">
            Cada semana hay 14 comidas y cenas repartidas por grupos (4 legumbres, 4 pescados, 3 carnes, 2 huevos y 1 libre).
            Con 2–3 recetas por grupo la app ya puede rellenarte la semana y rotarlas. Toca una idea para empezar una receta con ese nombre.
          </div>
          {GRUPOS.map((g) => (
            <div key={g.clave} className="fila" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 150, flex: "none", paddingTop: 3 }}><Pastilla grupo={g.clave} /></div>
              <div className="ideas crece">
                {g.ideas.slice(0, 6).map((i) => <button key={i} className="chip" onClick={() => abrirReceta({ nombre: i, grupo: g.clave })}><Plus size={12} /> {i}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pila">
        <div className="fila">
          <div className="crece" style={{ position: "relative", minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", left: 11, top: 12, color: "var(--tenue)" }} />
            <input className="campo" style={{ paddingLeft: 34 }} placeholder="Buscar por nombre, ingrediente o etiqueta" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <select className="campo" style={{ width: "auto" }} value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar">
            <option value="nombre">Por nombre</option>
            <option value="olvidadas">Las que hace más que no haces</option>
            <option value="hechas">Las que más haces</option>
          </select>
        </div>
        <div className="chips" role="tablist" aria-label="Tipo de receta">
          <button className={"chip" + (tipo === "todas" ? " on" : "")} onClick={() => setTipo("todas")}>Todas <span className="n">{activas.length}</span></button>
          {TIPOS_RECETA.map((t) => {
            const n = porTipo[t.clave] || 0;
            const falta = !n && GRUPO[t.clave]?.porDefecto;
            return (
              <button key={t.clave} className={"chip" + (tipo === t.clave ? " on" : "")} onClick={() => setTipo(t.clave)}
                title={falta ? "Aún no tienes recetas de este grupo" : undefined} style={falta && tipo !== t.clave ? { borderStyle: "dashed", color: "var(--lapiz)" } : undefined}>
                <span className="pastilla" style={{ padding: 0, background: "none", color: tipo === t.clave ? "#fff" : t.color }}><span className="bola" style={{ background: t.color }} /></span>
                {t.corto || t.nombre} <span className="n">{n}</span>
              </button>
            );
          })}
        </div>
        {ideas.length > 0 && (
          <div className="fila" style={{ alignItems: "flex-start" }}>
            <span className="nota" style={{ paddingTop: 4 }}>Ideas:</span>
            <div className="ideas crece">
              {ideas.map((i) => <button key={i} className="chip" onClick={() => abrirReceta({ nombre: i, grupo: tipo })}><Plus size={12} /> {i}</button>)}
            </div>
          </div>
        )}
      </div>

      {lista.length === 0 ? (
        <Vacio icono={<BookOpen size={28} />} titulo={busca ? "Nada con esa búsqueda" : "Sin recetas de este tipo"}>
          {busca ? "Prueba con otra palabra." : "Crea la primera con «Nueva receta» o desde una de las ideas."}
        </Vacio>
      ) : (
        <div className="rejilla-auto">
          {lista.map((r) => {
            const u = usos.get(r.id);
            const t = TIPO_RECETA[r.grupo];
            return (
              <button key={r.id} className="receta-card" style={{ borderLeftColor: t?.color }} onClick={() => abrirReceta(r)}>
                <div className="fila entre" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                  <span className="nom">{r.nombre}</span>
                  {r.favorita && <Star size={15} fill="#E0A800" color="#E0A800" style={{ flex: "none" }} aria-label="favorita" />}
                </div>
                <Componentes lista={(r.componentes || []).filter((k) => !SUB[k]?.base)} />
                <div className="meta fila" style={{ gap: 10 }}>
                  <Pastilla grupo={r.grupo} corto />
                  {r.minutos && <span className="fila" style={{ gap: 3 }}><Clock size={12} />{r.minutos} min</span>}
                  <span>{u?.veces ? `${u.veces} ${u.veces === 1 ? "vez" : "veces"} · ${haceDias(diasEntre(u.ultima, hoy))}` : "aún sin hacer"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================= Hoja de receta: ver y editar ================= */
export function RecetaHoja({ inicial, editarInicial, alGuardar, onCerrar, usos, datos }) {
  const [receta, setReceta] = useState(inicial);
  const [editar, setEditar] = useState(editarInicial);
  if (editar) {
    return <RecetaEditor inicial={receta} onCerrar={() => (receta?.id ? setEditar(false) : onCerrar())}
      onGuardada={(r) => { alGuardar?.(r); if (alGuardar) onCerrar(); else { setReceta(r); setEditar(false); } }} />;
  }
  const r = datos.recetas[receta.id] || receta;
  const u = usos.get(r.id);
  const hoy = hoyISO();
  const duplicar = () => { const { id, ...resto } = r; setReceta({ ...resto, nombre: r.nombre + " (copia)" }); setEditar(true); };
  return (
    <Hoja titulo={r.nombre} subtitulo={<span className="fila" style={{ gap: 8, marginTop: 4 }}><Pastilla grupo={r.grupo} />{r.favorita && <span className="fila" style={{ gap: 4 }}><Star size={13} fill="#E0A800" color="#E0A800" /> favorita</span>}</span>}
      onCerrar={onCerrar} ancha
      pie={<>
        <button className="btn peligro" onClick={() => { if (confirm(`¿Borrar «${r.nombre}»? El historial la seguirá nombrando.`)) { borrarReceta(r.id); avisar("Receta borrada"); onCerrar(); } }}><Trash2 size={15} /> Borrar</button>
        <button className="btn" onClick={duplicar}><Copy size={15} /> Duplicar</button>
        <span className="crece" />
        <button className="btn primario" onClick={() => setEditar(true)}><Pencil size={15} /> Editar</button>
      </>}>
      <div className="pila-g">
        <div className="fila" style={{ gap: 16 }}>
          {r.minutos && <span className="fila lapiz" style={{ gap: 5 }}><Clock size={15} /> {r.minutos} min</span>}
          {r.raciones && <span className="fila lapiz" style={{ gap: 5 }}><Users size={15} /> {r.raciones} raciones</span>}
          <span className="lapiz">Para {(r.momentos?.length ? r.momentos : ["comida", "cena"]).map((m) => MOMENTOS.find((x) => x.clave === m)?.nombre.toLowerCase()).join(", ")}</span>
          <span className="lapiz">{u?.veces ? `Hecha ${u.veces} ${u.veces === 1 ? "vez" : "veces"}, la última ${haceDias(diasEntre(u.ultima, hoy))}` : "Aún sin hacer"}</span>
        </div>
        <div>
          <div className="ojal" style={{ marginBottom: 6 }}>Raciones que cuenta (por persona)</div>
          <Componentes lista={r.componentes} />
        </div>
        {r.ingredientes && <div><div className="ojal" style={{ marginBottom: 6 }}>Ingredientes</div><div className="texto-receta">{r.ingredientes}</div></div>}
        {r.pasos && <div><div className="ojal" style={{ marginBottom: 6 }}>Preparación</div><div className="texto-receta">{r.pasos}</div></div>}
        {r.nota && <div><div className="ojal" style={{ marginBottom: 6 }}>Nota</div><div className="texto-receta">{r.nota}</div></div>}
        {(r.enlace || r.etiquetas?.length > 0) && (
          <div className="fila">
            {r.enlace && <a className="btn mini" href={r.enlace} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Ver receta original</a>}
            {(r.etiquetas || []).map((e) => <span key={e} className="chip suave">#{e}</span>)}
          </div>
        )}
      </div>
    </Hoja>
  );
}

const VACIA = { nombre: "", grupo: "libre", momentos: ["comida", "cena"], componentes: [], ingredientes: "", pasos: "", raciones: null, minutos: null, enlace: "", etiquetas: [], favorita: false, nota: "" };

function RecetaEditor({ inicial, onCerrar, onGuardada }) {
  const esNueva = !inicial?.id;
  const [b, setB] = useState(() => {
    const base = { ...VACIA, ...inicial };
    if (base.grupo === "desayuno" && esNueva && !inicial.momentos) base.momentos = ["desayuno"];
    return base;
  });
  const [etiquetas, setEtiquetas] = useState((inicial?.etiquetas || []).join(", "));
  const [compTocados, setCompTocados] = useState(!esNueva || (inicial?.componentes?.length > 0));
  const [grupoTocado, setGrupoTocado] = useState(!esNueva || !!inicial?.grupo);
  const pon = (campo, valor) => setB((x) => ({ ...x, [campo]: valor }));

  const cambiaIngredientes = (ingredientes) => {
    setB((x) => {
      const n = { ...x, ingredientes };
      if (!compTocados) {
        n.componentes = componentesPropuestos(ingredientes, x.grupo);
        if (!grupoTocado) n.grupo = grupoSugerido(n.componentes) || "libre";
      }
      return n;
    });
  };
  const cambiaGrupo = (grupo) => {
    setGrupoTocado(true);
    setB((x) => ({ ...x, grupo, momentos: grupo === "desayuno" ? ["desayuno"] : x.momentos.includes("desayuno") && x.momentos.length === 1 ? ["comida", "cena"] : x.momentos,
      componentes: compTocados ? x.componentes : componentesPropuestos(x.ingredientes, grupo) }));
  };
  const detectadosSinPoner = compTocados ? detectar(b.ingredientes).filter((d) => !b.componentes.includes(d.clave)) : [];

  const guardar = () => {
    if (!b.nombre.trim()) { avisar("Ponle un nombre a la receta", "error"); return; }
    const enlace = (b.enlace || "").trim();
    if (enlace && !/^https?:\/\//i.test(enlace)) { avisar("El enlace tiene que empezar por http:// o https://", "error"); return; }
    const r = guardarReceta({
      ...b, nombre: b.nombre.trim(), enlace, subfamilia: subfamiliaPrincipal(b.componentes),
      raciones: b.raciones ? Number(b.raciones) : null, minutos: b.minutos ? Number(b.minutos) : null,
      etiquetas: etiquetas.split(",").map((e) => e.trim()).filter(Boolean),
    });
    avisar(esNueva ? "Receta guardada" : "Cambios guardados");
    onGuardada(r);
  };

  return (
    <Hoja titulo={esNueva ? "Nueva receta" : "Editar receta"} onCerrar={onCerrar} ancha
      pie={<><button className="btn" onClick={onCerrar}>Cancelar</button><button className="btn verde" onClick={guardar}>Guardar</button></>}>
      <div className="pila-g">
        <div>
          <label className="etq" htmlFor="r-nombre">Nombre</label>
          <input id="r-nombre" className="campo" value={b.nombre} onChange={(e) => pon("nombre", e.target.value)} placeholder="Lentejas con verduras" autoFocus={esNueva && !b.nombre} />
        </div>
        <div className="rejilla-2">
          <div>
            <label className="etq" htmlFor="r-tipo">Tipo de plato</label>
            <select id="r-tipo" className="campo" value={b.grupo} onChange={(e) => cambiaGrupo(e.target.value)}>
              {TIPOS_RECETA.map((t) => <option key={t.clave} value={t.clave}>{t.nombre}</option>)}
            </select>
            <div className="nota" style={{ marginTop: 4 }}>Decide en qué huecos del plan se sugiere.</div>
          </div>
          <div>
            <span className="etq">Para</span>
            <div className="chips">
              {MOMENTOS.map((m) => {
                const on = b.momentos.includes(m.clave);
                return <button key={m.clave} className={"chip" + (on ? " on" : "")} onClick={() => pon("momentos", on ? b.momentos.filter((x) => x !== m.clave) : [...b.momentos, m.clave])}>{m.nombre}</button>;
              })}
            </div>
          </div>
        </div>
        <div>
          <label className="etq" htmlFor="r-ing">Ingredientes · uno por línea</label>
          <textarea id="r-ing" className="campo" rows={6} value={b.ingredientes} onChange={(e) => cambiaIngredientes(e.target.value)}
            placeholder={"250 g de lentejas pardinas\n1 zanahoria\n1 pimiento rojo\n1 cebolla y 2 dientes de ajo"} />
          {!compTocados && b.ingredientes && <div className="nota" style={{ marginTop: 4 }}>Las raciones de abajo se rellenan solas a partir de los ingredientes hasta que las toques.</div>}
        </div>
        <div className="tarjeta plana">
          <div className="fila entre" style={{ marginBottom: 8 }}>
            <span className="ojal">Raciones que cuenta al comerla (por persona)</span>
            {compTocados && <button className="btn mini fantasma" onClick={() => { setCompTocados(false); pon("componentes", componentesPropuestos(b.ingredientes, b.grupo)); }}>Recalcular desde ingredientes</button>}
          </div>
          {detectadosSinPoner.length > 0 && (
            <div className="fila" style={{ marginBottom: 10 }}>
              <span className="nota">En los ingredientes también hay:</span>
              {detectadosSinPoner.map((d) => (
                <button key={d.clave} className="chip" onClick={() => pon("componentes", [...b.componentes, d.clave])} title={d.linea}>
                  <Plus size={12} /> {d.nombre} → {SUB[d.clave].nombre}
                </button>
              ))}
            </div>
          )}
          <SelectorComponentes valor={b.componentes} onCambio={(f) => { setCompTocados(true); setB((x) => ({ ...x, componentes: f(x.componentes) })); }} />
          <div className="nota" style={{ marginTop: 8 }}>Cuenta lo que es una ración de verdad: la zanahoria de un guiso sí; el ajo del sofrito no suma. Un plato con mucha verdura puede llevarla ×2.</div>
        </div>
        <div>
          <label className="etq" htmlFor="r-pasos">Preparación</label>
          <textarea id="r-pasos" className="campo" rows={6} value={b.pasos} onChange={(e) => pon("pasos", e.target.value)} placeholder="Los pasos, a tu manera." />
        </div>
        <div className="rejilla-3">
          <div><label className="etq" htmlFor="r-min">Minutos</label><input id="r-min" className="campo" type="number" min="1" inputMode="numeric" value={b.minutos || ""} onChange={(e) => pon("minutos", e.target.value)} /></div>
          <div><label className="etq" htmlFor="r-rac">Raciones</label><input id="r-rac" className="campo" type="number" min="1" inputMode="numeric" value={b.raciones || ""} onChange={(e) => pon("raciones", e.target.value)} /></div>
          <div><label className="etq" htmlFor="r-et">Etiquetas</label><input id="r-et" className="campo" value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} placeholder="rápida, táper, verano" /></div>
        </div>
        <div>
          <label className="etq" htmlFor="r-url">Enlace (opcional)</label>
          <input id="r-url" className="campo" type="url" value={b.enlace || ""} onChange={(e) => pon("enlace", e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="etq" htmlFor="r-nota">Nota</label>
          <textarea id="r-nota" className="campo" rows={2} style={{ minHeight: 56 }} value={b.nota} onChange={(e) => pon("nota", e.target.value)} placeholder="Congela bien, doble ración…" />
        </div>
        <Interruptor marcado={b.favorita} onCambio={(v) => pon("favorita", v)} nota="Sube un poco en las sugerencias.">Favorita</Interruptor>
      </div>
    </Hoja>
  );
}
