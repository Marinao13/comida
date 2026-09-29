import React from "react";
import { Minus, Plus, Download, RefreshCw, RotateCcw } from "lucide-react";
import { GRUPOS, repartoPorDefecto } from "../../src/catalogo.mjs";
import { ponAjuste, exportar, vaciarCola, cargar, avisar, descartarPrimero, primerPendiente } from "../datos.js";
import { configuracion } from "./Semana.jsx";
import { Interruptor } from "../ui.jsx";

export default function Ajustes({ datos, estado }) {
  const { reparto, pref } = configuracion(datos);
  const total = GRUPOS.reduce((n, g) => n + (reparto[g.clave] || 0), 0);
  const cambia = (clave, d) => {
    const n = Math.max(0, Math.min(14, (reparto[clave] || 0) + d));
    if (d > 0 && total >= 14) { avisar("Ya hay 14 huecos: quita uno de otro grupo primero", "error"); return; }
    ponAjuste("reparto", { ...reparto, [clave]: n });
  };
  const ponPref = (clave, v) => ponAjuste("preferencias", { ...pref, [clave]: v });

  return (
    <div className="pila-g">
      <h2>Ajustes</h2>
      <div className="rejilla-2">
        <div className="tarjeta pila">
          <div className="fila entre">
            <h3>Reparto semanal</h3>
            <span className={"num " + (total === 14 ? "lapiz" : "")} style={total !== 14 ? { color: "#9A6B00", fontWeight: 700 } : undefined}>{total} / 14 huecos</span>
          </div>
          <div className="nota">Cuántas comidas y cenas de cada grupo quieres a la semana. Si sobran huecos se rellenan como «libre».</div>
          <table className="tabla">
            <tbody>
              {GRUPOS.map((g) => (
                <tr key={g.clave}>
                  <td style={{ verticalAlign: "middle" }}>
                    <span className="pastilla" style={{ background: g.suave, color: g.color }}><span className="bola" style={{ background: g.color }} />{g.nombre}</span>
                    {reparto[g.clave] !== g.porDefecto && <span className="nota"> · por defecto {g.porDefecto}</span>}
                  </td>
                  <td className="n" style={{ width: 130 }}>
                    <span className="contador">
                      <button onClick={() => cambia(g.clave, -1)} aria-label={"Menos " + g.nombre}><Minus size={14} /></button>
                      <span className="et num" style={{ minWidth: 26, textAlign: "center" }}>{reparto[g.clave] || 0}</span>
                      <button onClick={() => cambia(g.clave, 1)} aria-label={"Más " + g.nombre}><Plus size={14} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="nota">Referencia: ≥4 legumbres, ≥3 pescados (sobre todo azul), máximo 3 carnes (mejor ave), hasta 4 huevos.</div>
          <div><button className="btn mini" onClick={() => ponAjuste("reparto", repartoPorDefecto())}><RotateCcw size={14} /> Volver al reparto por defecto</button></div>
        </div>

        <div className="pila-g">
          <div className="tarjeta">
            <h3 style={{ marginBottom: 6 }}>Al repartir la semana</h3>
            <Interruptor marcado={pref.desayunos} onCambio={(v) => ponPref("desayunos", v)} nota="Rota tus recetas de desayuno por los días.">Planificar también los desayunos</Interruptor>
            <Interruptor marcado={pref.legumbresAMediodia} onCambio={(v) => ponPref("legumbresAMediodia", v)}>Legumbres mejor a mediodía</Interruptor>
            <Interruptor marcado={pref.huevosPorLaNoche} onCambio={(v) => ponPref("huevosPorLaNoche", v)}>Huevos mejor por la noche</Interruptor>
            <Interruptor marcado={pref.libreFinde} onCambio={(v) => ponPref("libreFinde", v)}>El hueco libre, mejor en fin de semana</Interruptor>
          </div>

          <div className="tarjeta pila">
            <h3>Datos</h3>
            <div className="nota">
              {datos.quien ? <>Entras como <b>{datos.quien}</b>. </> : null}
              {Object.values(datos.recetas).filter((r) => !r.borrado_en).length} recetas · {Object.keys(datos.registro).length} apuntes · {Object.keys(datos.huecos).length} huecos planeados.
            </div>
            <div className="nota">
              {estado.pendientes ? `${estado.pendientes} cambio(s) esperando a subir${estado.sinConexion ? " (sin conexión)" : ""}.` : "Todo subido."}
            </div>
            {estado.errorCola && (
              <div className="banner ambar">
                <span>El servidor rechaza el primer cambio pendiente (<code>{primerPendiente()}</code>): {estado.errorCola}. Si sigue así, puedes descartar solo ese cambio.</span>
                <button className="btn mini peligro" onClick={() => { if (confirm("¿Descartar ese cambio? Se perderá.")) descartarPrimero(); }}>Descartar ese cambio</button>
              </div>
            )}
            <div className="fila">
              <button className="btn" onClick={exportar}><Download size={15} /> Exportar copia (JSON)</button>
              <button className="btn" onClick={async () => { await vaciarCola(); await cargar({ forzar: true }); avisar("Datos actualizados"); }}><RefreshCw size={15} /> Sincronizar ahora</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
