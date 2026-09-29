/* Empaqueta la app (React + Recharts + lucide) en public/app.js
   Uso: node build.mjs            → producción (minificado)
        node build.mjs --watch    → recompila al guardar                                         */
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const opciones = {
  entryPoints: ["app/main.jsx"],
  bundle: true,
  outfile: "public/app.js",
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(opciones);
  await ctx.watch();
  console.log("vigilando app/ … (Ctrl+C para salir)");
} else {
  await esbuild.build(opciones);
}
