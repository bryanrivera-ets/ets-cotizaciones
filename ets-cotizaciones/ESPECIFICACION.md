# Especificación: App de Cotizaciones ETS Corp.

## 1. Resumen

PWA para crear las cotizaciones (proposals) de ETS Corp. (Epoxy Technologies Systems). Reemplaza el proceso actual de llenar plantillas de Word y exportarlas a PDF. El usuario llena un formulario, la app hace los cálculos y genera un PDF idéntico en diseño a las cotizaciones actuales.

- **Usuarios:** 2 a 3 personas. Todos pueden editar todo.
- **Dispositivos:** desktop (Windows/Mac, instalada como app con acceso directo) e iPad.
- **Conexión:** debe funcionar sin internet (offline-first) y sincronizar al reconectar.
- **Idioma:** la interfaz de la app en español; el PDF de la cotización en inglés (como las actuales).

## 2. Archivos de referencia en el repositorio

- `referencia/ejemplos/`: PDFs de cotizaciones reales. Son la referencia visual y numérica principal. El PDF generado debe verse igual.
- `referencia/templates/`: archivos Word (.docx) originales. Úsalos para extraer colores exactos, tamaños de letra, márgenes y espaciado.
- `assets/`: logo de ETS. Si falta, extráelo de los .docx.

Antes de escribir código, lee todos los archivos de referencia y resume lo que encontraste.

## 3. Stack técnico

- React + TypeScript + Vite
- `vite-plugin-pwa` para manifest y service worker
- Firebase: Authentication (email y contraseña), Firestore con caché persistente offline, Hosting
- Generación de PDF en el cliente (por ejemplo `@react-pdf/renderer`), para que funcione offline y se vea igual en iPad y desktop
- Vitest para pruebas de los cálculos

Si consideras que otra opción es claramente mejor para algún punto, propónla y explica por qué antes de usarla.

## 4. Estructura común de todas las cotizaciones

**Encabezado (todas las páginas):**
- Barra azul oscura arriba y barra gris con el título en letras espaciadas
- Logo ETS a la izquierda
- Bloque de datos a la derecha: Date, Quote No., Contact, Contractor, Page X of Y
- Página 1 solamente: barra con `Project/Area: [en negrita mayúsculas]` y `Location: [en negrita]`

**Título** (depende del perfil del usuario o del tipo):
- `ETS CORP. P R O P O S A L`
- `P R O P O S A L`
- `ETS CORP. T & M P R O P O S A L` (siempre para T&M)

**Pie de página (todas las páginas):** `PO Box 6810 Caguas, PR 00726-6810`, teléfono `787.747.1690`, fax `787.747.3153`, y las iniciales de quien preparó la cotización (por ejemplo DMR, CSN) en azul claro abajo a la derecha.

**Texto de apertura:** "We are pleased to present our proposal for the reference project."

**Última página: Terms & Conditions**, con firma "Acknowledge by:", el nombre en letra manuscrita y el cargo debajo. Firmantes actuales (lista editable):
- Eric Rivera, President
- Carlos A. Soto, Senior Project Manager

**Paginación dinámica:** "Page X of Y" se calcula según el contenido.

**Formato de fecha:** en inglés, ejemplo "June 1, 2026".

## 5. Tipos de cotización

Usa los ejemplos de `referencia/ejemplos/` como modelo exacto de cada tipo.

### 5.1 Lump Sum (ejemplos 049-26, 303-26, 223-26, 387-26)

