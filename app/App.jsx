import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Sun, CalendarDays, BookOpen, BarChart3, Leaf, Settings, Utensils } from "lucide-react";
import { useTienda, arrancar, vaciarCola, cargar } from "./datos.js";
import { usosRecetas } from "./planificador.js";
import { hoyISO, lunesDe } from "./fechas.js";
import { CSS } from "./estilo.js";
import Hoy from "./vistas/Hoy.jsx";
import Semana from "./vistas/Semana.jsx";
import Recetas, { RecetaHoja } from "./vistas/Recetas.jsx";
import Equilibrio from "./vistas/Equilibrio.jsx";
import Guia from "./vistas/Guia.jsx";
import Ajustes from "./vistas/Ajustes.jsx";

const PESTANAS = [
  { clave: "hoy", nombre: "Hoy", icono: Sun },
  { clave: "semana", nombre: "Semana", icono: CalendarDays },
  { clave: "recetas", nombre: "Recetas", icono: BookOpen },
  { clave: "equilibrio", nombre: "Equilibrio", icono: BarChart3 },
  { clave: "guia", nombre: "Guía", icono: Leaf },
  { clave: "ajustes", nombre: "Ajustes", icono: Settings },
];

const leerPestana = () => { try { return localStorage.getItem("comida:pestana") || "hoy"; } catch (e) { return "hoy"; } };

export default function App() {
  const { datos, estado } = useTienda();
  const [pestana, setPestana] = useState(leerPestana);
  const [fecha, setFecha] = useState(hoyISO);
  const [lunes, setLunes] = useState(() => lunesDe(hoyISO()));
  const [recetaAbierta, setRecetaAbierta] = useState(null);   // { receta, editar, alGuardar }

  useEffect(() => { arrancar(); }, []);
  // app abierta de un día para otro (móvil): al volver, si estabas en "hoy", pasa al nuevo hoy
  const hoyVisto = useRef(hoyISO());
  useEffect(() => {
    const revisa = () => {
      const nuevo = hoyISO(), viejo = hoyVisto.current;
      if (nuevo === viejo) return;
      hoyVisto.current = nuevo;
      setFecha((f) => (f === viejo ? nuevo : f));
      setLunes((l) => (l === lunesDe(viejo) ? lunesDe(nuevo) : l));
    };
    document.addEventListener("visibilitychange", revisa);
    window.addEventListener("focus", revisa);
    const t = setInterval(revisa, 60000);
    return () => { document.removeEventListener("visibilitychange", revisa); window.removeEventListener("focus", revisa); clearInterval(t); };
  }, []);
  useEffect(() => { try { localStorage.setItem("comida:pestana", pestana); } catch (e) { /* nada */ } window.scrollTo(0, 0); }, [pestana]);

  const recetasLista = useMemo(() => Object.values(datos.recetas), [datos.recetas]);
  const registroLista = useMemo(() => Object.values(datos.registro), [datos.registro]);
  const huecosLista = useMemo(() => Object.values(datos.huecos), [datos.huecos]);
  const usos = useMemo(() => usosRecetas(registroLista, huecosLista), [registroLista, huecosLista]);

  const abrirReceta = useCallback((receta, opciones = {}) => setRecetaAbierta({ receta, editar: !receta?.id || !!opciones.editar, alGuardar: opciones.alGuardar }), []);
  const verSemana = useCallback((f) => { setLunes(lunesDe(f)); setPestana("semana"); }, []);

  const comun = { datos, recetasLista, registroLista, huecosLista, usos, abrirReceta };

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="envoltura">
        <header className="cabecera">
          <div className="marca">
            <div className="logo"><Utensils size={19} /></div>
            <div>
              <div className="titulo">Comida</div>
              <div className="sub">Grupos por semana · recetas · lo que comes de verdad</div>
            </div>
          </div>
          <EstadoSincro estado={estado} />
        </header>

        <nav className="pestanas" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <button key={p.clave} className={pestana === p.clave ? "on" : ""} onClick={() => setPestana(p.clave)}>
              <p.icono size={16} /> {p.nombre}
            </button>
          ))}
        </nav>

        {estado.sesionCaducada && (
          <div className="banner rojo" style={{ marginBottom: 14 }}>
            La sesión de Cloudflare Access ha caducado. Lo apuntado se guarda en este aparato hasta que vuelvas a entrar.
            <button className="btn mini" onClick={() => window.location.reload()}>Volver a entrar</button>
          </div>
        )}
        {estado.errorCola && (
          <div className="banner ambar" style={{ marginBottom: 14 }}>
            El servidor no acepta ahora los cambios ({estado.errorCola}). Se reintenta solo y lo apuntado sigue guardado en este aparato.
            <button className="btn mini" onClick={() => setPestana("ajustes")}>Ver</button>
          </div>
        )}
        {!estado.listo && estado.cargando && <div className="nota">Cargando…</div>}
        {!estado.listo && !estado.cargando && estado.error && <div className="banner rojo">No se pudo cargar: {estado.error}</div>}

        {(estado.listo || !estado.cargando) && (
          <main>
            {pestana === "hoy" && <Hoy {...comun} fecha={fecha} setFecha={setFecha} verSemana={verSemana} />}
            {pestana === "semana" && <Semana {...comun} lunes={lunes} setLunes={setLunes} />}
            {pestana === "recetas" && <Recetas {...comun} />}
            {pestana === "equilibrio" && <Equilibrio {...comun} />}
            {pestana === "guia" && <Guia />}
            {pestana === "ajustes" && <Ajustes {...comun} estado={estado} />}
          </main>
        )}
      </div>

      <nav className="barra-inferior" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <button key={p.clave} className={pestana === p.clave ? "on" : ""} onClick={() => setPestana(p.clave)}>
            <p.icono size={20} /> {p.nombre}
          </button>
        ))}
      </nav>

      {recetaAbierta && (
        <RecetaHoja
          {...comun}
          inicial={recetaAbierta.receta}
          editarInicial={recetaAbierta.editar}
          alGuardar={recetaAbierta.alGuardar}
          onCerrar={() => setRecetaAbierta(null)}
        />
      )}

      <div className="avisos" aria-live="polite">
        {estado.avisos.map((a) => <div key={a.id} className={"aviso " + a.tipo}>{a.texto}</div>)}
      </div>
    </div>
  );
}

function EstadoSincro({ estado }) {
  let clase = "", texto = "Guardado";
  if (estado.sesionCaducada) { clase = "mal"; texto = "Sesión caducada"; }
  else if (estado.pendientes && estado.sinConexion) { clase = "pend"; texto = `${estado.pendientes} sin subir · sin conexión`; }
  else if (estado.pendientes) { clase = "pend"; texto = "Guardando…"; }
  else if (estado.sinConexion) { clase = "pend"; texto = "Sin conexión"; }
  else if (estado.error) { clase = "mal"; texto = "Error al cargar"; }
  else if (estado.cargando) { texto = "Actualizando…"; }
  return (
    <button className="btn fantasma mini sincro" onClick={() => { vaciarCola(); cargar({ forzar: true }); }} title="Sincronizar ahora">
      <span className={"punto " + clase} /> {texto}
    </button>
  );
}
