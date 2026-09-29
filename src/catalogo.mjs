/* ============================================================
   Catálogo de grupos de alimentos · la única fuente de verdad

   Sale de la conversación sobre comer mejor (AESAN 2022 + notas de
   WCRF, OMS y el estudio de Circulation 2021). Lo usan el Worker (para
   validar claves) y la app (plan, recetas, registro y equilibrio).

   Tres niveles:
     · FAMILIAS      grupos de alimentos con su frecuencia semanal
     · subfamilias   dentro de cada familia; son las "raciones" que se cuentan
     · alimentos     ejemplos con lo que aportan; sirven para detectar
                     subfamilias a partir de los ingredientes de una receta

   Objetivos siempre por SEMANA: { min, max } (cualquiera de los dos puede faltar).
   `texto` es cómo lo diría una persona; los números solo sirven para colorear.
   Las familias "diarias" llevan además `dia` para la vista de hoy.

   Una ración de cada componente = una vez que lo comes en una comida.
   Excepción: huevo, que se cuenta por unidades (una tortilla de 2 huevos = 2).
   ============================================================ */

export const MOMENTOS = [
  { clave: "desayuno", nombre: "Desayuno" },
  { clave: "comida", nombre: "Comida" },
  { clave: "cena", nombre: "Cena" },
];
// En el registro existe además "otros": postres, fruta entre horas, frutos secos…
export const MOMENTOS_REGISTRO = [...MOMENTOS, { clave: "otros", nombre: "Entre horas y postres" }];

const a = (nombres, aporta) => ({ nombres, aporta });

