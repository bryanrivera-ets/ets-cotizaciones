# Fase 3: generación del PDF

## Qué hay aquí

- `pdf/`: los PDF que genera la app con los datos de los 6 ejemplos.
- `comparacion/`: cada página lado a lado. **Original | Generado | Superposición**.
  En la superposición, lo que coincide se ve gris oscuro; rojo = solo en el original, azul = solo en el generado.
- `fuentes/`: comparación de las fuentes originales con las alternativas libres.

## Resultado

| Ejemplo | Tipo | Páginas original / generado |
|---|---|---|
| 049-26 REV I | Lump Sum | 2 / 2 |
| 223-26 | Lump Sum con celda combinada | 2 / 2 |
| 303-26 | Lump Sum con lista y nota | 2 / 2 |
| 387-26 | Lump Sum, 2 secciones | 3 / 3 |
| 452-26 | Premium Time | 2 / 2 |
| 348-26 REV II | T&M | 3 / 3 |

Coinciden: barras, título, logo, bloque de datos, barra Project/Area, posiciones del texto,
tablas (colores, columnas, celda combinada), línea B2B con puntos, términos (negrita, itálica,
azul, rojo, enlaces), firma y pie de página con iconos e iniciales.

Diferencias que quedan (a propósito o menores):
1. **Fuentes**: son las alternativas libres; el ancho de letra cambia un poco y algunas líneas
   se cortan en otro punto.
2. **Espacios en blanco**: en Word cada cotización tiene líneas vacías distintas (por ejemplo, 303-26
   tiene más espacio antes del B2B y de la nota). La app usa siempre el mismo espaciado, el de 223-26.
3. **Viñetas**: se usa ▪ / o / - por nivel (decisión de la Fase 2), por eso 387-26 muestra "-"
   en el tercer nivel donde el original tenía ▪.
4. **049-26** ahora muestra "049-26 REV I" porque es una revisión.

## Cómo regenerarlos

```bash
npm run pdf:examples   # genera out/pdf/*.pdf
npm run pdf:compare    # crea out/compare/*.png (necesita Python 3 con pymupdf y Pillow)
```
