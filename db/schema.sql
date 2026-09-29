-- ============================================================
--  Comida · esquema Postgres (Neon)
--
--  Idempotente: se puede ejecutar tantas veces como haga falta.
--  Las claves de grupos y subfamilias (legumbres, lentejas, hoja_verde…)
--  viven en src/catalogo.mjs; aquí se guardan como texto.
--  Sin funciones ni disparadores: actualizado_en lo pone la API.
-- ============================================================

-- ---------- Recetas ----------
--  grupo        tipo de plato: legumbres, pescado_azul, … , verdura, desayuno, otro
--  componentes  raciones que cuenta al comerla (claves de subfamilia; repetir = 2 raciones)
create table if not exists recetas (
  id              uuid primary key,
  nombre          text not null,
  grupo           text not null,
  subfamilia      text,
  momentos        text[] not null default '{comida,cena}',
  componentes     text[] not null default '{}',
  ingredientes    text not null default '',
  pasos           text not null default '',
  raciones        smallint,
  minutos         smallint,
  enlace          text,
  etiquetas       text[] not null default '{}',
  favorita        boolean not null default false,
  nota            text not null default '',
  creado_por      text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  borrado_en      timestamptz                                -- borrado lógico: el historial la sigue nombrando
);

-- ---------- Plan: un hueco por día y momento ----------
--  grupo  qué toca: legumbres, pescado_azul, …, libre, desayuno o fuera
create table if not exists huecos (
  fecha           date not null,
  momento         text not null check (momento in ('desayuno','comida','cena')),
  grupo           text not null,
  subfamilia      text,                                      -- sugerencia dentro del grupo (lentejas, azul_pequeno…)
  receta_id       uuid references recetas(id),
  guarnicion_id   uuid references recetas(id),               -- verdura de acompañamiento o primer plato
  fijo            boolean not null default false,            -- no se mueve al rehacer el reparto
  actualizado_en  timestamptz not null default now(),
  primary key (fecha, momento)
);

-- ---------- Registro: lo que comiste de verdad ----------
--  origen  plan    comí lo planeado
--          receta  otra receta guardada
--          libre   otra cosa (descripción)
--          fuera   comí fuera de casa
--          nada    me la salté
--  componentes es una foto de lo que se comió: si luego cambias la receta, el historial no cambia.
create table if not exists registro (
  fecha           date not null,
  momento         text not null check (momento in ('desayuno','comida','cena','otros')),
  origen          text not null check (origen in ('plan','receta','libre','fuera','nada')),
  receta_id       uuid references recetas(id),
  guarnicion_id   uuid references recetas(id),
  descripcion     text not null default '',
  componentes     text[] not null default '{}',
  nota            text not null default '',
  creado_por      text,
  actualizado_en  timestamptz not null default now(),
  primary key (fecha, momento)
);
create index if not exists ix_registro_receta on registro (receta_id) where receta_id is not null;

-- ---------- Ajustes (reparto semanal, preferencias…) ----------
create table if not exists ajustes (
  clave           text primary key,
  valor           jsonb not null,
  actualizado_en  timestamptz not null default now()
);

-- ---------- Tres desayunos de partida (se pueden borrar; no vuelven) ----------
insert into recetas (id, nombre, grupo, momentos, componentes, ingredientes, nota) values
  ('00000000-0000-4000-8000-00000000d001', 'Tostada integral con tomate y aceite', 'desayuno', '{desayuno}', '{pan,rojas}',
   E'Pan integral\nTomate rallado\nAceite de oliva virgen extra\n(opcional) queso fresco o un huevo', 'Añade queso fresco o huevo según el día.'),
  ('00000000-0000-4000-8000-00000000d002', 'Yogur natural con fruta y frutos secos', 'desayuno', '{desayuno}', '{leche_yogur,otras_frutas,nueces}',
   E'Yogur natural\nFruta de temporada\nUn puñado de nueces o almendras', 'Cambia la fruta y el fruto seco en el registro si toca otro.'),
  ('00000000-0000-4000-8000-00000000d003', 'Avena con leche y fruta', 'desayuno', '{desayuno}', '{avena,leche_yogur,otras_frutas}',
   E'Copos de avena\nLeche o bebida vegetal enriquecida\nFruta (plátano, frutos rojos, manzana…)', '')
on conflict (id) do nothing;
