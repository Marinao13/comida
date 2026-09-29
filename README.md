# Comida

Plan semanal por grupos de alimentos, recetario propio y registro de lo que comes de verdad,
para ver a lo largo del año cómo de equilibrado vas. Sale de la conversación sobre comer mejor
(frecuencias de AESAN 2022 con las notas de OMS, WCRF y el estudio de *Circulation* de 2021).

Mismo esquema que `cartilla-v2`: un Worker de Cloudflare que sirve la app y la API, datos en
Postgres (Neon), entrada protegida con Cloudflare Access. Todo en planes gratuitos.

## Qué hace

| Pestaña | Para qué |
|---|---|
| **Semana** | Reparte las 14 comidas y cenas por grupos (por defecto 4 legumbres, 2 pescado azul, 2 blanco o marisco, 2 carne blanca, 1 roja, 2 huevos y 1 libre) sin repetir grupo el mismo día, con las legumbres a mediodía y una pista de subfamilia que rota (lentejas, garbanzos, alubias…). Cada hueco se puede cambiar, fijar (candado) o intercambiar. **Rellenar con recetas** pone tus recetas en los huecos vacíos y una verdura de acompañamiento donde el plato no la trae. |
| **Hoy** | Un toque en **Lo comí** apunta lo planeado; si no, **Otra cosa**, **Fuera** o **Me la salté**. Abajo, la fruta, los frutos secos o el yogur de entre horas, un toque por ración. |
| **Recetas** | Tu recetario. Escribes los ingredientes y la app detecta qué raciones aporta (garbanzos, pescado blanco, hoja verde…); las ajustas a mano si hace falta. Con eso se sugieren para cada hueco y se cuenta lo que comes. Si empiezas de cero, hay ideas por grupo. |
| **Equilibrio** | La semana frente a los objetivos y el año entero: un mapa de semanas por grupo (en objetivo, por debajo, por encima), la evolución con media de 4 semanas y un resumen en tabla. |
| **Guía** | El catálogo de la conversación: grupos, subfamilias, frecuencias, qué aporta cada alimento, límites y fuentes. Con buscador. |
| **Ajustes** | El reparto semanal, preferencias del reparto y exportar una copia en JSON. |

**Sugerencias.** Para cada hueco se puntúan tus recetas: que sean de la subfamilia que toca, que
no las hayas hecho hace poco, que no estén ya esa semana, que aporten las verduras que le faltan
al plan (hoja verde, crucíferas, naranjas, rojas) y si son favoritas. Cada sugerencia dice por qué.
Al rellenar, un plato sale como mucho dos veces por semana (cocinar el doble vale) y nunca dos veces el mismo día.

### Decisiones que conviene saber

- **Qué se cuenta.** Cada receta dice qué raciones aporta *por persona* (componentes). Ajo,
  cebolla y puerro como base de cocina no suman verdura. El huevo se cuenta por unidades.
  Lo que apuntas guarda una foto de las raciones: si luego cambias la receta, el historial no cambia.
- **Objetivos con número donde la conversación decía "lo mínimo".** Para poder colorear:
  carne procesada ≤1/sem, pez espada/atún rojo/cazón ≤1 al mes, huevos ≤4/sem (AESAN; la
  evidencia admite hasta uno al día), patata ≤3/sem. Cereales, lácteos y patata son orientativos.
- **Una semana cuenta** en el año cuando tiene al menos 7 de sus 14 comidas y cenas apuntadas.
- **Una sola persona.** Los datos son de quien entra (queda el correo en `creado_por`), sin separar
  por persona. Si algún día lo usáis dos, hay que añadir la persona al registro.
- **El catálogo vive en el código** (`src/catalogo.mjs`), no en la base: cambiar una frecuencia es
  editar ese archivo y desplegar.
- **Sin red o con el servidor caído, no se pierde nada.** Cada cambio se ve al momento, espera en
  una cola del aparato y se reintenta cada vez más espaciado. Solo se tira si el servidor lo
  rechaza por inválido, o si tú lo descartas en Ajustes. Limitación conocida: con dos pestañas
  abiertas a la vez *y sin conexión*, una puede pisar la cola de la otra.

