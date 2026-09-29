/* Fechas como texto AAAA-MM-DD. La aritmética va en UTC para que el cambio de hora no mueva días. */

const dos = (n) => String(n).padStart(2, "0");
const utc = (s) => new Date(s + "T00:00:00Z");
const texto = (d) => d.toISOString().slice(0, 10);

export const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`; };
export const sumaDias = (s, n) => { const d = utc(s); d.setUTCDate(d.getUTCDate() + n); return texto(d); };
export const diaSemana = (s) => (utc(s).getUTCDay() + 6) % 7;            // 0 = lunes … 6 = domingo
export const lunesDe = (s) => sumaDias(s, -diaSemana(s));
export const diasDe = (lunes) => Array.from({ length: 7 }, (_, i) => sumaDias(lunes, i));
export const diasEntre = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);

/* Semana ISO 8601: la que contiene el jueves */
export function semanaISO(s) {
  const jueves = sumaDias(lunesDe(s), 3);
  const año = Number(jueves.slice(0, 4));
  const primerJueves = sumaDias(lunesDe(`${año}-01-04`), 3);
  return { año, semana: 1 + Math.round(diasEntre(primerJueves, jueves) / 7) };
}

/* Lunes de todas las semanas ISO de un año */
export function lunesDelAño(año) {
  const lista = [];
  for (let l = lunesDe(`${año}-01-04`); semanaISO(l).año === año; l = sumaDias(l, 7)) lista.push(l);
  return lista;
}

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_CORTOS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const nombreDia = (s, corto = false) => (corto ? DIAS_CORTOS : DIAS)[diaSemana(s)];
export const nombreMes = (m, corto = false) => (corto ? MESES_CORTOS : MESES)[m];
export const diaMes = (s) => Number(s.slice(8, 10));
export const fechaLarga = (s) => `${nombreDia(s)} ${diaMes(s)} de ${MESES[Number(s.slice(5, 7)) - 1]}`;
export const fechaCorta = (s) => `${diaMes(s)} ${MESES_CORTOS[Number(s.slice(5, 7)) - 1]}`;

export function rangoSemana(lunes) {
  const dom = sumaDias(lunes, 6);
  const mismoMes = lunes.slice(5, 7) === dom.slice(5, 7);
  return mismoMes ? `${diaMes(lunes)}–${fechaCorta(dom)}` : `${fechaCorta(lunes)} – ${fechaCorta(dom)}`;
}

export function haceDias(n) {
  if (n <= 0) return "hoy";
  if (n === 1) return "ayer";
  if (n < 14) return `hace ${n} días`;
  if (n < 60) return `hace ${Math.round(n / 7)} semanas`;
  return `hace ${Math.round(n / 30)} meses`;
}

export const mayuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
