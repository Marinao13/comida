/* ============================================================
   Comida · Worker de Cloudflare

   · /api/salud            → { ok } sin autenticación
   · /api/*                → Cloudflare Access (JWT verificado) + API de datos en Neon
   · resto                 → la app (assets estáticos de ./public)

   Secretos y variables (wrangler.jsonc / wrangler secret put):
     DATABASE_URL          cadena de conexión de Neon (secreto)
     COMIDA_TEAM_DOMAIN    https://<equipo>.cloudflareaccess.com
     COMIDA_AUD            AUD de la aplicación de Access de ESTE Worker
     COMIDA_PERMITIDOS     correos permitidos separados por comas (opcional)
   ============================================================ */

import { neon } from "@neondatabase/serverless";
import { crearApi } from "./api.mjs";

/* ===== Cloudflare Access: verificar la firma del JWT contra las claves del equipo ===== */
const b64url = (s) => {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const jsonDe = (parte) => JSON.parse(new TextDecoder().decode(b64url(parte)));

let cacheJwks = { url: "", claves: null, hasta: 0 };
let ultimaRecarga = 0;
async function traeJwks(teamDomain, forzar = false) {
  const url = teamDomain.replace(/\/+$/, "") + "/cdn-cgi/access/certs";
  const ahora = Date.now();
  if (!forzar && cacheJwks.url === url && cacheJwks.claves && cacheJwks.hasta > ahora) return cacheJwks.claves;
  const r = await fetch(url);
  if (!r.ok) throw new Error("no se pudo leer el JWKS de Access");
  const d = await r.json();
  cacheJwks = { url, claves: d.keys || [], hasta: ahora + 3600e3 };
  return cacheJwks.claves;
}

export async function verificaAccess(token, teamDomain, aud) {
  if (!token || !teamDomain || !aud) return null;
  try {
    const trozos = String(token).split(".");
    if (trozos.length !== 3) return null;
    const cab = jsonDe(trozos[0]);
    if (cab.alg !== "RS256") return null;
    let jwk = (await traeJwks(teamDomain)).find((k) => k.kid === cab.kid);
    if (!jwk && Date.now() - ultimaRecarga > 60e3) {             // claves rotadas
      ultimaRecarga = Date.now();
      jwk = (await traeJwks(teamDomain, true)).find((k) => k.kid === cab.kid);
    }
    if (!jwk) return null;
    const clave = await crypto.subtle.importKey("jwk", { ...jwk, key_ops: ["verify"], ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const firmado = new TextEncoder().encode(trozos[0] + "." + trozos[1]);
    if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", clave, b64url(trozos[2]), firmado))) return null;
    const p = jsonDe(trozos[1]);
    const ahora = Math.floor(Date.now() / 1000);
    if (p.exp && p.exp < ahora - 60) return null;
    if (p.nbf && p.nbf > ahora + 60) return null;
    if (p.iss !== teamDomain.replace(/\/+$/, "")) return null;
    const auds = Array.isArray(p.aud) ? p.aud : [p.aud];
    if (!auds.includes(aud)) return null;
    return p;
  } catch (e) { return null; }
}

/* Devuelve el correo de quien llama, o una Response de error si no puede entrar */
async function quienLlama(req, env) {
  if (!env.COMIDA_TEAM_DOMAIN || !env.COMIDA_AUD) {
    return Response.json({ error: "Access mal configurado en el servidor (falta COMIDA_AUD)" }, { status: 500 });
  }
  const cookie = (req.headers.get("cookie") || "").match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  const jwt = req.headers.get("cf-access-jwt-assertion") || (cookie && cookie[1]);
  const p = await verificaAccess(jwt, env.COMIDA_TEAM_DOMAIN, env.COMIDA_AUD);
  if (!p || !p.email) return Response.json({ error: "no autorizado" }, { status: 401 });
  const permitidos = String(env.COMIDA_PERMITIDOS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (permitidos.length && !permitidos.includes(String(p.email).toLowerCase())) {
    return Response.json({ error: "esta cuenta no tiene acceso" }, { status: 403 });
  }
  return p.email;
}

const sinCache = (res) => { const r = new Response(res.body, res); r.headers.set("cache-control", "no-store"); return r; };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/api/salud") return Response.json({ ok: true, app: "comida" });

    if (url.pathname.startsWith("/api/")) {
      const quien = await quienLlama(req, env);
      if (quien instanceof Response) return sinCache(quien);
      if (!env.DATABASE_URL) return sinCache(Response.json({ error: "falta el secreto DATABASE_URL" }, { status: 500 }));
      const conexion = neon(env.DATABASE_URL);
      const api = crearApi({
        sql: (texto, params) => conexion.query(texto, params || []),
        // varias sentencias en UNA petición HTTP y una transacción (el plan gratuito corta a 50 subpeticiones)
        lote: (stmts) => conexion.transaction((txn) => stmts.map((s) => txn.query(s.sql, s.params || []))),
      });
      return api(req, quien);
    }

    return env.ASSETS.fetch(req);
  },
};