export const FAMILIAS = [
  /* ---------------- Platos principales (las 14 comidas y cenas) ---------------- */
  {
    clave: "legumbres", nombre: "Legumbres", tipo: "plato",
    objetivo: { min: 4 }, texto: "≥4 a la semana (puedes llegar a diario)", racion: "50–60 g en seco",
    rotar: "poco",
    nota: "Rota a tu gusto: todas aportan proteína, fibra, hierro, folato, magnesio y potasio; las diferencias son pequeñas. Acompáñalas de pimiento, tomate o un cítrico de postre para absorber mejor su hierro. Las de bote (enjuagadas) valen igual.",
    subfamilias: [
      { clave: "lentejas", nombre: "Lentejas", objetivo: { min: 1 }, texto: "1", alimentos: [
        a(["Lenteja pardina", "Lenteja castellana", "Lenteja beluga", "Lentejas"], "Hierro y folato; no necesitan remojo y se cuecen rápido"),
        a(["Lenteja roja"], "Pelada: se deshace en 15–20 min (cremas, dal)"),
      ] },
      { clave: "garbanzos", nombre: "Garbanzos", objetivo: { min: 1 }, texto: "1", alimentos: [
        a(["Garbanzos", "Hummus"], "Mucho folato; algo más de grasa y calorías"),
      ] },
      { clave: "alubias", nombre: "Alubias", objetivo: { min: 1 }, texto: "1, alternando blanca, pinta, roja y negra", alimentos: [
        a(["Alubia blanca", "Judión", "Fabes", "Alubias"], "Algo más de calcio que otras alubias"),
        a(["Alubia pinta"], "Mucho folato; polifenoles en la piel"),
        a(["Alubia roja"], "Polifenoles; siempre bien cocida (cruda o poco hecha es tóxica)"),
        a(["Alubia negra", "Frijoles"], "Antocianinas en la piel"),
        a(["Azukis", "Judía mungo"], "Parecidas a las demás alubias"),
      ] },
      { clave: "otras_legumbres", nombre: "Soja, guisantes, habas…", objetivo: null, texto: "comodín: repite una o prueba estas", alimentos: [
        a(["Tofu", "Tempeh", "Edamame", "Soja texturizada", "Soja"], "Proteína completa; el tofu cuajado con sulfato cálcico aporta mucho calcio"),
        a(["Altramuces"], "Muchísima proteína y fibra; enjuágalos de la salmuera"),
        a(["Guisantes", "Habas"], "Legumbres frescas: menos proteína, algo de vitamina C"),
      ] },
    ],
  },
  {
    clave: "pescado_azul", nombre: "Pescado azul", tipo: "plato",
    objetivo: { min: 2, max: 3 }, texto: "2–3 a la semana", racion: "125–150 g",
    rotar: "sí",
    nota: "Merece la pena rotar. El azul pequeño (sardina, boquerón, caballa, jurel) es la mejor base: mucho omega-3, poco mercurio y barato. En lata también cuenta. Si haces boquerones en vinagre, sushi o ceviche en casa, congela antes el pescado 5 días a −20 °C (tres estrellas o más): el vinagre no mata el anisakis.",
    subfamilias: [
      { clave: "azul_pequeno", nombre: "Azul pequeño", objetivo: { min: 1, max: 2 }, texto: "1–2", alimentos: [
        a(["Sardina", "Sardinas"], "Omega-3, vitamina D, B12; en lata con espinas, también calcio"),
        a(["Boquerón", "Boquerones", "Anchoa", "Anchoas"], "Omega-3 y poco mercurio (la anchoa en salazón es muy salada)"),
        a(["Caballa", "Verdel"], "De los que más omega-3 y vitamina D tienen"),
        a(["Jurel", "Chicharro"], "Omega-3 y muy barato"),
        a(["Arenque"], "Muchísimo omega-3; ahumado o en salazón es muy salado"),
      ] },
      { clave: "azul_otro", nombre: "Salmón, trucha, bonito…", objetivo: { min: 1 }, texto: "1", alimentos: [
        a(["Salmón"], "Omega-3 y vitamina D; el de piscifactoría también vale"),
        a(["Trucha", "Salmonete"], "Semigrasos: omega-3 moderado"),
        a(["Bonito del norte", "Bonito fresco"], "Omega-3 y proteína; temporada de verano"),
      ] },
      { clave: "atun_lata", nombre: "Atún o bonito en lata", objetivo: { max: 2 }, texto: "máx. 1–2, dentro de los huecos de azul", alimentos: [
        a(["Atún en lata", "Bonito en lata", "Atún"], "Cómodo, pero más mercurio y menos omega-3 que el pescado pequeño: no a diario"),
      ] },
      { clave: "mercurio", nombre: "Pez espada, atún rojo, cazón", objetivo: { max: 1, periodo: "mes" }, texto: "≤1 al mes (acumulan más mercurio)", alimentos: [
        a(["Pez espada", "Emperador", "Atún rojo"], "Acumulan más mercurio: solo de vez en cuando"),
        a(["Cazón", "Tiburón", "Lucio"], "Especies con mucho mercurio: ocasional"),
      ] },
    ],
  },
  {
    clave: "pescado_blanco", nombre: "Pescado blanco y marisco", tipo: "plato",
    objetivo: { min: 1, max: 2 }, texto: "1–2 a la semana", racion: "125–150 g",
    rotar: "poco",
    nota: "Rota por precio y gusto: son muy parecidos. El marisco de vez en cuando suma hierro, zinc y B12. Congelado o en lata cuenta igual que fresco.",
    subfamilias: [
      { clave: "blanco", nombre: "Pescado blanco", objetivo: { min: 1 }, texto: "1", alimentos: [
        a(["Merluza", "Pescadilla"], "Proteína magra, yodo, fósforo"),
        a(["Bacalao"], "Muy magro y rico en yodo"),
        a(["Abadejo", "Carbonero", "Bacaladilla"], "Como el bacalao y más baratos"),
        a(["Lenguado", "Gallo", "Platija"], "Magros y suaves"),
        a(["Rape"], "Magro y firme (guisos, brochetas)"),
        a(["Lubina", "Dorada", "Besugo", "Rodaballo"], "Semigrasos: algo de omega-3"),
      ] },
      { clave: "marisco", nombre: "Marisco y cefalópodos", objetivo: { max: 1 }, texto: "0–1, alternando con el blanco", alimentos: [
        a(["Mejillones", "Mejillón"], "Hierro, B12, yodo y algo de omega-3; muy baratos"),
        a(["Almejas", "Chirlas", "Berberechos"], "Muchísima B12, hierro"),
        a(["Gambas", "Langostinos"], "Proteína magra, selenio, yodo"),
        a(["Sepia", "Calamar", "Calamares", "Pulpo", "Chipirones"], "Magros, B12"),
        a(["Ostras"], "Muchísimo zinc"),
      ] },
    ],
  },
  {
    clave: "carne_blanca", nombre: "Carne blanca", tipo: "plato",
    objetivo: { max: 2 }, texto: "2 a la semana (máx. 3 de carne en total)", racion: "100–125 g",
    rotar: "no",
    nota: "No hace falta rotar: importa más la pieza (con o sin piel) y evitar procesados.",
    subfamilias: [
      { clave: "pollo_pavo", nombre: "Pollo o pavo", objetivo: { max: 2 }, texto: "1–2", alimentos: [
        a(["Pechuga de pollo"], "Proteína muy magra, B3, B6"),
        a(["Muslo de pollo", "Contramuslo", "Pollo"], "El muslo tiene más hierro y zinc que la pechuga; algo más de grasa"),
        a(["Pavo"], "Como el pollo; muy magro, selenio"),
      ] },
      { clave: "conejo_aves", nombre: "Conejo, codorniz, caza", objetivo: { max: 1 }, texto: "0–1", alimentos: [
        a(["Conejo"], "Magro y muy rico en B12"),
        a(["Codorniz"], "Más hierro que el pollo"),
        a(["Pato"], "Es ave aunque la carne sea oscura: más grasa (quita la piel) y más hierro"),
        a(["Gallina"], "Más grasa y sabor; buena para caldos"),
        a(["Perdiz", "Faisán", "Pintada"], "Magras, con algo más de hierro que el pollo"),
        a(["Hígado de pollo"], "Hierro, B12, folato y mucha vitamina A: ocasional"),
      ] },
    ],
  },
  {
    clave: "carne_roja", nombre: "Carne roja", tipo: "plato",
    objetivo: { max: 1 }, texto: "1 a la semana, magra (sin pasar de 350–500 g cocinada)", racion: "100–125 g",
    rotar: "no",
    nota: "Como es una vez por semana, rotar apenas importa: elige cortes magros. El cerdo cuenta como carne roja. Aporta hierro, zinc y B12.",
    subfamilias: [
      { clave: "roja_magra", nombre: "Roja magra", objetivo: { max: 1 }, texto: "1", alimentos: [
        a(["Ternera", "Babilla", "Contra", "Redondo", "Solomillo de ternera"], "Hierro hemo, zinc, B12"),
        a(["Carne picada", "Picada de ternera"], "Igual; evita el «preparado de carne picada», que lleva sal y conservantes"),
        a(["Lomo de cerdo", "Solomillo de cerdo", "Cerdo"], "Magro; el cerdo es la mejor fuente de tiamina (B1)"),
        a(["Cabrito"], "Como el cordero, pero más magro"),
        a(["Caballo"], "Muy magro y muy rico en hierro"),
        a(["Venado", "Jabalí"], "Caza: muy magra, mucho hierro"),
      ] },
      { clave: "roja_grasa", nombre: "Roja grasa o vísceras", objetivo: null, texto: "ocasional", alimentos: [
        a(["Entrecot", "Chuletón", "Buey", "Vaca madurada"], "Igual que la magra, con más grasa"),
        a(["Secreto", "Presa", "Costilla", "Panceta"], "Mucha más grasa: ocasional"),
        a(["Cordero"], "Hierro, zinc, B12; bastante graso"),
        a(["Hígado de ternera"], "Hierro, B12, cobre y mucha vitamina A: ocasional"),
      ] },
    ],
  },
  {
    clave: "huevos", nombre: "Huevos", tipo: "plato", unidad: "huevo",
    objetivo: { max: 4 }, texto: "hasta 4 a la semana (2 comidas de 2 huevos)", racion: "se cuentan por unidades",
    rotar: "no",
    nota: "No hace falta rotar: la categoría (códigos 0 a 3) apenas cambia nada nutricionalmente. Aportan proteína completa, B12, colina, vitamina D y luteína. El tope de 4 es de AESAN y tiene en cuenta el impacto ambiental; en personas sanas la evidencia no ve problema en hasta uno al día.",
    subfamilias: [
      { clave: "huevo", nombre: "Huevo", objetivo: { max: 4 }, texto: "hasta 4", alimentos: [
        a(["Huevo", "Huevos", "Tortilla"], "Proteína completa, B12, colina, vitamina D y luteína"),
      ] },
    ],
  },
  {
    clave: "procesados", nombre: "Carne procesada", tipo: "plato", limite: true,
    objetivo: { max: 1 }, texto: "lo mínimo posible, ocasional (no cuenta como ración de carne)",
    rotar: "no",
    nota: "La OMS clasificó la carne procesada como carcinógeno del grupo 1 en 2015. Aunque sean de pollo o pavo, los fiambres, nuggets y salchichas cuentan aquí.",
    subfamilias: [
      { clave: "procesada", nombre: "Embutido, fiambre, salchichas", objetivo: { max: 1 }, texto: "lo mínimo", alimentos: [
        a(["Jamón serrano", "Jamón curado", "Jamón york", "Chorizo", "Salchichón", "Lomo embuchado", "Bacon", "Beicon", "Salchichas", "Fiambre", "Pavo en lonchas", "Nuggets", "Sobrasada", "Morcilla", "Fuet"], "Procesados: no cuentan como ración y conviene reducirlos al mínimo"),
      ] },
    ],
  },

  /* ---------------- Cada día ---------------- */
  {
    clave: "verduras", nombre: "Verduras y hortalizas", tipo: "diaria",
    objetivo: { min: 21 }, dia: { min: 3 }, texto: "≥3 al día (≈21 a la semana)", racion: "150–200 g",
    rotar: "mucho",
    nota: "Aquí es donde más importa rotar: intenta que cada semana salga algo de cada familia (hoja verde, crucíferas, naranjas y rojas). Congeladas valen igual que frescas. Ajo, cebolla y puerro como base de cocina no suman ración.",
    subfamilias: [
      { clave: "hoja_verde", nombre: "Hoja verde", objetivo: { min: 5 }, texto: "5–7", color: "#2E7D32", alimentos: [
        a(["Espinaca", "Espinacas", "Acelga", "Acelgas", "Kale", "Col rizada", "Canónigos", "Rúcula", "Berros"], "Folato, vitamina K, betacaroteno, magnesio (el calcio de espinaca y acelga apenas se absorbe; el del kale sí)"),
        a(["Lechuga romana", "Hoja de roble", "Lechuga", "Escarola", "Endibia"], "Cuanto más oscura, más nutrientes"),
      ] },
      { clave: "rojas", nombre: "Rojas", objetivo: { min: 5 }, texto: "5–7", color: "#C62828", alimentos: [
        a(["Tomate", "Tomates", "Tomate triturado", "Gazpacho", "Salmorejo"], "Licopeno (se absorbe mejor cocinado y con aceite)"),
        a(["Pimiento rojo", "Pimiento"], "De los que más vitamina C tienen"),
        a(["Remolacha"], "Folato y nitratos"),
      ] },
      { clave: "cruciferas", nombre: "Crucíferas", objetivo: { min: 3 }, texto: "3–4", color: "#558B2F", alimentos: [
        a(["Brócoli", "Brocoli", "Coliflor", "Coles de Bruselas", "Repollo", "Col", "Romanesco", "Rábano", "Rábanos", "Bimi", "Grelos", "Nabo"], "Vitaminas C y K, folato, glucosinolatos"),
        a(["Lombarda"], "Además, antocianinas"),
      ] },
      { clave: "naranjas", nombre: "Naranjas", objetivo: { min: 3 }, texto: "3–4", color: "#EF6C00", alimentos: [
        a(["Zanahoria", "Zanahorias", "Calabaza", "Pimiento naranja", "Pimiento amarillo"], "Betacaroteno (provitamina A)"),
      ] },
      { clave: "otras_verduras", nombre: "Otras verduras", objetivo: null, texto: "para completar", alimentos: [
        a(["Judía verde", "Judías verdes", "Espárrago", "Espárragos", "Alcachofa", "Alcachofas"], "Fibra; el espárrago verde aporta folato y la alcachofa, inulina"),
        a(["Calabacín", "Berenjena", "Pepino"], "Sobre todo agua y fibra: dan volumen, pero que no sean tu única verdura"),
        a(["Champiñones", "Champiñón", "Setas", "Seta"], "Vitaminas B y selenio"),
        a(["Pimiento verde", "Pimientos de padrón", "Apio", "Hinojo", "Maíz dulce", "Brotes"], "Suman volumen y variedad"),
        a(["Lechuga iceberg", "Iceberg"], "Aporta poco"),
      ] },
      { clave: "ajo_cebolla", nombre: "Ajo, cebolla, puerro (base)", objetivo: null, base: true, texto: "a diario como base de cocina · no suma ración", alimentos: [
        a(["Ajo", "Cebolla", "Cebolleta", "Puerro", "Chalota"], "Compuestos azufrados y fibra prebiótica"),
      ] },
    ],
  },
  {
    clave: "fruta", nombre: "Fruta", tipo: "diaria",
    objetivo: { min: 14 }, dia: { min: 2, max: 3 }, texto: "2–3 al día (≈14–21 a la semana; el zumo no cuenta)", racion: "120–200 g",
    rotar: "sí",
    nota: "Merece la pena rotar. Base práctica: una fuente de vitamina C al día (cítricos, kiwi o fresas) y el resto de temporada. «5 al día» es fruta y verdura juntas: lo óptimo ronda 2 de fruta y 3 de verdura.",
    subfamilias: [
      { clave: "vitamina_c", nombre: "Cítricos, kiwi, fresas", objetivo: { min: 7 }, texto: "7 (1 al día)", color: "#F9A825", alimentos: [
        a(["Naranja", "Mandarina", "Pomelo"], "Vitamina C, folato (el pomelo interactúa con bastantes medicamentos)"),
        a(["Kiwi"], "Más vitamina C que la naranja, fibra"),
        a(["Fresas", "Fresa", "Fresón"], "Vitamina C"),
      ] },
      { clave: "bayas", nombre: "Frutos rojos", objetivo: { min: 2 }, texto: "2–3", color: "#6A1B9A", alimentos: [
        a(["Frambuesas", "Moras", "Arándanos", "Frutos rojos"], "Antocianinas y fibra; congelados valen igual"),
      ] },
      { clave: "fruta_naranja", nombre: "Pulpa naranja", objetivo: { min: 2 }, texto: "2–3", color: "#EF6C00", alimentos: [
        a(["Mango", "Papaya"], "Betacaroteno y vitamina C"),
        a(["Caqui", "Albaricoque", "Melocotón", "Nectarina"], "Betacaroteno (sobre todo caqui y albaricoque)"),
      ] },
      { clave: "otras_frutas", nombre: "Otras frutas", objetivo: null, texto: "para completar", alimentos: [
        a(["Plátano", "Banana"], "Potasio, B6"),
        a(["Manzana", "Pera"], "Fibra soluble (pectina); mejor con piel"),
        a(["Uva", "Uvas"], "Polifenoles en la piel (más en la negra); más azúcar"),
        a(["Cerezas", "Picotas"], "Antocianinas"),
        a(["Sandía", "Melón"], "Sobre todo agua; la sandía aporta licopeno"),
        a(["Piña"], "Vitamina C, manganeso"),
        a(["Granada"], "Polifenoles, fibra"),
        a(["Aguacate"], "Grasa monoinsaturada, potasio, fibra, vitamina E"),
        a(["Higos", "Ciruela", "Ciruelas", "Dátiles"], "Fibra"),
      ] },
    ],
  },
  {
    clave: "frutos_secos", nombre: "Frutos secos y semillas", tipo: "diaria",
    objetivo: { min: 3, max: 7 }, texto: "3–7 a la semana (hasta 1 al día)", racion: "un puñado de 20–30 g",
    rotar: "sí",
    nota: "Merece la pena rotar. Base: nueces y almendras, el resto a tu gusto; siempre crudos o tostados y sin sal.",
    subfamilias: [
      { clave: "nueces", nombre: "Nueces", objetivo: { min: 2 }, texto: "2–3", alimentos: [
        a(["Nueces", "Nuez"], "Omega-3 vegetal: el único fruto seco común con una cantidad relevante"),
      ] },
      { clave: "almendras", nombre: "Almendras", objetivo: { min: 1 }, texto: "1–2", alimentos: [
        a(["Almendras", "Almendra"], "Vitamina E, calcio, magnesio, fibra"),
      ] },
      { clave: "otros_frutos_secos", nombre: "Otros y semillas", objetivo: null, texto: "1–2", alimentos: [
        a(["Avellanas"], "Vitamina E, grasa monoinsaturada"),
        a(["Pistachos"], "Potasio, B6, luteína"),
        a(["Anacardos"], "Hierro, zinc, magnesio, cobre"),
        a(["Cacahuetes", "Crema de cacahuete"], "En realidad son legumbre: proteína, niacina, folato; los más baratos"),
        a(["Piñones"], "Magnesio, zinc"),
        a(["Nueces de Brasil"], "Muchísimo selenio: 1–2 al día como mucho"),
        a(["Pipas de girasol"], "Muchísima vitamina E"),
        a(["Pipas de calabaza"], "Magnesio, zinc, hierro"),
        a(["Chía", "Lino", "Linaza"], "Omega-3 vegetal y fibra; el lino, molido (entero pasa sin digerir)"),
        a(["Sésamo", "Tahini"], "Calcio (más en el sésamo entero), hierro"),
      ] },
    ],
  },
  {
    clave: "cereales", nombre: "Cereales", tipo: "diaria", orientativa: true,
    objetivo: { min: 21 }, dia: { min: 3, max: 6 }, texto: "3–6 al día, mejor integrales", racion: "40–60 g de pan o 60–80 g de pasta o arroz en seco",
    rotar: "poco",
    nota: "Varía sin obsesionarte, sobre todo para no depender del arroz. Lo que importa de verdad es que sean integrales.",
    subfamilias: [
      { clave: "pan", nombre: "Pan", objetivo: null, texto: "a diario, integral", alimentos: [
        a(["Pan integral", "Pan", "Tostada", "Tostadas", "Pan de centeno", "Pan de espelta"], "En España «integral» a secas significa 100 % harina integral; si no, la etiqueta debe decir el %. El centeno es muy saciante"),
      ] },
      { clave: "avena", nombre: "Avena", objetivo: { min: 3 }, texto: "3–5", alimentos: [
        a(["Avena", "Copos de avena", "Porridge"], "Betaglucano, que ayuda a bajar el colesterol LDL"),
      ] },
      { clave: "pasta", nombre: "Pasta", objetivo: null, texto: "1–2, integral", alimentos: [
        a(["Pasta", "Pasta integral", "Espaguetis", "Macarrones", "Fideos", "Lasaña"], "Fibra, magnesio, vitaminas B (integral)"),
      ] },
      { clave: "arroz", nombre: "Arroz", objetivo: { max: 2 }, texto: "1–2", alimentos: [
        a(["Arroz", "Arroz integral"], "Magnesio, B1. Acumula algo de arsénico: lávalo, cuécelo en mucha agua y altérnalo con otros cereales"),
      ] },
      { clave: "otros_cereales", nombre: "Quinoa, bulgur, cuscús…", objetivo: null, texto: "1", alimentos: [
        a(["Quinoa"], "Pseudocereal: proteína completa, magnesio, hierro"),
        a(["Cebada"], "Betaglucano, como la avena"),
        a(["Trigo sarraceno", "Mijo"], "Magnesio, sin gluten"),
        a(["Bulgur", "Cuscús"], "Fibra y listo en minutos"),
        a(["Palomitas", "Maíz"], "Integral y saciante (palomitas caseras)"),
      ] },
    ],
  },
  {
    clave: "tuberculos", nombre: "Patata y boniato", tipo: "diaria", orientativa: true,
    objetivo: { max: 3 }, texto: "con moderación (p. ej. 1–3), alternando con cereales y legumbres",
    rotar: "no",
    nota: "La OMS no los cuenta como verdura: van con los hidratos. El boniato sí aporta betacaroteno.",
    subfamilias: [
      { clave: "patata_boniato", nombre: "Patata o boniato", objetivo: { max: 3 }, texto: "1–3", alimentos: [
        a(["Patata", "Patatas", "Boniato", "Batata"], "Hidratos; el boniato aporta betacaroteno"),
      ] },
    ],
  },
  {
    clave: "lacteos", nombre: "Lácteos", tipo: "diaria", orientativa: true,
    objetivo: { max: 21 }, dia: { max: 3 }, texto: "hasta 3 al día", racion: "200–250 ml de leche, 125 g de yogur o 40–60 g de queso curado",
    rotar: "no",
    nota: "No hace falta rotar. Leche, yogur natural y kéfir aportan calcio, proteína, B2, B12 y yodo; los fermentados se digieren mejor si toleras mal la lactosa. Si tomas bebida vegetal, que esté enriquecida con calcio (la de soja es la más parecida en proteína).",
    subfamilias: [
      { clave: "leche_yogur", nombre: "Leche, yogur, kéfir", objetivo: null, texto: "1–2 al día", alimentos: [
        a(["Leche", "Yogur", "Yogur natural", "Kéfir", "Bebida de soja", "Bebida vegetal"], "Calcio, proteína, B2, B12 y yodo"),
      ] },
      { clave: "queso_fresco", nombre: "Queso fresco, requesón", objetivo: null, texto: "2–3", alimentos: [
        a(["Queso fresco", "Requesón", "Mozzarella", "Burrata", "Ricotta", "Queso de Burgos"], "Menos sal y grasa saturada que el curado"),
      ] },
      { clave: "queso_curado", nombre: "Queso curado", objetivo: { max: 3 }, texto: "2–3", alimentos: [
        a(["Queso curado", "Queso semicurado", "Parmesano", "Queso rallado", "Queso"], "Concentra calcio, pero también sal y grasa saturada"),
      ] },
    ],
  },
];

