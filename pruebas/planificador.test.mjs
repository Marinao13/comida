import { test } from "node:test";
import assert from "node:assert/strict";
import { generarReparto, penalizacion, cuentaGrupos, rellenarSemana, sugerir, usosRecetas, claveHueco, balancePlan } from "../app/planificador.js";
import { detectar, componentesPropuestos, contar, estado, grupoSugerido, resumenAño, semanaValida } from "../app/nutricion.js";
import { semanaISO, lunesDe, lunesDelAño, sumaDias } from "../app/fechas.js";
import { repartoPorDefecto, GRUPOS } from "../src/catalogo.mjs";

const LUNES = "2026-09-28";
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("fechas: semanas ISO y lunes", () => {
  assert.equal(lunesDe("2026-10-04"), "2026-09-28");
  assert.equal(lunesDe("2026-09-28"), "2026-09-28");
  assert.deepEqual(semanaISO("2026-01-01"), { año: 2026, semana: 1 });
  assert.deepEqual(semanaISO("2027-01-01"), { año: 2026, semana: 53 });
  assert.equal(lunesDelAño(2026).length, 53);
  assert.equal(lunesDelAño(2025).length, 52);
  assert.equal(sumaDias("2026-03-28", 2), "2026-03-30"); // cambio de hora
});

test("reparto por defecto: 14 huecos con las cantidades pedidas y sin repetir grupo en el día", () => {
  const huecos = generarReparto({ lunes: LUNES, reparto: repartoPorDefecto(), semilla: 7 });
  const principales = huecos.filter((h) => h.momento !== "desayuno");
  assert.equal(principales.length, 14);
  assert.equal(huecos.filter((h) => h.momento === "desayuno").length, 7);
  assert.deepEqual(cuentaGrupos(huecos), repartoPorDefecto());
  for (let d = 0; d < 7; d++) {
    const dia = principales.filter((h) => h.fecha === sumaDias(LUNES, d));
    assert.notEqual(dia[0].grupo, dia[1].grupo, `día ${d} repite ${dia[0].grupo}`);
  }
  // las legumbres, a mediodía
  assert.ok(principales.filter((h) => h.grupo === "legumbres").every((h) => h.momento === "comida"));
  // pistas de subfamilia: las cuatro legumbres distintas
  const legs = principales.filter((h) => h.grupo === "legumbres").map((h) => h.subfamilia).sort();
  assert.deepEqual(legs, ["alubias", "garbanzos", "lentejas", "otras_legumbres"]);
});

test("reparto: reproducible con la misma semilla y respeta los fijos", () => {
  const a = generarReparto({ lunes: LUNES, reparto: repartoPorDefecto(), semilla: 3 });
  const b = generarReparto({ lunes: LUNES, reparto: repartoPorDefecto(), semilla: 3 });
  assert.deepEqual(a, b);
  const actuales = new Map([
    [claveHueco("2026-10-02", "cena"), { fecha: "2026-10-02", momento: "cena", grupo: "fuera", fijo: true }],
    [claveHueco("2026-10-03", "cena"), { fecha: "2026-10-03", momento: "cena", grupo: "fuera", fijo: true }],
    [claveHueco("2026-09-28", "comida"), { fecha: "2026-09-28", momento: "comida", grupo: "pescado_azul", subfamilia: "azul_otro", receta_id: uuid(9), fijo: true }],
  ]);
  const c = generarReparto({ lunes: LUNES, reparto: repartoPorDefecto(), semilla: 3, actuales });
  const n = cuentaGrupos(c);
  assert.equal(n.fuera, 2);
  assert.equal(n.pescado_azul, 2, "el fijo cuenta dentro del reparto");
  assert.equal(n.libre, undefined, "con dos huecos menos se quita primero el libre…");
  assert.equal(n.carne_roja, undefined, "…y luego la carne roja");
  assert.equal(c.find((h) => h.fecha === "2026-09-28" && h.momento === "comida").receta_id, uuid(9));
});

test("penalización: repetir grupo el mismo día cuesta más que en días distintos", () => {
  const base = ["legumbres", "huevos", "legumbres", "pescado_azul", "legumbres", "carne_blanca", "legumbres", "pescado_blanco", "carne_roja", "pescado_azul", "pescado_blanco", "huevos", "carne_blanca", "libre"];
  const malo = [...base]; [malo[1], malo[2]] = [malo[2], malo[1]];
  assert.ok(penalizacion(malo) > penalizacion(base));
});

test("detectar componentes en los ingredientes", () => {
  const d = detectar("200 g de lentejas pardinas\n1 zanahoria\n1 pimiento rojo y 1 pimiento verde\nCebolla y ajo\nCaldo de pollo\nNuez moscada\nPipas de calabaza");
  assert.deepEqual(d.map((x) => x.clave), ["lentejas", "naranjas", "rojas", "otras_verduras", "ajo_cebolla", "otros_frutos_secos"]);
  assert.deepEqual(componentesPropuestos("4 huevos\npatatas", "huevos"), ["huevo", "huevo", "patata_boniato"]);
  assert.equal(detectar("coliflor").map((x) => x.clave)[0], "cruciferas");
  assert.equal(grupoSugerido(["naranjas", "garbanzos"]), "legumbres");
  assert.equal(grupoSugerido(["hoja_verde", "rojas"]), "verdura");
});

