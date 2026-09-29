/* ============================================================
   Datos de ejemplo para `npm run demo` (solo en local, base aparte)

   Recetas típicas y un registro inventado desde enero hasta ayer:
   la mayoría de comidas según el plan, alguna fuera, alguna saltada,
   fruta y frutos secos entre horas. Al principio del año se come algo
   menos pescado y verdura, para que la evolución se note.
   ============================================================ */

import { generarReparto, rellenarSemana, usosRecetas, azar, componentesHueco } from "../app/planificador.js";
import { repartoPorDefecto } from "../src/catalogo.mjs";
import { lunesDe, sumaDias, diasDe, hoyISO, lunesDelAño } from "../app/fechas.js";

const R = (n, nombre, grupo, componentes, extra = {}) => ({ id: `d0000000-0000-4000-8000-${String(n).padStart(12, "0")}`, nombre, grupo, componentes, momentos: ["comida", "cena"], ...extra });

export const RECETAS_DEMO = [
  R(1, "Lentejas estofadas con verduras", "legumbres", ["lentejas", "naranjas", "otras_verduras", "ajo_cebolla", "patata_boniato"], { momentos: ["comida"], minutos: 50, ingredientes: "Lentejas pardinas\nZanahoria\nPimiento verde\nCebolla y ajo\nPatata" }),
  R(2, "Garbanzos con espinacas", "legumbres", ["garbanzos", "hoja_verde", "ajo_cebolla"], { minutos: 25, favorita: true }),
  R(3, "Alubias blancas con almejas", "legumbres", ["alubias", "marisco", "ajo_cebolla"], { momentos: ["comida"], minutos: 40 }),
  R(4, "Dal de lentejas rojas", "legumbres", ["lentejas", "rojas", "ajo_cebolla", "arroz"], { minutos: 30 }),
  R(5, "Chili de alubias sin carne", "legumbres", ["alubias", "rojas", "naranjas", "ajo_cebolla"], { minutos: 40 }),
  R(6, "Ensalada de garbanzos", "legumbres", ["garbanzos", "rojas", "hoja_verde"], { minutos: 10 }),
  R(7, "Salteado de tofu con brócoli", "legumbres", ["otras_legumbres", "cruciferas", "arroz"], { minutos: 20 }),
  R(10, "Sardinas a la plancha", "pescado_azul", ["azul_pequeno"], { minutos: 15 }),
  R(11, "Salmón en papillote con verduras", "pescado_azul", ["azul_otro", "otras_verduras", "naranjas"], { minutos: 25, favorita: true }),
  R(12, "Caballa al horno con pimientos", "pescado_azul", ["azul_pequeno", "rojas"], { minutos: 30 }),
  R(13, "Ensalada de caballa en lata", "pescado_azul", ["azul_pequeno", "hoja_verde", "rojas"], { minutos: 10 }),
  R(20, "Merluza en salsa verde", "pescado_blanco", ["blanco", "patata_boniato", "ajo_cebolla"], { minutos: 30 }),
  R(21, "Mejillones al vapor", "pescado_blanco", ["marisco"], { minutos: 15 }),
  R(22, "Bacalao con tomate", "pescado_blanco", ["blanco", "rojas"], { minutos: 35 }),
  R(30, "Pollo asado con verduras", "carne_blanca", ["pollo_pavo", "naranjas", "otras_verduras", "patata_boniato"], { minutos: 60 }),
  R(31, "Fajitas de pollo", "carne_blanca", ["pollo_pavo", "rojas", "otras_verduras", "otros_cereales"], { minutos: 25, momentos: ["cena"] }),
  R(32, "Conejo al ajillo", "carne_blanca", ["conejo_aves", "ajo_cebolla"], { minutos: 45 }),
  R(40, "Albóndigas en salsa de tomate", "carne_roja", ["roja_magra", "rojas"], { minutos: 50 }),
  R(41, "Solomillo de cerdo a la plancha", "carne_roja", ["roja_magra"], { minutos: 20 }),
  R(50, "Tortilla de calabacín", "huevos", ["huevo", "huevo", "otras_verduras"], { minutos: 25, momentos: ["cena"] }),
  R(51, "Shakshuka", "huevos", ["huevo", "huevo", "rojas"], { minutos: 25 }),
  R(52, "Revuelto de setas", "huevos", ["huevo", "huevo", "otras_verduras"], { minutos: 15, momentos: ["cena"] }),
  R(60, "Pasta integral con verduras", "libre", ["pasta", "rojas", "otras_verduras"], { minutos: 20 }),
  R(61, "Pizza casera de verduras", "libre", ["pan", "rojas", "otras_verduras", "queso_fresco"], { minutos: 40, momentos: ["cena"] }),
  R(70, "Ensalada verde", "verdura", ["hoja_verde", "rojas"], { minutos: 5 }),
  R(71, "Brócoli al horno", "verdura", ["cruciferas"], { minutos: 20 }),
  R(72, "Crema de calabaza", "verdura", ["naranjas", "ajo_cebolla"], { minutos: 30 }),
  R(73, "Espinacas salteadas con ajo", "verdura", ["hoja_verde", "ajo_cebolla"], { minutos: 10 }),
  R(74, "Lombarda rehogada", "verdura", ["cruciferas"], { minutos: 25 }),
];