/* Totales que mezclan familias */
export const TOTALES = [
  { clave: "pescado_total", nombre: "Pescado (total)", familias: ["pescado_azul", "pescado_blanco"], objetivo: { min: 3 }, texto: "≥3 a la semana, sobre todo azul" },
  { clave: "carne_total", nombre: "Carne (total)", familias: ["carne_blanca", "carne_roja"], objetivo: { max: 3 }, texto: "máx. 3 a la semana, mejor ave o conejo" },
];

/* ---------------- Grupos para repartir comidas y cenas ----------------
   `porDefecto` suma 14 (7 comidas + 7 cenas): 4 legumbres, 4 pescado (la mitad o
   más azul), 3 carne (2 blanca y 1 roja), 2 huevos y 1 libre.
   `rotacion` es la sugerencia de subfamilia para cada hueco del grupo, en orden. */
export const GRUPOS = [
  { clave: "legumbres", nombre: "Legumbres", corto: "Legumbre", porDefecto: 4, color: "#8A5A1F", suave: "#F4EADB",
    rotacion: ["lentejas", "garbanzos", "alubias", "otras_legumbres"],
    ideas: ["Lentejas estofadas con verduras", "Garbanzos con espinacas", "Alubias blancas con almejas", "Potaje de garbanzos", "Curry de garbanzos", "Dal de lentejas rojas", "Chili de alubias sin carne", "Ensalada de garbanzos", "Ensalada de lentejas", "Hummus con crudités"] },
  { clave: "pescado_azul", nombre: "Pescado azul", corto: "P. azul", porDefecto: 2, color: "#1F5FA8", suave: "#E1ECF8",
    rotacion: ["azul_pequeno", "azul_otro", "azul_pequeno"],
    ideas: ["Sardinas a la plancha", "Boquerones al horno", "Caballa al horno", "Jurel al horno", "Salmón en papillote", "Bonito con tomate", "Marmitako", "Tostas de sardinas en lata", "Ensalada de caballa en lata"] },
  { clave: "pescado_blanco", nombre: "Pescado blanco o marisco", corto: "P. blanco", porDefecto: 2, color: "#177A73", suave: "#DDF1EE",
    rotacion: ["blanco", "marisco"],
    ideas: ["Merluza en salsa verde", "Merluza al horno", "Bacalao con tomate", "Lubina a la sal", "Dorada al horno", "Lenguado a la plancha", "Mejillones al vapor", "Sepia a la plancha", "Calamares a la plancha"] },
  { clave: "carne_blanca", nombre: "Carne blanca", corto: "C. blanca", porDefecto: 2, color: "#B26A00", suave: "#FBEBD3",
    rotacion: ["pollo_pavo", "conejo_aves"],
    ideas: ["Pollo asado con verduras", "Fajitas de pollo", "Brochetas de pollo", "Curry de contramuslo", "Salteado de pavo con verduras", "Conejo al ajillo"] },
  { clave: "carne_roja", nombre: "Carne roja", corto: "C. roja", porDefecto: 1, color: "#B3261E", suave: "#F9E0DE",
    rotacion: ["roja_magra"],
    ideas: ["Estofado de ternera con verduras", "Albóndigas caseras en salsa de tomate", "Hamburguesa casera", "Solomillo de cerdo a la plancha", "Lomo de cerdo al horno", "Cordero asado"] },
  { clave: "huevos", nombre: "Huevos", corto: "Huevos", porDefecto: 2, color: "#8D6E00", suave: "#FBF1C7",
    rotacion: ["huevo"],
    ideas: ["Tortilla de patata", "Tortilla de calabacín", "Tortilla de espinacas", "Revuelto de setas", "Revuelto de espárragos", "Shakshuka", "Huevos al horno con pisto"] },
  { clave: "libre", nombre: "Libre", corto: "Libre", porDefecto: 1, color: "#5B4BA6", suave: "#ECE8F8",
    rotacion: [], nota: "mejor vegetal o una legumbre extra",
    ideas: ["Pasta integral con verduras", "Arroz integral con verduras", "Salteado de tofu", "Pizza casera de verduras", "Ensalada completa con queso fresco y nueces"] },
];