test("contar y estado: la base (ajo, cebolla) no suma verdura; los totales mezclan familias", () => {
  const c = contar([["lentejas", "naranjas", "ajo_cebolla"], ["azul_pequeno", "hoja_verde"], ["blanco"], ["huevo", "huevo"]]);
  assert.equal(c.fam.verduras, 2);
  assert.equal(c.tot.pescado_total, 2);
  assert.equal(c.fam.huevos, 2);
  assert.equal(estado(2, { min: 3 }), "falta");
  assert.equal(estado(4, { max: 3 }), "alto");
  assert.equal(estado(3, { min: 3 }), "ok");
  assert.equal(estado(5, null), null);
});

test("sugerencias: prefiere la subfamilia que toca, evita repetir y rellena sin duplicar", () => {
  const recetas = [
    { id: uuid(1), nombre: "Lentejas estofadas", grupo: "legumbres", subfamilia: "lentejas", momentos: ["comida"], componentes: ["lentejas", "naranjas"] },
    { id: uuid(2), nombre: "Garbanzos con espinacas", grupo: "legumbres", subfamilia: "garbanzos", momentos: ["comida", "cena"], componentes: ["garbanzos", "hoja_verde"] },
    { id: uuid(3), nombre: "Brócoli al horno", grupo: "verdura", momentos: ["comida", "cena"], componentes: ["cruciferas"] },
    { id: uuid(4), nombre: "Ensalada", grupo: "verdura", momentos: ["comida", "cena"], componentes: ["hoja_verde", "rojas"] },
    { id: uuid(5), nombre: "Sardinas", grupo: "pescado_azul", subfamilia: "azul_pequeno", momentos: [], componentes: ["azul_pequeno"] },
  ];
  const hueco = { fecha: LUNES, momento: "comida", grupo: "legumbres", subfamilia: "garbanzos" };
  const s = sugerir({ hueco, recetas, semana: [hueco] });
  assert.equal(s[0].receta.id, uuid(2));
  assert.ok(s[0].motivos.includes("toca garbanzos"));
  // en la cena no se sugieren las lentejas (solo comida)
  assert.ok(!sugerir({ hueco: { ...hueco, momento: "cena" }, recetas, semana: [] }).some((x) => x.receta.id === uuid(1)));
  // si la comiste hace 3 días, baja
  const usos = usosRecetas([{ fecha: sumaDias(LUNES, -3), receta_id: uuid(2) }], []);
  const s2 = sugerir({ hueco: { ...hueco, subfamilia: null }, recetas, semana: [], usos });
  assert.equal(s2[0].receta.id, uuid(1));

  const semana = generarReparto({ lunes: LUNES, reparto: repartoPorDefecto(), semilla: 1, desayunos: [] });
  const llena = rellenarSemana({ semana, recetas, semilla: 1 });
  const legs = llena.filter((h) => h.grupo === "legumbres");
  assert.ok(legs.every((h) => h.receta_id), "todas las legumbres con receta");
  const azul = llena.filter((h) => h.grupo === "pescado_azul");
  assert.ok(azul.every((h) => h.receta_id === uuid(5)), "solo hay una receta de azul: se repite (máx. 2) antes que dejar el hueco vacío");
  const veces = {};
  for (const h of llena) if (h.receta_id) veces[h.receta_id] = (veces[h.receta_id] || 0) + 1;
  assert.ok(Object.values(veces).every((n) => n <= 2), "ninguna receta más de dos veces: " + JSON.stringify(veces));
  assert.ok(!llena.some((h) => h.grupo === "libre" && h.receta_id), "el libre no se rellena con legumbres ya repetidas");
  assert.ok(azul.every((h) => h.guarnicion_id), "las sardinas (sin verdura) llevan guarnición");
  assert.ok(llena.filter((h) => h.receta_id === uuid(1)).every((h) => !h.guarnicion_id), "las lentejas ya traen zanahoria: sin guarnición");
  const bal = balancePlan(llena, Object.fromEntries(recetas.map((r) => [r.id, r])));
  assert.ok(bal.fam.legumbres >= 4);
  assert.ok(GRUPOS.length === 7);
});

test("resumen del año: cobertura de semanas", () => {
  const registro = [];
  for (let d = 0; d < 7; d++) for (const momento of ["comida", "cena"]) registro.push({ fecha: sumaDias(LUNES, d), momento, origen: "plan", componentes: ["lentejas"] });
  const año = resumenAño(registro, 2026);
  const semana = año.find((s) => s.lunes === LUNES);
  assert.equal(semana.comidas, 14);
  assert.ok(semanaValida(semana));
  assert.equal(semana.conteo.fam.legumbres, 14);
  assert.ok(!semanaValida(año[0]));
});