Una o varias **secciones**. Cada sección tiene:
- **TO BE PERFORMED:** una oración, ej. "Installation of Epoxy Terrazzo System on the reference project which consist on the following:"
- **SCOPE OF WORK:** lista con hasta 3 niveles de viñetas (▪, o, -) como en los ejemplos
- **Tabla de precios** con columnas DESCRIPTION, QTY/UNIT, UNIT PRICE, AMOUNT
  - Cada fila: descripción (texto en negrita + texto pequeño opcional entre paréntesis, o lista con viñetas) y cantidades (ej. "235 sf", "62 lf (6" high)", "3,000 sf (Aprox and up to 9' high)")
  - Varias filas pueden compartir un mismo precio (celda combinada), como en 223-26
  - UNIT PRICE normalmente dice "LUMP SUM"
  - AMOUNT muestra Material, Labor y Total (en negrita)
- **Línea B2B 4%** con puntos guía hasta el monto
- **Nota opcional** debajo, ej. "Note: This quotation is based on wall heights of up to 9 feet."

Cuando hay varias secciones (como 387-26), cada sección va en su propia página, con su propio B2B.

### 5.2 Premium Time (ejemplo 452-26)

- Subtítulo centrado "PREMIUM TIME"
- Tabla con DESCRIPTION y AMOUNT. Ej.: "Weekend" con fechas debajo y "Total: $2,875.00"
- Sin scope, sin desglose de material/labor, sin B2B
- Sí lleva la página de términos

### 5.3 Time & Material (ejemplo 348-26)

Tiene su propio diseño (fuente tipo Calibri, tablas con líneas). El bloque de datos agrega la fila "Proposal Type: Time & Material". Texto de apertura: "We are pleased to present our Time & Material (T&M) proposal for the reference project."

Secciones:
1. **ESTIMATED LABOR:** POSITION, QTY, EST. HOURS, RATE / HR, AMOUNT, con fila de totales
2. **ESTIMATED WORK SCHEDULE:** línea descriptiva editable, y tabla DAY, ACTIVITY, CREW, HOURS (formato "Supervisor / Labor", ej. "8 / 32"); el Project Manager va en una fila aparte con sus horas
3. **ESTIMATED MATERIALS & EQUIPMENT:** DESCRIPTION, QTY, UNIT, UNIT PRICE, AMOUNT, con total
4. **ALLOCATION BY AREA:** AREA, QTY/UNIT, MATERIAL, LABOR, TOTAL, con total
5. **ESTIMATED T&M SUMMARY:** Estimated Labor, Estimated Materials & Equipment, Subtotal, B2B 4% (on labor), ESTIMATED TOTAL

## 6. Reglas de cálculo

Todo dinero se maneja en centavos (enteros) para evitar errores de redondeo. Formato de salida: `$43,631.00`.

### 6.1 Lump Sum: separación Material / Labor
- El usuario introduce el **Total** de cada grupo de precio.
- Por defecto: Material = 60% del total, **redondeado al dólar entero** (0.5 redondea hacia arriba). Labor = Total − Material.
- El porcentaje es editable por cotización. También se puede introducir Material y Labor directamente.

### 6.2 B2B 4%
- Siempre es **4% de la suma de Labor** (no del total), redondeado al centavo.
- Lump Sum: se muestra aparte, **no se suma** al total. Uno por sección.
- T&M: se suma al Estimated Total.

### 6.3 T&M
- Las horas del Supervisor y de Labor se **calculan sumando el calendario de trabajo**. Las horas del Project Manager vienen de su fila.
- AMOUNT de cada posición = horas × tarifa. QTY total = suma de personas. EST. HOURS total = suma de horas.
- Materiales: AMOUNT = QTY × UNIT PRICE.
- Subtotal = Labor + Materiales. Estimated Total = Subtotal + B2B.

### 6.4 T&M: distribución por área
- La app calcula un porcentaje inicial para cada área según sus pies cuadrados (sf).
- El usuario puede ajustarlo de dos formas: cambiando el porcentaje, o escribiendo el total deseado del área (la app calcula el porcentaje = total del área / subtotal).
- Material del área = Material total × %, redondeado al dólar. Labor del área = Labor total × %, redondeado al dólar.
- **La última área recibe el resto**, para que las áreas siempre sumen exactamente los totales.

### 6.5 Casos de prueba obligatorios (deben pasar en Vitest)

| Caso | Entrada | Resultado esperado |
|---|---|---|
| 049-26 | Total 43,631 | Material 26,179 · Labor 17,452 · B2B 698.08 |
| 303-26 | Total 25,500 | Material 15,300 · Labor 10,200 · B2B 408.00 |
| 387-26 sección 1 | Total 6,912 | Material 4,147 · Labor 2,765 · B2B 110.60 |
| 387-26 sección 2 | Total 3,978 | Material 2,387 · Labor 1,591 · B2B 63.64 |
| 223-26 | Grupos 20,793 y 39,202 | 12,476/8,317 y 23,521/15,681 · B2B de la sección 959.92 |
| 348-26 calendario | Supervisor 8+4+4+4+4 · Labor 32+12+8+8+8 · PM 5 | Supervisor 24 h · Labor 68 h · PM 5 h · Total 97 h |
| 348-26 labor | PM 5×90 · Sup 24×60 · Labor 68×40 | 450 · 1,440 · 2,720 · Total 4,610 |
| 348-26 materiales | Las 10 líneas del ejemplo | Total 6,915.00 |
| 348-26 resumen | | Subtotal 11,525.00 · B2B 184.40 · Total 11,709.40 |
| 348-26 áreas | Room 4137 con total 6,798 | Room 4137: 4,079 / 2,719 · Corridor 547: 2,836 / 1,891 / 4,727 |

## 7. Numeración

- Formato `NNN-AA`: secuencial de 3 dígitos + año en 2 dígitos (ej. `049-26`). La secuencia reinicia cada año.
- Revisiones: `049-26 REV I`, `REV II`, `REV III` (números romanos).
- T&M agrega el sufijo `(T&M)`: `348-26 REV II (T&M)`.
- El número se asigna con una transacción en Firestore (contador por año) para que dos usuarios nunca reciban el mismo.
- **Sin conexión:** la cotización queda como borrador con un identificador temporal y recibe su número oficial al sincronizar. Botón "Reservar número" para obtenerlo por adelantado mientras hay conexión.
- Nombre del PDF por defecto (editable): `{Quote No.} - {PROJECT/AREA} - {CONTRACTOR}.pdf`, quitando caracteres no válidos.

## 8. Perfiles de usuario

Cada usuario tiene un perfil con:
- Nombre e iniciales (aparecen en el pie de página)
- Título preferido (`ETS CORP. P R O P O S A L` o `P R O P O S A L`)
- Versión preferida de términos
- Firmante por defecto (se puede cambiar en cada cotización)

## 9. Términos y condiciones

Hay dos versiones actuales. La diferencia está en el tercer punto:
- **Versión A** (en negrita e itálica): "Upon approval of the proposal, all costs shall be separated into labor and materials in the Work Order or Purchase Order and must be in the name of ETS Corp."
- **Versión B** (solo negrita): "Upon approval of the proposal, all costs shall be separated into labor and materials in the Work Order or Purchase Order."

Extrae el texto completo de los ejemplos y respeta el formato de cada línea: "Quotation valid for 15 days." en azul y negrita; "NEW CUSTOMERS ARE REQUIRED..." en negrita mayúsculas; los emails como enlaces; "Vapor barrier not included." en rojo; "Important Note..." en rojo y letra más grande.

Los términos se editan dentro de la app con soporte para negrita, itálica y color por línea.

## 10. Biblioteca de sistemas

- Cada sistema guarda: nombre, texto de "To Be Performed" y pasos del Scope of Work con sus niveles de viñeta.
- Al crear una sección se escoge un sistema y el scope se llena solo. Se puede editar libremente en esa cotización sin modificar la biblioteca.
- **Carga inicial:** crea los sistemas que aparecen en los ejemplos (Epoxy Terrazzo, Sikafloor 264, Sikagard Hygiene HD Wall Coating, Sikafloor TG + Joint Repair, Re-Flake, etc.).
- **Catálogo para T&M (sin precios):** nombres de materiales y equipos con su unidad (Kit, Box, Ea), y posiciones de mano de obra. Las cantidades, tarifas y precios se escriben en cada cotización.

## 11. Historial y gestión

- **Historial** con búsqueda por número, contractor, proyecto, contacto, fecha y quien la preparó.
- **Estados:** Borrador, Enviada, Aprobada, Rechazada.
- **Duplicar:** crea una cotización nueva con el próximo número y la fecha de hoy, copiando todo lo demás.
- **Crear revisión:** mantiene el número y agrega REV I, REV II... La versión anterior queda guardada y no se puede modificar.
- **Copia congelada:** cada cotización guarda su propia copia de términos, scope y datos del perfil al momento de crearla. Editar la biblioteca o los términos no cambia cotizaciones existentes.
- **Registro de cambios:** guardar quién modificó qué y cuándo en la biblioteca, los términos y los perfiles.
- Los PDF no se guardan en la nube; se generan de nuevo a partir de los datos cuando se necesiten.

## 12. Enviar por email

- Usar la Web Share API con el PDF adjunto (`navigator.canShare({ files })`). En iPad abre el menú de compartir con el PDF.
- Si el navegador no lo permite: descargar el PDF con su nombre correcto y abrir un `mailto:` con destinatario, asunto (ej. "Proposal 223-26 – Kenvue Blender No.1 Replacement") y mensaje predeterminado.
- Al enviar, ofrecer cambiar el estado a "Enviada".

## 13. Offline y sincronización

- Firestore con caché persistente (multi-pestaña).
- Todo funciona sin conexión excepto asignar el número oficial y enviar el email.
- Indicador visible del estado de conexión y de cambios pendientes por sincronizar.
- El service worker guarda la app completa, incluyendo fuentes y logo, para abrir sin internet.

## 14. Seguridad

- Solo usuarios autenticados que estén en la lista de usuarios permitidos pueden leer o escribir. Escribe reglas de Firestore que lo garanticen y pruébalas.
- No hay registro público: los usuarios se crean desde la consola de Firebase o desde la app por un usuario existente.

## 15. PWA

- Manifest con nombre, `display: standalone`, iconos 192, 512 y maskable generados del logo, y `apple-touch-icon` para iPad.
- En Chrome/Edge desktop: botón propio de "Instalar app".
- En iPad: pantalla con instrucciones para "Agregar a pantalla de inicio".
- Interfaz cómoda para pantalla táctil en iPad y para mouse y teclado en desktop.

## 16. Tipografía

Las cotizaciones actuales usan una fuente condensada (parece Bahnschrift) y una letra manuscrita para la firma. Verifica qué fuentes usan los .docx. Las fuentes deben ir incluidas dentro de la app para que el PDF se vea igual en iPad. Si la licencia de alguna no lo permite, propón una alternativa gratuita muy parecida y muéstrame la comparación antes de decidir.

## 17. Fases de trabajo

Trabaja por fases. **Al terminar cada fase, detente, muéstrame qué hiciste, cómo probarlo, y espera mi aprobación antes de seguir.** Haz commit al final de cada fase.

1. **Base del proyecto:** crear el proyecto, estructura de carpetas, README con instrucciones. Leer y resumir los archivos de referencia.
2. **Cálculos:** modelos de datos y funciones de cálculo con todos los casos de prueba de la sección 6.5 pasando.
3. **PDF:** generar los 4 tipos con datos de los ejemplos. Renderiza tus PDFs a imagen y compáralos con los de `referencia/ejemplos/` hasta que coincidan.
4. **Formularios:** crear y editar cotizaciones de cada tipo con vista previa del PDF. Guardado local.
5. **Biblioteca, términos y perfiles:** con la carga inicial de la sección 10.
6. **Firebase:** inicio de sesión, sincronización, offline, numeración con transacciones, reglas de seguridad. Explícame paso a paso lo que tengo que configurar yo en la consola de Firebase.
7. **Historial y gestión:** búsqueda, estados, duplicar, revisiones, registro de cambios, enviar por email.
8. **PWA y publicación:** instalación en desktop e iPad, funcionamiento offline completo, publicación en Firebase Hosting.

Si algo de esta especificación no está claro o encuentras una contradicción con los ejemplos, pregúntame antes de asumir.
