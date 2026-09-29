import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Shuffle, Wand2, Lock, Check, ArrowLeftRight, Plus, X, Trash2, CircleSlash, Eraser, MoreHorizontal, Search } from "lucide-react";
import { GRUPOS, GRUPO, GRUPO_FUERA, GRUPO_DESAYUNO, FAM, SUB, MOMENTOS, repartoPorDefecto } from "../../src/catalogo.mjs";
import { ponSemana, ponHueco, quitarHueco, avisar } from "../datos.js";
import { generarReparto, rellenarSemana, sugerir, candidatas, claveHueco, cuentaGrupos, balancePlan, PREFERENCIAS_POR_DEFECTO, ordenaHuecos } from "../planificador.js";
import { estado as estadoDe, normaliza } from "../nutricion.js";
import { diasDe, sumaDias, lunesDe, hoyISO, nombreDia, diaMes, rangoSemana, semanaISO, fechaLarga, mayuscula } from "../fechas.js";
import { Hoja, Pastilla, FilaObjetivo, Interruptor, Vacio, Componentes } from "../ui.jsx";

const FAMILIA_DE_GRUPO = { legumbres: "legumbres", pescado_azul: "pescado_azul", pescado_blanco: "pescado_blanco", carne_blanca: "carne_blanca", carne_roja: "carne_roja" };
const ORDEN = ["desayuno", "comida", "cena"];

export function configuracion(datos) {
  return {
    reparto: { ...repartoPorDefecto(), ...(datos.ajustes.reparto || {}) },
    pref: { ...PREFERENCIAS_POR_DEFECTO, ...(datos.ajustes.preferencias || {}) },
  };
}

