# Resumen de los archivos de referencia (Fase 1)

Fuente: `referencia/ejemplos/*.pdf` (6 PDF) y `assets/logo-ets.png`.
**No existe la carpeta `referencia/templates/`** (los .docx mencionados en la especificación no están en el repo);
los datos de colores, fuentes y tamaños se extrajeron directamente de los PDF.

## Formato general (Lump Sum y Premium Time — exportados desde Word)

- Página carta 612 × 792 pt.
- Barra azul oscuro `#1f4e79` arriba; debajo barra gris `#a5a6a5` con el título en blanco,
  24 pt, *Arial Nova Bold*, letras espaciadas ("ETS CORP. P R O P O S A L" o "P R O P O S A L").
- Logo a la izquierda (≈ 175 × 80 pt). Bloque de datos a la derecha, 11 pt: Date, Quote No., Contact,
  Contractor, Page "**1** of **2**" (números en negrita).
- Página 1: caja con dos celdas: `Project/Area: **MAYÚSCULAS**` | `Location: **Ciudad, Puerto Rico**` (12 pt negrita).
- Páginas siguientes: una línea horizontal bajo el bloque de datos.
- Texto de apertura 11 pt. "TO BE PERFORMED:" y "SCOPE OF WORK:" en negrita.
- Viñetas del scope: nivel 1 `▪` (Wingdings), nivel 2 `o`, nivel 3 `-` o `▪` (ver 223-26 y 387-26: el
  tercer nivel no es uniforme).
- Tabla de precios: encabezado azul `#1f4e79` texto blanco 12 pt negrita; bordes `#4471c4`;
  filas rellenas `#d9e1f3`. Descripción 14 pt + paréntesis 11 pt; QTY/UNIT 14 pt; "LUMP SUM" 14 pt;
  AMOUNT 12 pt (Material / Labor normal, Total en negrita). Celda combinada de precio en 223-26.
- B2B: caja con línea arriba y abajo, "**B2B 4%** ……… **$959.92**".
- Nota opcional (303-26): "**Note:** This quotation is based on wall heights of up to 9 feet."
- Pie: "PO Box 6810 Caguas, PR 00726-6810", ☎ 787.747.1690, 📠 787.747.3153 en gris `#595959`
  (*Aharoni Bold*, 12/14 pt, con iconos de teléfono y fax), iniciales en `#8eaadb` negrita abajo a la derecha.
- Términos: título "Terms & Conditions" 12 pt negrita, viñetas `▪`; firma a la derecha: "Acknowledge by:" 10 pt,
  nombre en letra manuscrita 14 pt, cargo 10 pt.

## T&M (348-26 REV II — impreso con "Microsoft Print to PDF")

- Diseño distinto: título "ETS CORP. T & M P R O P O S A L" en barra gris; barra superior `#1f3864`.
- Bloque de datos como tabla con líneas finas, incluye "Proposal Type: Time & Material" y "Page 1 of 3"
  dentro de la misma celda. Quote No. en negrita: `348-26 REV II (T&M)`.
- Fuente tipo Calibri 10 pt. Encabezados de tabla `#2d5497` texto blanco; filas alternas `#f2f2f2`;
  filas de total `#d8e2f2`; fila "ESTIMATED TOTAL" en azul con texto blanco.
- En la página de términos del T&M no hay barra de título (solo logo + bloque de datos).
- La firma es "Carlos A. Soto" en otra letra manuscrita.

## Fuentes incrustadas en los PDF

| Uso | Fuente en el PDF |
|---|---|
| Cuerpo | "Calibri" (al renderizar se ve condensada tipo DIN/Bahnschrift) |
| Título de la barra gris | Arial Nova Bold |
| Pie de página | Aharoni Bold |
| Firma Eric Rivera | Bradley Hand ITC |
| Firma Carlos A. Soto | Dreaming Outloud Script Pro |
| Viñetas | Wingdings / Symbol |
| T&M | Fuentes sin nombre (tipo Calibri) |

Todas son fuentes de Microsoft/Monotype **sin licencia para incluirlas en una app web**. En la Fase 3 propondré
alternativas libres (Google Fonts, licencia OFL) y mostraré la comparación antes de decidir.

## Datos numéricos verificados contra la sección 6.5

| Cotización | Total | Material | Labor | B2B 4% |
|---|---|---|---|---|
| 049-26 | 43,631 | 26,179 | 17,452 | 698.08 |
| 303-26 | 25,500 | 15,300 | 10,200 | 408.00 |
| 387-26 secc. 1 | 6,912 | 4,147 | 2,765 | 110.60 |
| 387-26 secc. 2 | 3,978 | 2,387 | 1,591 | 63.64 |
| 223-26 | 20,793 + 39,202 | 12,476 + 23,521 | 8,317 + 15,681 | 959.92 (una sola línea para la sección) |
| 348-26 T&M | 11,525 subtotal | 6,915 | 4,610 | 184.40 → total 11,709.40 |
| 452-26 Premium | 2,875 | — | — | — |

Todos coinciden con las reglas de la especificación (60 % redondeado al dólar; B2B = 4 % de la labor).
