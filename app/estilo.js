/* ================= ESTILO — cocina tranquila (CSS propio, sin frameworks) ================= */
export const CSS = `
:root{
  --papel:#F5F3EC; --carta:#FFFFFF; --tinta:#1D2A22; --tinta2:#12201A; --lapiz:#5D6760; --tenue:#8A918B;
  --linea:#E5E2D8; --linea2:#CFCABD; --hoja:#2F6B45; --hoja-s:#E3EFE6;
  --ok:#0ca30c; --falta:#fab219; --alto:#ec835a; --critico:#d03b3b; --pocos:#DAD6CB;
  --serie1:#2a78d6; --serie2:#eb6834;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --radio:12px;
}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;background:var(--papel)}
.app{color:var(--tinta);font-family:var(--sans);font-size:14.5px;line-height:1.45;min-height:100vh;-webkit-font-smoothing:antialiased}
.app button{font-family:inherit}
.envoltura{max-width:1120px;margin:0 auto;padding:18px 20px 96px}
.app h1,.app h2,.app h3,.app h4{margin:0;font-weight:700;line-height:1.2}
.app h2{font-size:19px}
.app h3{font-size:15.5px}
.app a{color:var(--hoja)}
.num{font-variant-numeric:tabular-nums}
.lapiz{color:var(--lapiz)} .tenue{color:var(--tenue)}
.peq{font-size:12.5px}
.fila{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fila.entre{justify-content:space-between}
.crece{flex:1;min-width:0}
.pila>*+*{margin-top:14px}
.pila-g>*+*{margin-top:22px}
.oculto-movil{} .solo-movil{display:none}

/* cabecera */
.cabecera{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:12px;border-bottom:2px solid var(--tinta)}
.marca{display:flex;align-items:center;gap:10px}
.marca .logo{width:34px;height:34px;border-radius:10px;background:var(--hoja);display:grid;place-items:center;color:#fff}
.marca .titulo{font-size:21px;font-weight:800;letter-spacing:.02em}
.marca .sub{font-size:12px;color:var(--lapiz)}
.sincro{font-size:12px;color:var(--lapiz);display:flex;align-items:center;gap:6px}
.sincro .punto{width:8px;height:8px;border-radius:50%;background:var(--ok)}
.sincro .punto.pend{background:var(--falta)} .sincro .punto.mal{background:var(--critico)}

/* pestañas */
.pestanas{display:flex;gap:2px;margin:14px 0 18px;border-bottom:1px solid var(--linea2);overflow-x:auto;overflow-y:hidden}
.pestanas button{appearance:none;background:none;border:none;cursor:pointer;font-size:13.5px;font-weight:650;color:var(--lapiz);
  padding:9px 14px 11px;border-bottom:2.5px solid transparent;margin-bottom:-1px;white-space:nowrap;display:flex;align-items:center;gap:7px}
.pestanas button:hover{color:var(--tinta)}
.pestanas button.on{color:var(--tinta);border-bottom-color:var(--tinta)}
.barra-inferior{display:none}

/* tarjetas */
.tarjeta{background:var(--carta);border:1px solid var(--linea);border-radius:var(--radio);padding:14px 16px;box-shadow:0 1px 2px rgba(29,42,34,.05)}
.tarjeta.densa{padding:11px 13px}
.tarjeta.plana{box-shadow:none}
.ojal{font-size:11px;font-weight:750;letter-spacing:.09em;text-transform:uppercase;color:var(--lapiz)}
.nota{font-size:12.5px;color:var(--lapiz)}
.rejilla-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
.rejilla-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:start}
.rejilla-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;align-items:stretch}
.rejilla-2>*,.rejilla-3>*,.rejilla-auto>*{min-width:0}

/* botones y campos */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-weight:600;font-size:13.5px;border-radius:10px;padding:8px 13px;
  border:1px solid var(--linea2);background:#fff;color:var(--tinta);cursor:pointer;line-height:1.2;text-decoration:none;white-space:nowrap}
.btn:hover{background:#F7F6F1}
.btn:disabled{opacity:.45;cursor:default}
.btn.primario{background:var(--tinta);color:#fff;border-color:var(--tinta)}
.btn.primario:hover{background:#000}
.btn.verde{background:var(--hoja);border-color:var(--hoja);color:#fff}
.btn.verde:hover{background:#245737}
.btn.peligro{color:var(--critico);border-color:#EBC5C0}
.btn.fantasma{border-color:transparent;background:none}
.btn.fantasma:hover{background:rgba(29,42,34,.06)}
.btn.mini{padding:5px 9px;font-size:12.5px;border-radius:8px}
.btn.icono{padding:6px;border-color:transparent;background:none;color:var(--lapiz)}
.btn.icono:hover{background:rgba(29,42,34,.07);color:var(--tinta)}
.btn.grande{padding:12px 18px;font-size:15px;border-radius:12px}
.campo{font-family:inherit;background:#fff;border:1px solid var(--linea2);border-radius:10px;padding:9px 11px;font-size:15px;color:var(--tinta);width:100%}
textarea.campo{resize:vertical;min-height:90px;line-height:1.45}
.campo:focus,.btn:focus-visible,.pestanas button:focus-visible,.chip:focus-visible,.hueco:focus-visible{outline:2px solid var(--serie1);outline-offset:1px}
.etq{display:block;font-size:11px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--lapiz);margin-bottom:5px}
.seg{display:inline-flex;border:1px solid var(--linea2);border-radius:10px;overflow:hidden;background:#fff}
.seg button{appearance:none;border:none;background:#fff;padding:8px 14px;font-size:13.5px;font-weight:600;color:var(--lapiz);cursor:pointer;border-right:1px solid var(--linea)}
.seg button:last-child{border-right:none}
.seg button.on{background:var(--tinta);color:#fff}
.interruptor{display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:6px 0}
.interruptor input{width:18px;height:18px;margin:1px 0 0;accent-color:var(--hoja);flex:none}

/* pastillas de grupo y chips */
.pastilla{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap;line-height:1.35}
.pastilla .bola{width:7px;height:7px;border-radius:50%;flex:none}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:999px;border:1px solid var(--linea2);
  background:#fff;color:var(--tinta);cursor:pointer;line-height:1.3;white-space:nowrap}
.chip:hover{border-color:var(--tinta)}
.chip.on{background:var(--tinta);border-color:var(--tinta);color:#fff}
.chip.suave{background:#F3F1EA;border-color:transparent;cursor:default}
.chip .x{opacity:.55;cursor:pointer;display:inline-flex}
.chip .x:hover{opacity:1}
.chip .n{font-variant-numeric:tabular-nums;font-weight:750}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.contador{display:inline-flex;align-items:center;border:1px solid var(--linea2);border-radius:999px;background:#fff;overflow:hidden}
.contador button{border:none;background:none;padding:3px 8px;cursor:pointer;color:var(--lapiz);font-size:14px;line-height:1}
.contador button:hover{background:#F3F1EA;color:var(--tinta)}
.contador .et{font-size:12.5px;font-weight:600;padding:3px 2px}

/* estados (siempre icono + texto) */
.estado{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:650;color:var(--tinta);white-space:nowrap}
.estado .ic{width:17px;height:17px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;color:#fff;flex:none}
.estado.ok .ic{background:var(--ok)} .estado.falta .ic{background:var(--falta);color:var(--tinta)} .estado.alto .ic{background:var(--alto);color:var(--tinta)}
.estado.pocos .ic{background:var(--pocos);color:var(--tinta)}

/* barra de objetivo */
.objetivo{position:relative;height:10px;border-radius:99px;background:#EEECE5;overflow:hidden}
.objetivo .banda{position:absolute;top:0;bottom:0;background:rgba(12,163,12,.14);border-left:1px solid rgba(12,163,12,.55);border-right:1px solid rgba(12,163,12,.55)}
.objetivo .relleno{position:absolute;left:0;top:2px;bottom:2px;border-radius:0 4px 4px 0;background:var(--tinta)}
.objetivo .relleno.ok{background:var(--ok)} .objetivo .relleno.falta{background:#C98A00} .objetivo .relleno.alto{background:#D9643A}
.fila-objetivo{display:grid;grid-template-columns:minmax(120px,190px) 1fr 178px;gap:12px;align-items:center;padding:7px 0;border-bottom:1px solid var(--linea)}
.fila-objetivo:last-child{border-bottom:none}
.fila-objetivo .nom{font-weight:650;font-size:13.5px}
.fila-objetivo .cifra{font-variant-numeric:tabular-nums;font-size:12.5px;color:var(--lapiz);text-align:right;flex-wrap:nowrap;min-width:0}
.fila-objetivo .cifra .txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.fila-objetivo .cifra b{color:var(--tinta);font-size:14px}
.fila-objetivo.sub{padding:4px 0 4px 14px;border-bottom:none}
.fila-objetivo.sub .nom{font-weight:500;font-size:12.5px;color:var(--lapiz)}
.fila-objetivo.sub .objetivo{height:7px}

/* hoy */
.dia-nav{display:flex;align-items:center;gap:6px}
.dia-nav .fecha{font-size:18px;font-weight:750;min-width:0}
.comida-card{display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:start}
.comida-card .momento{font-weight:750;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--lapiz);padding-top:3px}
.plato{font-weight:650;font-size:15px}
.guarn{font-size:13px;color:var(--lapiz)}
.hecho{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;padding:8px 10px;border-radius:10px;background:#F3F7F2;border:1px solid #DCE9DD}
.hecho.otra{background:#FBF6EA;border-color:#EFE2C2}
.hecho.nada{background:#F3F2EE;border-color:var(--linea)}
.mini-cuenta{display:flex;flex-wrap:wrap;gap:16px}
.mini-cuenta .c{min-width:110px}
.mini-cuenta .c .v{font-size:20px;font-weight:700}
.rapidos{display:grid;grid-template-columns:110px 1fr;gap:8px 12px;align-items:center}

/* semana */
.semana-rejilla{display:grid;grid-template-columns:78px repeat(7,minmax(0,1fr));gap:6px}
.semana-rejilla .cab-dia{font-size:12px;font-weight:700;text-align:center;padding:4px 0;color:var(--lapiz);text-transform:capitalize}
.semana-rejilla .cab-dia.hoy{color:var(--tinta)}
.semana-rejilla .cab-dia.hoy span{background:var(--tinta);color:#fff;border-radius:999px;padding:1px 7px}
.semana-rejilla .cab-mom{font-size:11px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;color:var(--lapiz);align-self:center}
.hueco{appearance:none;text-align:left;width:100%;min-height:92px;background:#fff;border:1px solid var(--linea);border-radius:11px;padding:8px 9px 9px;cursor:pointer;
  display:flex;flex-direction:column;gap:5px;position:relative;color:var(--tinta);border-top-width:4px}
.hueco:hover{border-color:var(--linea2);box-shadow:0 2px 6px rgba(29,42,34,.08)}
.hueco.vacio{background:transparent;border-style:dashed;border-top-width:1px;color:var(--tenue);align-items:center;justify-content:center}
.hueco.pasado{opacity:.72}
.hueco.eleccion{outline:2px dashed var(--serie1);outline-offset:1px}
.hueco .gr{font-size:11px;font-weight:750;letter-spacing:.02em}
.hueco .pista{font-size:11.5px;color:var(--lapiz)}
.hueco .rec{font-size:12.5px;font-weight:600;line-height:1.25}
.hueco .rec.sin{font-weight:500;color:var(--tenue);font-style:italic}
.hueco .gu{font-size:11.5px;color:var(--lapiz);line-height:1.25}
.hueco .marcas{position:absolute;top:6px;right:6px;display:flex;gap:3px;color:var(--lapiz)}
.hueco .marcas .ok{color:var(--ok)}
.dia-movil{display:none}
.banner{border-radius:11px;padding:10px 13px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13.5px;background:#EAF1FB;border:1px solid #C9DBF3}
.banner.ambar{background:#FDF4DD;border-color:#F1DFA9}
.banner.rojo{background:#FBE9E7;border-color:#F1C9C3}

/* recetas */
.receta-card{appearance:none;text-align:left;background:#fff;border:1px solid var(--linea);border-radius:var(--radio);padding:12px 14px;cursor:pointer;
  display:flex;flex-direction:column;gap:7px;border-left-width:5px;color:var(--tinta);min-height:118px}
.receta-card:hover{box-shadow:0 2px 8px rgba(29,42,34,.08)}
.receta-card .nom{font-weight:700;font-size:14.5px;line-height:1.25}
.receta-card .meta{font-size:12px;color:var(--lapiz);margin-top:auto}
.comps{display:flex;flex-wrap:wrap;gap:4px}
.comp{font-size:11.5px;padding:1px 7px;border-radius:999px;background:#F2F0E9;color:var(--tinta);white-space:nowrap}
.comp.base{color:var(--tenue)}
.ideas{display:flex;flex-wrap:wrap;gap:6px}
.sugerencia{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border:1px solid var(--linea);border-radius:10px;background:#fff;cursor:pointer;text-align:left;width:100%;color:var(--tinta)}
.sugerencia:hover{border-color:var(--tinta)}
.sugerencia.on{border-color:var(--hoja);background:var(--hoja-s)}
.sugerencia .motivos{font-size:12px;color:var(--lapiz)}
.lista-sel{max-height:260px;overflow:auto;border:1px solid var(--linea);border-radius:10px;background:#fff}
.lista-sel button{display:flex;width:100%;text-align:left;gap:8px;align-items:center;padding:8px 11px;border:none;border-bottom:1px solid var(--linea);background:none;cursor:pointer;font-size:13.5px;color:var(--tinta)}
.lista-sel button:last-child{border-bottom:none}
.lista-sel button:hover{background:#F7F6F1}
.lista-sel button.on{background:var(--hoja-s);font-weight:650}
.texto-receta{white-space:pre-wrap;font-size:14px;line-height:1.55}

/* selector de componentes */
.selector .familias{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px}
.selector .familias button{appearance:none;border:1px solid var(--linea);background:#fff;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:650;color:var(--lapiz);cursor:pointer;white-space:nowrap}
.selector .familias button.on{background:var(--tinta);color:#fff;border-color:var(--tinta)}
.selector .subs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}

/* hoja (modal) */
.velo{position:fixed;inset:0;background:rgba(18,32,26,.42);z-index:50;display:flex;align-items:flex-start;justify-content:center;padding:5vh 16px;overflow:auto}
.hoja{background:var(--papel);border-radius:16px;width:100%;max-width:640px;box-shadow:0 18px 50px rgba(0,0,0,.25);display:flex;flex-direction:column;max-height:90vh}
.hoja.ancha{max-width:820px}
.hoja .cab-hoja{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-bottom:1px solid var(--linea)}
.hoja .cuerpo{padding:16px 18px;overflow:auto}
.hoja .pie{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:12px 18px;border-top:1px solid var(--linea);background:#fff;border-radius:0 0 16px 16px}

/* avisos */
.avisos{position:fixed;left:50%;transform:translateX(-50%);bottom:86px;z-index:80;display:flex;flex-direction:column;gap:6px;align-items:center;width:min(92vw,460px)}
.aviso{background:var(--tinta2);color:#fff;padding:10px 14px;border-radius:10px;font-size:13.5px;box-shadow:0 6px 20px rgba(0,0,0,.2)}
.aviso.error{background:#8E2A22}

/* equilibrio: mapa del año */
.mapa{overflow-x:auto}
.mapa table{border-collapse:separate;border-spacing:2px;font-size:11.5px}
.mapa th{font-weight:600;color:var(--lapiz);text-align:left;white-space:nowrap;padding-right:8px}
.mapa th.mes{font-weight:600;text-align:left;padding:0;width:13px;max-width:13px}
.mapa th.mes span{display:block;width:0;overflow:visible;white-space:nowrap}
.mapa td.celda{width:13px;min-width:13px;height:18px;border-radius:3px;background:#F0EEE7;cursor:default}
.mapa td.celda.ok{background:var(--ok)} .mapa td.celda.falta{background:var(--falta)} .mapa td.celda.alto{background:var(--alto)}
.mapa td.celda.pocos{background:repeating-linear-gradient(45deg,#E9E6DD 0 3px,#F5F3EC 3px 6px)}
.mapa td.celda.futuro{background:transparent;border:1px dashed #E3E0D6}
.mapa th[scope=row]{position:sticky;left:0;z-index:1;background:#fff;padding-right:10px}
.mapa tr.activa th{color:var(--tinta);font-weight:750}
.mapa tr.fam{cursor:pointer}
.mapa td.pct{padding-left:8px;font-variant-numeric:tabular-nums;color:var(--lapiz);white-space:nowrap}
.leyenda{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--lapiz)}
.leyenda span{display:inline-flex;align-items:center;gap:6px}
.leyenda i{width:12px;height:12px;border-radius:3px;display:inline-block}
.info-flotante{position:fixed;z-index:90;pointer-events:none;background:var(--tinta2);color:#fff;font-size:12px;padding:7px 9px;border-radius:8px;max-width:240px;line-height:1.4;box-shadow:0 6px 18px rgba(0,0,0,.2)}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.kpi{background:#fff;border:1px solid var(--linea);border-radius:12px;padding:10px 13px}
.kpi .l{font-size:12px;color:var(--lapiz)}
.kpi .v{font-size:22px;font-weight:700;margin-top:2px}
.tabla{width:100%;border-collapse:collapse;font-size:13px}
.tabla th{font-size:11px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:var(--lapiz);text-align:left;padding:6px 8px;border-bottom:1.5px solid var(--linea2);white-space:nowrap}
.tabla td{padding:6px 8px;border-bottom:1px solid var(--linea);vertical-align:top}
.tabla td.n,.tabla th.n{text-align:right;font-variant-numeric:tabular-nums}

/* guía */
.guia-fam{border-top:4px solid var(--linea2)}
.alimento{display:grid;grid-template-columns:minmax(140px,220px) 1fr;gap:10px;padding:5px 0;border-bottom:1px dotted var(--linea2);font-size:13px}
.alimento:last-child{border-bottom:none}
mark{background:#FFF0B3;color:inherit;border-radius:3px;padding:0 1px}

@media(max-width:900px){
  .rejilla-3{grid-template-columns:1fr 1fr}
  .kpis{grid-template-columns:1fr 1fr}
}
@media(max-width:760px){
  .envoltura{padding:12px 14px 110px}
  .rejilla-2,.rejilla-3{grid-template-columns:1fr}
  .pestanas{display:none}
  .barra-inferior{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:1px solid var(--linea2);
    padding:4px 4px calc(4px + env(safe-area-inset-bottom))}
  .barra-inferior button{flex:1;appearance:none;border:none;background:none;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;
    font-size:10.5px;font-weight:650;color:var(--lapiz);cursor:pointer;border-radius:8px}
  .barra-inferior button.on{color:var(--hoja);background:var(--hoja-s)}
  .semana-rejilla{display:none}
  .dia-movil{display:block}
  .dia-movil .huecos-dia{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  .hueco{min-height:84px}
  .comida-card{grid-template-columns:1fr;gap:6px}
  .fila-objetivo{grid-template-columns:1fr auto;gap:4px 10px}
  .fila-objetivo .objetivo{grid-column:1/-1;grid-row:2}
  .velo{padding:0;align-items:flex-end}
  .hoja,.hoja.ancha{max-width:none;border-radius:16px 16px 0 0;max-height:94vh}
  .hoja .pie{border-radius:0}
  .alimento{grid-template-columns:1fr;gap:2px}
  .rapidos{grid-template-columns:1fr}
  .oculto-movil{display:none} .solo-movil{display:initial}
}
`;