export default function Semana({ datos, recetasLista, usos, abrirReceta, lunes, setLunes }) {
  const [editando, setEditando] = useState(null);        // { fecha, momento }
  const [intercambio, setIntercambio] = useState(null);  // clave del hueco origen
  useEffect(() => { setIntercambio(null); setEditando(null); }, [lunes]);   // el intercambio es dentro de una semana
  const hoy = hoyISO();
  const dias = diasDe(lunes);
  const { reparto, pref } = configuracion(datos);
  const activas = useMemo(() => recetasLista.filter((r) => !r.borrado_en), [recetasLista]);
  const porId = datos.recetas;

  const semana = useMemo(() => ordenaHuecos(dias.flatMap((f) => ORDEN.map((m) => datos.huecos[claveHueco(f, m)]).filter(Boolean))), [datos.huecos, lunes]);
  const hayPlan = semana.some((h) => h.momento !== "desayuno");
  const momentos = pref.desayunos || semana.some((h) => h.momento === "desayuno") ? ORDEN : ["comida", "cena"];

  const repartir = () => {
    const actuales = new Map(semana.map((h) => [claveHueco(h.fecha, h.momento), h]));
    const pierden = semana.filter((h) => !h.fijo && (h.receta_id || h.guarnicion_id)).length;
    if (pierden && !confirm(`Rehacer el reparto quita las recetas de ${pierden} hueco${pierden === 1 ? "" : "s"} sin fijar. Fija (candado) los que quieras conservar. ¿Seguir?`)) return;
    const nuevos = generarReparto({ lunes, reparto, actuales, semilla: Math.floor(Math.random() * 1e9), pref, desayunos: activas.filter((r) => r.grupo === "desayuno") });
    ponSemana(lunes, nuevos);
    avisar(hayPlan ? "Reparto rehecho" : "Semana repartida: ahora elige recetas o pulsa «Rellenar con recetas»");
  };

  const rellenar = () => {
    const nuevos = rellenarSemana({ semana, recetas: activas, usos, semilla: Math.floor(Math.random() * 1e9) });
    const puestas = nuevos.reduce((n, h, i) => n + (h.receta_id && !semana[i]?.receta_id ? 1 : 0) + (h.guarnicion_id && !semana[i]?.guarnicion_id ? 1 : 0), 0);
    if (!puestas) { avisar(activas.some((r) => r.grupo !== "desayuno") ? "No hay recetas que encajen en los huecos vacíos" : "Primero guarda algunas recetas en la pestaña Recetas"); return; }
    ponSemana(lunes, nuevos);
    avisar(`${puestas} receta${puestas === 1 ? "" : "s"} puesta${puestas === 1 ? "" : "s"}. Cambia las que no te apetezcan.`);
  };

  const quitarRecetas = () => {
    if (!confirm("¿Quitar las recetas de los huecos sin fijar? Los grupos se quedan.")) return;
    ponSemana(lunes, semana.map((h) => (h.fijo ? h : { ...h, receta_id: null, guarnicion_id: null })));
  };
  const vaciar = () => { if (confirm("¿Vaciar toda la semana, fijos incluidos?")) ponSemana(lunes, []); };

  const pulsar = (fecha, momento) => {
    if (!intercambio) { setEditando({ fecha, momento }); return; }
    const k = claveHueco(fecha, momento);
    if (k === intercambio) { setIntercambio(null); return; }
    const a = datos.huecos[intercambio], b = datos.huecos[k];
    const [fa, ma] = intercambio.split("|");
    if ((ma === "desayuno") !== (momento === "desayuno")) { avisar("Los desayunos solo se intercambian entre sí", "error"); return; }
    const resto = semana.filter((h) => claveHueco(h.fecha, h.momento) !== intercambio && claveHueco(h.fecha, h.momento) !== k);
    const nuevos = [...resto];
    if (b) nuevos.push({ ...b, fecha: fa, momento: ma });
    if (a) nuevos.push({ ...a, fecha, momento });
    ponSemana(lunes, ordenaHuecos(nuevos));
    setIntercambio(null);
  };

  const cuenta = cuentaGrupos(semana);
  const plan = balancePlan(semana, porId);
  const [menu, setMenu] = useState(false);
  const { semana: nSemana } = semanaISO(lunes);

  return (
    <div className="pila-g">
      <div className="fila entre">
        <div className="dia-nav">
          <button className="btn icono" onClick={() => setLunes(sumaDias(lunes, -7))} aria-label="Semana anterior"><ChevronLeft size={20} /></button>
          <div>
            <div className="ojal">Semana {nSemana}</div>
            <div className="fecha">{rangoSemana(lunes)}</div>
          </div>
          <button className="btn icono" onClick={() => setLunes(sumaDias(lunes, 7))} aria-label="Semana siguiente"><ChevronRight size={20} /></button>
          {lunes !== lunesDe(hoy) && <button className="btn mini" onClick={() => setLunes(lunesDe(hoy))}>Esta semana</button>}
        </div>
        {hayPlan && (
          <div className="fila">
            <button className="btn verde" onClick={rellenar}><Wand2 size={16} /> Rellenar con recetas</button>
            <button className="btn" onClick={repartir}><Shuffle size={16} /> Rehacer reparto</button>
            <div style={{ position: "relative" }}>
              <button className="btn icono" onClick={() => setMenu(!menu)} aria-label="Más acciones" aria-expanded={menu}><MoreHorizontal size={18} /></button>
              {menu && (
                <div className="tarjeta densa" style={{ position: "absolute", right: 0, top: 38, zIndex: 20, width: 240, display: "flex", flexDirection: "column", gap: 4 }} onMouseLeave={() => setMenu(false)}>
                  <button className="btn fantasma" style={{ justifyContent: "flex-start" }} onClick={() => { setMenu(false); quitarRecetas(); }}><Eraser size={15} /> Quitar recetas sin fijar</button>
                  <button className="btn fantasma peligro" style={{ justifyContent: "flex-start" }} onClick={() => { setMenu(false); vaciar(); }}><Trash2 size={15} /> Vaciar la semana</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!hayPlan ? (
        <div className="tarjeta pila" style={{ textAlign: "center", padding: "28px 18px" }}>
          <h3>Semana sin repartir</h3>
          <div className="nota" style={{ maxWidth: 560, margin: "6px auto 0" }}>
            Reparte las 14 comidas y cenas por grupos: {GRUPOS.filter((g) => reparto[g.clave]).map((g) => `${reparto[g.clave]} ${g.nombre.toLowerCase()}`).join(", ")}.
            Luego eliges receta para cada hueco o dejas que se rellene sola. Si ya sabes que un día comes fuera, márcalo antes y fíjalo.
          </div>
          <div><button className="btn verde grande" onClick={repartir}><Shuffle size={18} /> Repartir la semana</button></div>
          <div className="nota">El reparto se cambia en Ajustes.</div>
        </div>
      ) : null}

      {intercambio && (
        <div className="banner">
          <ArrowLeftRight size={16} /> Toca el hueco con el que quieres intercambiar <b>{nombreDia(intercambio.split("|")[0])} · {intercambio.split("|")[1]}</b>.
          <button className="btn mini" onClick={() => setIntercambio(null)}>Cancelar</button>
        </div>
      )}

      {(hayPlan || semana.length > 0) && (
        <>
          {/* escritorio: rejilla día × momento */}
          <div className="semana-rejilla">
            <div />
            {dias.map((f) => (
              <div key={f} className={"cab-dia" + (f === hoy ? " hoy" : "")}><span>{nombreDia(f, true)} {diaMes(f)}</span></div>
            ))}
            {momentos.map((m) => (
              <React.Fragment key={m}>
                <div className="cab-mom">{MOMENTOS.find((x) => x.clave === m).nombre}</div>
                {dias.map((f) => (
                  <Hueco key={f + m} h={datos.huecos[claveHueco(f, m)]} r={datos.registro[claveHueco(f, m)]} porId={porId}
                    pasado={f < hoy} eleccion={intercambio === claveHueco(f, m)} onClick={() => pulsar(f, m)} />
                ))}
              </React.Fragment>
            ))}
          </div>
          {/* móvil: un bloque por día */}
          <div className="dia-movil pila">
            {dias.map((f) => (
              <div key={f}>
                <div className="ojal" style={{ marginBottom: 5, color: f === hoy ? "var(--tinta)" : undefined }}>{fechaLarga(f)}{f === hoy ? " · hoy" : ""}</div>
                <div className="huecos-dia" style={{ gridTemplateColumns: `repeat(${momentos.length}, minmax(0,1fr))` }}>
                  {momentos.map((m) => (
                    <Hueco key={m} h={datos.huecos[claveHueco(f, m)]} r={datos.registro[claveHueco(f, m)]} porId={porId} momento={m}
                      pasado={f < hoy} eleccion={intercambio === claveHueco(f, m)} onClick={() => pulsar(f, m)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rejilla-2">
            <div className="tarjeta">
              <div className="cab fila entre" style={{ marginBottom: 8 }}>
                <h3>Reparto</h3>
                <span className="nota">huecos de comida y cena</span>
              </div>
              <div className="chips">
                {GRUPOS.map((g) => {
                  const n = cuenta[g.clave] || 0, quiero = reparto[g.clave] || 0;
                  return (
                    <span key={g.clave} className="chip suave" style={n !== quiero ? { background: "#FDF4DD" } : undefined} title={n !== quiero ? `El reparto pide ${quiero}` : undefined}>
                      <span className="bola" style={{ width: 8, height: 8, borderRadius: "50%", background: g.color }} /> {g.corto} <span className="n">{n}/{quiero}</span>
                    </span>
                  );
                })}
                {cuenta.fuera > 0 && <span className="chip suave">Fuera <span className="n">{cuenta.fuera}</span></span>}
              </div>
              <div className="nota" style={{ marginTop: 10 }}>
                Toca un hueco para cambiar grupo o receta, fijarlo <Lock size={11} /> o intercambiarlo con otro <ArrowLeftRight size={11} />.
              </div>
            </div>
            <div className="tarjeta">
              <div className="fila entre" style={{ marginBottom: 4 }}>
                <h3>Cómo queda la semana</h3>
                <span className="nota">según lo planeado</span>
              </div>
              {[
                ["Legumbres", plan.fam.legumbres || 0, FAM.legumbres.objetivo],
                ["Pescado (total)", plan.tot.pescado_total || 0, { min: 3 }],
                ["· azul", plan.fam.pescado_azul || 0, FAM.pescado_azul.objetivo],
                ["Carne (total)", plan.tot.carne_total || 0, { max: 3 }],
                ["Huevos", plan.fam.huevos || 0, FAM.huevos.objetivo],
              ].map(([nombre, n, o]) => <FilaObjetivo key={nombre} nombre={nombre} n={n} objetivo={o} estado={estadoDe(n, o)} />)}
              <div className="ojal" style={{ margin: "12px 0 2px" }}>Verduras planeadas</div>
              {["hoja_verde", "rojas", "cruciferas", "naranjas"].map((k) => (
                <FilaObjetivo key={k} nombre={SUB[k].nombre} n={plan.sub[k] || 0} objetivo={SUB[k].objetivo} texto={SUB[k].texto + "/sem"} estado={estadoDe(plan.sub[k] || 0, SUB[k].objetivo)} />
              ))}
              <div className="nota" style={{ marginTop: 8 }}>Cuenta lo que llevan las recetas elegidas. La fruta y lo de entre horas se apunta en Hoy.</div>
            </div>
          </div>
        </>
      )}

      {editando && (
        <HuecoEditor
          fecha={editando.fecha} momento={editando.momento} hueco={datos.huecos[claveHueco(editando.fecha, editando.momento)]}
          semana={semana} recetas={activas} porId={porId} usos={usos} abrirReceta={abrirReceta}
          onCerrar={() => setEditando(null)}
          onIntercambiar={() => { setIntercambio(claveHueco(editando.fecha, editando.momento)); setEditando(null); }}
        />
      )}
    </div>
  );
}

function Hueco({ h, r, porId, pasado, eleccion, onClick, momento }) {
  const clase = "hueco" + (!h ? " vacio" : "") + (pasado ? " pasado" : "") + (eleccion ? " eleccion" : "");
  if (!h) return <button className={clase} onClick={onClick} aria-label="Hueco vacío: añadir"><Plus size={16} />{momento && <span className="peq">{momento}</span>}</button>;
  const g = GRUPO[h.grupo];
  const principal = h.receta_id ? porId[h.receta_id]?.nombre || "(receta borrada)" : null;
  const guarn = h.guarnicion_id ? porId[h.guarnicion_id]?.nombre || "(receta borrada)" : null;
  return (
    <button className={clase} style={{ borderTopColor: g?.color }} onClick={onClick}>
      <span className="marcas">
        {h.fijo && <Lock size={12} aria-label="fijo" />}
        {r && (r.origen === "plan" ? <Check size={13} className="ok" aria-label="comido según el plan" /> : <CircleSlash size={12} aria-label="comiste otra cosa" />)}
      </span>
      <span className="gr" style={{ color: g?.color }}>{momento ? (h.grupo === "desayuno" ? momento : `${momento} · ${g?.corto || h.grupo}`) : g?.corto || h.grupo}</span>
      {h.subfamilia && !principal && <span className="pista">{SUB[h.subfamilia]?.nombre}</span>}
      {principal ? <span className="rec">{principal}</span> : h.grupo !== "fuera" && <span className="rec sin">sin receta</span>}
      {guarn && <span className="gu">+ {guarn}</span>}
    </button>
  );
}

/* ================= Editor de un hueco ================= */
export function HuecoEditor({ fecha, momento, hueco, semana, recetas, porId, usos, abrirReceta, onCerrar, onIntercambiar }) {
  const esDesayuno = momento === "desayuno";
  const [b, setB] = useState(() => ({ fecha, momento, grupo: esDesayuno ? "desayuno" : "libre", subfamilia: null, receta_id: null, guarnicion_id: null, fijo: false, ...hueco }));
  const [verTodas, setVerTodas] = useState({ principal: false, guarnicion: false });
  const pon = (campo, valor) => setB((x) => ({ ...x, [campo]: valor }));
  const semanaConEste = [...semana.filter((h) => !(h.fecha === fecha && h.momento === momento)), b];
  const semilla = useMemo(() => Math.floor(Math.random() * 1e6), []);

  const grupos = esDesayuno ? [GRUPO_DESAYUNO, GRUPO_FUERA] : [...GRUPOS, GRUPO_FUERA];
  const familia = FAM[FAMILIA_DE_GRUPO[b.grupo]];
  const cambiaGrupo = (grupo) => setB((x) => {
    const r = porId[x.receta_id];
    const sigue = r && candidatas({ ...x, grupo }, "principal", [r]).length > 0;
    return { ...x, grupo, subfamilia: null, receta_id: sigue ? x.receta_id : null, guarnicion_id: grupo === "fuera" ? null : x.guarnicion_id };
  });

  const guardar = () => { ponHueco(b); onCerrar(); };
  const quitar = () => { quitarHueco(fecha, momento); onCerrar(); };

  return (
    <Hoja titulo={`${mayuscula(fechaLarga(fecha))} · ${MOMENTOS.find((m) => m.clave === momento).nombre}`} onCerrar={onCerrar} ancha
      pie={<>
        {hueco && <button className="btn peligro" onClick={quitar}><Trash2 size={15} /> Quitar</button>}
        {hueco && onIntercambiar && <button className="btn" onClick={onIntercambiar}><ArrowLeftRight size={15} /> Intercambiar</button>}
        <span className="crece" />
        <button className="btn" onClick={onCerrar}>Cancelar</button>
        <button className="btn verde" onClick={guardar}>Guardar</button>
      </>}>
      <div className="pila-g">
        <div>
          <span className="etq">Qué toca</span>
          <div className="chips">
            {grupos.map((g) => (
              <button key={g.clave} className={"chip" + (b.grupo === g.clave ? " on" : "")} onClick={() => cambiaGrupo(g.clave)}>
                <span className="bola" style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, display: "inline-block" }} /> {g.nombre}
              </button>
            ))}
          </div>
          {b.grupo === "libre" && <div className="nota" style={{ marginTop: 6 }}>Libre: mejor un plato vegetal o una legumbre extra.</div>}
        </div>

        {familia && familia.subfamilias.length > 1 && (
          <div>
            <span className="etq">Dentro del grupo (orientativo)</span>
            <div className="chips">
              {familia.subfamilias.map((s) => (
                <button key={s.clave} className={"chip" + (b.subfamilia === s.clave ? " on" : "")} onClick={() => pon("subfamilia", b.subfamilia === s.clave ? null : s.clave)} title={s.texto}>
                  {s.nombre} <span style={{ opacity: 0.65, fontWeight: 500 }}>{s.texto}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {b.grupo !== "fuera" && (
          <SelectorReceta titulo={esDesayuno ? "Desayuno" : "Plato"} tipo="principal" hueco={b} semana={semanaConEste} recetas={recetas} porId={porId} usos={usos} semilla={semilla}
            valor={b.receta_id} onElegir={(id) => pon("receta_id", id)} verTodas={verTodas.principal} setVerTodas={(v) => setVerTodas((x) => ({ ...x, principal: v }))}
            onNueva={() => abrirReceta({ grupo: ["libre", "fuera"].includes(b.grupo) ? undefined : b.grupo }, { alGuardar: (r) => pon("receta_id", r.id) })} />
        )}

        {!esDesayuno && b.grupo !== "fuera" && (
          <SelectorReceta titulo="Verdura de acompañamiento o primer plato" tipo="guarnicion" hueco={b} semana={semanaConEste} recetas={recetas} porId={porId} usos={usos} semilla={semilla}
            valor={b.guarnicion_id} onElegir={(id) => pon("guarnicion_id", id)} verTodas={verTodas.guarnicion} setVerTodas={(v) => setVerTodas((x) => ({ ...x, guarnicion: v }))}
            onNueva={() => abrirReceta({ grupo: "verdura" }, { alGuardar: (r) => pon("guarnicion_id", r.id) })} />
        )}

        <Interruptor marcado={b.fijo} onCambio={(v) => pon("fijo", v)} nota="No se mueve ni pierde la receta al rehacer el reparto.">Fijar este hueco</Interruptor>
      </div>
    </Hoja>
  );
}

function SelectorReceta({ titulo, tipo, hueco, semana, recetas, porId, usos, semilla, valor, onElegir, verTodas, setVerTodas, onNueva }) {
  const [busca, setBusca] = useState("");
  const sugerencias = useMemo(() => sugerir({ hueco, tipo, recetas, semana, usos, semilla }), [hueco.grupo, hueco.subfamilia, hueco.receta_id, hueco.guarnicion_id, recetas, usos, semilla]);
  const elegida = valor ? porId[valor] : null;
  const top = sugerencias.filter((s) => s.receta.id !== valor).slice(0, 3);
  const q = normaliza(busca.trim());
  const todas = sugerencias.map((s) => s.receta).filter((r) => !q || normaliza(r.nombre).includes(q)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <div className="pila">
      <div className="fila entre">
        <span className="etq" style={{ margin: 0 }}>{titulo}</span>
        <button className="btn mini fantasma" onClick={onNueva}><Plus size={14} /> Nueva receta</button>
      </div>
      {elegida ? (
        <div className="sugerencia on" style={{ cursor: "default" }}>
          <div className="crece">
            <div style={{ fontWeight: 650 }}>{elegida.nombre}{elegida.borrado_en ? " (borrada)" : ""}</div>
            <Componentes lista={(elegida.componentes || []).filter((k) => !SUB[k]?.base)} />
          </div>
          <button className="btn icono" onClick={() => onElegir(null)} aria-label="Quitar receta"><X size={16} /></button>
        </div>
      ) : (
        <div className="nota">{sugerencias.length ? "Sin elegir. Sugerencias:" : tipo === "guarnicion" ? "No tienes recetas de verdura todavía." : "No tienes recetas que encajen en este hueco."}</div>
      )}
      {top.length > 0 && (
        <div className="pila" style={{ marginTop: 6 }}>
          {top.map((s) => (
            <button key={s.receta.id} className="sugerencia" onClick={() => onElegir(s.receta.id)}>
              <div className="crece">
                <div style={{ fontWeight: 600 }}>{s.receta.nombre}</div>
                <div className="motivos">{s.motivos.slice(0, 3).join(" · ") || "encaja en el hueco"}</div>
              </div>
              <span className="btn mini">Elegir</span>
            </button>
          ))}
        </div>
      )}
      {sugerencias.length > 3 && (
        verTodas ? (
          <div className="pila">
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: 11, color: "var(--tenue)" }} />
              <input className="campo" style={{ paddingLeft: 32 }} placeholder="Buscar receta" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="lista-sel">
              {todas.map((r) => <button key={r.id} className={r.id === valor ? "on" : ""} onClick={() => onElegir(r.id)}><span className="crece">{r.nombre}</span><Pastilla grupo={r.grupo} corto /></button>)}
            </div>
          </div>
        ) : <button className="btn mini fantasma" style={{ alignSelf: "flex-start" }} onClick={() => setVerTodas(true)}>Ver las {sugerencias.length} que encajan</button>
      )}
    </div>
  );
}