/* Grupos que no reparten proteína */
export const GRUPO_DESAYUNO = { clave: "desayuno", nombre: "Desayuno", corto: "Desayuno", color: "#9C4F7E", suave: "#F6E4EF",
  ideas: ["Tostada integral con tomate y aceite (con queso fresco o huevo)", "Yogur natural con fruta y frutos secos", "Avena con leche y fruta"] };
export const GRUPO_FUERA = { clave: "fuera", nombre: "Fuera / sin plan", corto: "Fuera", color: "#5F6368", suave: "#ECEDEE" };

/* Tipos de receta: los grupos de plato + desayuno + verdura (primer plato o guarnición) + otro */
export const TIPOS_RECETA = [
  ...GRUPOS.map((g) => ({ clave: g.clave, nombre: g.clave === "libre" ? "Plato libre (pasta, arroz, tofu, pizza…)" : g.nombre, corto: g.corto, color: g.color, suave: g.suave })),
  { clave: "verdura", nombre: "Verdura (primer plato o guarnición)", corto: "Verdura", color: "#2E7D32", suave: "#E3F1E4" },
  { clave: "desayuno", nombre: "Desayuno", corto: "Desayuno", color: GRUPO_DESAYUNO.color, suave: GRUPO_DESAYUNO.suave },
  { clave: "otro", nombre: "Otro (postre, salsa, picoteo…)", corto: "Otro", color: "#5F6368", suave: "#ECEDEE" },
];