## Probar en local · sin Neon ni Cloudflare

```bash
npm install
npm run build          # empaqueta la interfaz en public/app.js
npm run demo           # datos inventados (recetas y meses de registro) · http://localhost:8790
npm run local          # tu base local, vacía · http://localhost:8790
```

La demo vive en `./.datos-demo` y la base local en `./.datos-local` (Postgres embebido, pglite);
ninguna toca Neon. Para empezar de cero, borra la carpeta. Mientras tocas la interfaz,
`npm run watch` recompila al guardar.

```bash
npm test                                                    # API contra Postgres, planificador y Worker
node sql.mjs "select * from registro order by fecha desc limit 10"
node sql.mjs --neon "select count(*) from recetas"          # contra Neon
```

## Estructura

```
comida/
├── src/
│   ├── catalogo.mjs         grupos, subfamilias, frecuencias y alimentos (lo comparten Worker y app)
│   ├── api.mjs              la API (misma en Worker y en local): recetas, huecos, semana, registro, ajustes
│   └── index.js             Worker: Cloudflare Access + Neon + assets
├── db/
│   ├── schema.sql           esquema Postgres (idempotente) + tres desayunos de partida
│   └── aplicar.mjs          aplica el esquema en Neon
├── app/
│   ├── planificador.js      reparto de la semana, sugerencias y relleno (puro, con pruebas)
│   ├── nutricion.js         recuento de raciones, objetivos y detección de ingredientes
│   ├── datos.js             tienda del navegador, cola de cambios persistente y sincronización
│   ├── fechas.js, ui.jsx, estilo.js, App.jsx
│   └── vistas/              Hoy, Semana, Recetas, Equilibrio, Guía, Ajustes
├── pruebas/                 node --test + datos de la demo
├── servidor-local.mjs       servidor de pruebas con pglite
├── build.mjs, iconos.mjs, sql.mjs, comprobar.mjs
├── public/                  index.html, manifest, iconos y el bundle generado
└── wrangler.jsonc           configuración del Worker "comida"
```

## Pasos que solo puedes dar tú (para pasar a producción)

1. **Base de datos en Neon.** Crea un proyecto nuevo (región europea). Si tu plan no te deja más
   proyectos, crea una base `comida` dentro del de la cartilla (Neon → Databases → New database):
   el código es el mismo. Copia la cadena de conexión en `.dev.vars` (copia `.dev.vars.example`) y:
   ```bash
   npm run esquema
   npx wrangler secret put DATABASE_URL
   ```
2. **Access para este Worker.** Zero Trust → Access → Applications → nueva aplicación
   *self-hosted* para `comida.<tu-subdominio>.workers.dev` (el mismo subdominio que la cartilla),
   misma política. Copia su *Application Audience (AUD) Tag* en `COMIDA_AUD` de `wrangler.jsonc`
   y revisa `COMIDA_PERMITIDOS`. Mientras `COMIDA_AUD` esté vacío, la API responde 500 y no abre.
3. **Desplegar.** `npm run comprobar` te dice qué falta; luego `npm run deploy`.
   Comprueba `/api/salud` y, ya dentro, `/api/salud/db`.

**Plan gratuito.** Toda la lógica pesada (reparto, sugerencias, recuentos) corre en el navegador;
el Worker solo lee y escribe filas. Guardar una semana entera va en una sola transacción (una
petición a Neon), lejos del límite de 50 subpeticiones. Son pocos KB al año: sobra con los
0,5 GB de Neon. Neon se duerme al rato sin uso, así que la primera carga del día tarda un poco más.

## Fases

- [x] **1.** Catálogo, esquema y API con pruebas contra Postgres
- [x] **2.** Reparto semanal, sugerencias y relleno con recetas
- [x] **3.** Interfaz: hoy, semana, recetas, equilibrio (semana y año), guía y ajustes · probada en local y en móvil
- [ ] **4.** Producción: Neon, Access, desplegar (pasos de arriba)
- [ ] Ideas: sugerencias con IA a partir de tus recetas (Workers AI tiene cuota gratuita), lista de
  la compra de la semana, copiar la semana anterior, abrir sin red (service worker), importar copia