export async function sembrarDemo(api, quien) {
  const pide = async (metodo, ruta, cuerpo) => {
    const r = await api(new Request("http://local/api" + ruta, { method: metodo, headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) }), quien);
    if (!r.ok) throw new Error(`${metodo} ${ruta}: ${(await r.json()).error}`);
  };
  for (const r of RECETAS_DEMO) await pide("PUT", `/recetas/${r.id}`, r);

  const todo = await (await api(new Request("http://local/api/todo"), quien)).json();
  const recetas = todo.recetas;
  const porId = Object.fromEntries(recetas.map((r) => [r.id, r]));
  const desayunos = recetas.filter((r) => r.grupo === "desayuno");
  const principales = recetas.filter((r) => !["desayuno", "verdura", "otro"].includes(r.grupo));

  const hoy = hoyISO();
  const año = Number(hoy.slice(0, 4));
  const semanas = lunesDelAño(año).filter((l) => l <= lunesDe(hoy));
  const r = azar(2026);
  const registro = [], huecos = [];
  let apuntes = 0;

  for (const [iSemana, lunes] of semanas.entries()) {
    const progreso = Math.min(1, iSemana / 20);                     // de enero a mayo se va mejorando
    const semana = rellenarSemana({
      semana: generarReparto({ lunes, reparto: repartoPorDefecto(), semilla: iSemana + 1, desayunos }),
      recetas, usos: usosRecetas(registro, huecos), semilla: iSemana,
    });
    await pide("PUT", `/semana/${lunes}`, { huecos: semana });
    huecos.push(...semana);

    for (const fecha of diasDe(lunes)) {
      if (fecha >= hoy) continue;
      if (r() < 0.05) continue;                                      // días sin apuntar
      for (const h of semana.filter((x) => x.fecha === fecha)) {
        const x = r();
        let fila;
        const esPescado = h.grupo.startsWith("pescado");
        if (esPescado && r() > 0.55 + 0.45 * progreso) {
          fila = { origen: "fuera", descripcion: "Menú del día", componentes: ["pollo_pavo", "patata_boniato"] };
        } else if (x < 0.74) {
          fila = { origen: "plan", receta_id: h.receta_id, guarnicion_id: h.guarnicion_id, componentes: componentesHueco(h, porId) };
        } else if (x < 0.84 && h.momento !== "desayuno") {
          const otra = principales[Math.floor(r() * principales.length)];
          fila = { origen: "receta", receta_id: otra.id, componentes: [...otra.componentes] };
        } else if (x < 0.92) {
          fila = { origen: "fuera", descripcion: h.momento === "desayuno" ? "Café y tostada" : "Restaurante", componentes: h.momento === "desayuno" ? ["pan"] : [["blanco", "pollo_pavo", "roja_grasa", "procesada"][Math.floor(r() * 4)], "hoja_verde"] };
        } else if (x < 0.95) {
          fila = { origen: "nada", componentes: [] };
        } else continue;
        // verdura de más en las cenas cuando ya se va cogiendo el hábito
        if (fila.origen === "plan" && h.momento === "cena" && r() < 0.35 * progreso) fila.componentes.push(["hoja_verde", "cruciferas", "rojas"][Math.floor(r() * 3)]);
        const reg = { fecha, momento: h.momento, ...fila };
        await pide("PUT", `/registro/${fecha}/${h.momento}`, reg);
        registro.push(reg); apuntes++;
      }
      // entre horas: fruta, frutos secos, lácteos
      const otros = [];
      const frutas = Math.floor(r() * 3) + (r() < progreso ? 1 : 0);
      for (let i = 0; i < frutas; i++) { const y = r(); otros.push(y < 0.42 ? "vitamina_c" : y < 0.54 ? "bayas" : y < 0.68 ? "fruta_naranja" : "otras_frutas"); }
      if (r() < 0.3 + 0.4 * progreso) otros.push(r() < 0.6 ? "nueces" : r() < 0.5 ? "almendras" : "otros_frutos_secos");
      if (r() < 0.6) otros.push("leche_yogur");
      if (otros.length) { await pide("PUT", `/registro/${fecha}/otros`, { origen: "libre", componentes: otros }); apuntes++; }
    }
  }
  return { recetas: RECETAS_DEMO.length, semanas: semanas.length, apuntes };
}
