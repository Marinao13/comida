import React, { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { FAMILIAS, TOTALES, LIMITES, FUENTES, GRUPOS } from "../../src/catalogo.mjs";
import { normaliza } from "../nutricion.js";

const ROTAR = { mucho: "Rotar: es donde más importa", sí: "Rotar: merece la pena", poco: "Rotar: importa poco", no: "No hace falta rotar" };

function Resalta({ texto, q }) {
  if (!q) return texto;
  const n = normaliza(texto), i = n.indexOf(q);
  if (i < 0) return texto;
  return <>{texto.slice(0, i)}<mark>{texto.slice(i, i + q.length)}</mark>{texto.slice(i + q.length)}</>;
}

export default function Guia() {
  const [busca, setBusca] = useState("");
  const q = normaliza(busca.trim());

  const familias = useMemo(() => FAMILIAS.map((f) => ({
    ...f,
    subfamilias: f.subfamilias.map((s) => ({
      ...s,
      alimentos: (s.alimentos || []).filter((a) => !q || normaliza(a.nombres.join(" ") + " " + a.aporta + " " + s.nombre).includes(q)),
    })).filter((s) => !q || s.alimentos.length),
  })).filter((f) => !q || f.subfamilias.length), [q]);

  return (
    <div className="pila-g">
      <div>
        <h2>Guía</h2>
        <div className="nota">Frecuencias de AESAN (2022) con las notas de la conversación. El reparto por subfamilias es una propuesta orientativa para cubrir nutrientes, no una norma.</div>
      </div>

      <div style={{ position: "relative", maxWidth: 460 }}>
        <Search size={16} style={{ position: "absolute", left: 11, top: 12, color: "var(--tenue)" }} />
        <input className="campo" style={{ paddingLeft: 34 }} placeholder="¿Dónde va el kale? Busca un alimento o nutriente" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {!q && (
        <div className="rejilla-2">
          <div className="tarjeta">
            <h3 style={{ marginBottom: 8 }}>Las 14 comidas y cenas de la semana</h3>
            <table className="tabla">
              <tbody>
                {GRUPOS.map((g) => <tr key={g.clave}><td><span className="pastilla" style={{ background: g.suave, color: g.color }}><span className="bola" style={{ background: g.color }} />{g.nombre}</span></td><td className="n"><b>{g.porDefecto}</b></td></tr>)}
              </tbody>
            </table>
            <div className="nota" style={{ marginTop: 8 }}>Verdura en todas las comidas y fruta en el desayuno y de postre. Cocinar el doble de guiso o de pollo asado te resuelve otra comida.</div>
          </div>
          <div className="tarjeta">
            <h3 style={{ marginBottom: 8 }}>Límites y ocasionales</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }} className="pila">
              {LIMITES.map((l) => <li key={l} style={{ marginTop: 4 }}>{l}</li>)}
              {TOTALES.map((t) => <li key={t.clave} style={{ marginTop: 4 }}>{t.nombre}: {t.texto}.</li>)}
            </ul>
          </div>
        </div>
      )}

      {familias.length === 0 && <div className="nota">No aparece «{busca}». Si es una verdura de hoja, va con la hoja verde; si es un embutido, con la carne procesada.</div>}

      {familias.map((f) => (
        <div key={f.clave} className="tarjeta guia-fam pila">
          <div className="fila entre" style={{ alignItems: "baseline" }}>
            <h3>{f.nombre}</h3>
            <span className="peq lapiz">{f.texto}{f.racion ? ` · ración: ${f.racion}` : ""}</span>
          </div>
          {!q && <div className="nota"><b>{ROTAR[f.rotar]}.</b> {f.nota}</div>}
          {f.subfamilias.map((s) => (
            <div key={s.clave}>
              <div className="fila entre" style={{ marginTop: 6 }}>
                <span style={{ fontWeight: 700 }}>{s.nombre}</span>
                <span className="peq lapiz">{s.texto}{f.tipo === "diaria" && s.objetivo?.min && !s.texto.includes("día") ? " /sem" : ""}</span>
              </div>
              <div style={{ marginTop: 4 }}>
                {s.alimentos.map((a) => (
                  <div key={a.nombres.join()} className="alimento">
                    <span style={{ fontWeight: 600 }}><Resalta texto={a.nombres.join(", ")} q={q} /></span>
                    <span className="lapiz"><Resalta texto={a.aporta} q={q} /></span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {!q && (
        <div className="tarjeta">
          <h3 style={{ marginBottom: 8 }}>Fuentes</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {FUENTES.map(([t, u]) => <li key={u} style={{ marginTop: 4 }}><a href={u} target="_blank" rel="noopener noreferrer">{t} <ExternalLink size={11} /></a></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