export const GRUPOS_HUECO = [...GRUPOS, GRUPO_DESAYUNO, GRUPO_FUERA];

/* Qué grupo de hueco corresponde a cada familia de proteína (para derivar el tipo de una receta) */
export const FAMILIA_A_GRUPO = {
  legumbres: "legumbres", pescado_azul: "pescado_azul", pescado_blanco: "pescado_blanco",
  carne_blanca: "carne_blanca", carne_roja: "carne_roja", huevos: "huevos",
};

/* Límites y cosas ocasionales, tal cual para la guía */
export const LIMITES = [
  "Carne roja: no pasar de unos 350–500 g cocinada a la semana.",
  "Carne procesada (embutidos, bacon, salchichas, fiambres): lo menos posible.",
  "Pez espada, atún rojo, cazón, hígado y cortes grasos: solo de vez en cuando.",
  "Atún en lata: mejor no a diario.",
  "Nueces de Brasil: 1–2 al día como mucho.",
  "Menos de 5 g de sal al día (OMS). Aceite de oliva a diario para cocinar y aliñar.",
];

export const FUENTES = [
  ["AESAN (2022), recomendaciones dietéticas sostenibles para la población española", "https://www.dsca.gob.es/es/comunicacion/notas-prensa/consumo-actualiza-recomendaciones-dieta-saludable-e-incluye-primera-vez-impacto-medio"],
  ["Consejo General de Dietistas-Nutricionistas, resumen de AESAN", "https://www.consejodietistasnutricionistas.com/wp-content/uploads/2024/11/6.-RECOMENDACIONES_DIETETICAS_compressed.pdf"],
  ["OCU, recomendaciones de AESAN y raciones", "https://www.ocu.org/alimentacion/comer-bien/noticias/recomendaciones-dieteticas-aesan"],
  ["OMS, alimentación sana", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"],
  ["WCRF, limitar la carne roja y procesada", "https://www.wcrf.org/diet-activity-and-cancer/cancer-prevention-recommendations/limit-red-and-processed-meat/"],
  ["Wang et al. (2021), Circulation: fruta, verdura y mortalidad", "https://www.newswise.com/articles/the-right-5-a-day-mix-is-2-fruit-and-3-vegetable-servings-for-longer-life"],
  ["AESAN, consumo de pescado por el mercurio", "https://espaitec.uji.es/wp-content/uploads/2021/04/RECOMENDACIONES_consumo_pescado_MERCURIO_AESAN_WEB.pdf"],
  ["AESAN, anisakis", "https://aesan.gob.es/actualidad/campanyas-seguridad-alimentaria/anisakis"],
];

/* ---------------- Índices ---------------- */
export const SUBFAMILIAS = FAMILIAS.flatMap((f) => f.subfamilias.map((s) => ({ ...s, familia: f.clave })));
export const SUB = Object.fromEntries(SUBFAMILIAS.map((s) => [s.clave, s]));
export const FAM = Object.fromEntries(FAMILIAS.map((f) => [f.clave, f]));
export const GRUPO = Object.fromEntries([...GRUPOS_HUECO, ...TIPOS_RECETA.filter((t) => !GRUPOS_HUECO.some((g) => g.clave === t.clave))].map((g) => [g.clave, g]));
export const TIPO_RECETA = Object.fromEntries(TIPOS_RECETA.map((t) => [t.clave, t]));

export const CLAVES_SUBFAMILIA = new Set(SUBFAMILIAS.map((s) => s.clave));
export const CLAVES_GRUPO_HUECO = new Set(GRUPOS_HUECO.map((g) => g.clave));
export const CLAVES_TIPO_RECETA = new Set(TIPOS_RECETA.map((t) => t.clave));
export const CLAVES_MOMENTO = new Set(MOMENTOS.map((m) => m.clave));
export const CLAVES_MOMENTO_REGISTRO = new Set(MOMENTOS_REGISTRO.map((m) => m.clave));

export const repartoPorDefecto = () => Object.fromEntries(GRUPOS.map((g) => [g.clave, g.porDefecto]));
