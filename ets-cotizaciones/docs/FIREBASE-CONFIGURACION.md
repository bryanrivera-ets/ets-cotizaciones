# Configurar Firebase (una sola vez, ~15 minutos)

Usa el **Gmail que creaste para la empresa**. Todo esto es gratis (plan Spark): no pide tarjeta.
La consola puede verse en inglés o en español; pongo los dos nombres.

---

## Paso 1 – Crear el proyecto

1. Entra a **https://console.firebase.google.com** con el Gmail de la empresa.
2. Pulsa **Crear un proyecto** (*Create a project*).
3. Nombre: `ets-cotizaciones` → **Continuar**.
4. **Google Analytics:** desactívalo (no hace falta) → **Crear proyecto** → espera → **Continuar**.

## Paso 2 – Registrar la app web y copiar la configuración

1. En la página principal del proyecto, pulsa el ícono **`</>`** (Web).
2. Apodo: `ETS Cotizaciones`.
3. **No** marques "Firebase Hosting" todavía (eso es en la Fase 8).
4. Pulsa **Registrar app**.
5. Aparece un bloque de código con `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }`.
   **Cópialo completo y mándamelo** (o haz una captura).
   > Estos valores **no son secretos**: solo identifican el proyecto. La seguridad la dan las reglas del Paso 5.
6. Pulsa **Ir a la consola**.

## Paso 3 – Activar el inicio de sesión con email y contraseña

1. Menú izquierdo: **Compilación → Authentication** (*Build → Authentication*) → **Comenzar** (*Get started*).
2. Pestaña **Método de acceso** (*Sign-in method*) → **Correo electrónico/contraseña** (*Email/Password*).
3. Activa **solo el primer interruptor** ("Correo electrónico/contraseña"). El segundo ("Vínculo de correo electrónico") déjalo apagado.
4. **Guardar**.
5. Pestaña **Usuarios** (*Users*) → **Agregar usuario** (*Add user*):
   - Email: **tu email de trabajo** (el que usarás para entrar a la app).
   - Contraseña: la que quieras (mínimo 6 caracteres).
   - **Agregar usuario**.

   Con tu usuario basta: a las demás personas las agregas después **desde la app** (Configuración → Usuarios).

## Paso 4 – Crear la base de datos (Firestore)

1. Menú izquierdo: **Compilación → Firestore Database** → **Crear base de datos** (*Create database*).
2. Si pregunta la edición, escoge **Standard**.
3. **Ubicación** (no se puede cambiar después): escoge **`nam5 (United States)`**.
4. Modo: **Iniciar en modo de producción** (*Start in production mode*) → **Crear**.

## Paso 5 – Pegar las reglas de seguridad

1. En Firestore Database, pestaña **Reglas** (*Rules*).
2. Borra todo lo que hay en el editor.
3. Abre el archivo [`firestore.rules`](../firestore.rules) de este proyecto (en GitHub o en tu computadora), copia **todo** su contenido y pégalo en el editor.
4. Pulsa **Publicar** (*Publish*).

Estas reglas hacen que **solo** los usuarios con sesión iniciada **y** que estén en la lista de autorizados puedan leer o escribir algo.

## Paso 6 – Autorizarte a ti mismo (el primer usuario)

La lista de autorizados vive en la base de datos. El primero hay que ponerlo a mano; los demás, desde la app.

1. Firestore Database → pestaña **Datos** (*Data*) → **Iniciar colección** (*Start collection*).
2. ID de la colección: `allowedUsers` → **Siguiente**.
3. ID del documento: **tu email en minúsculas** (exactamente el mismo del Paso 3), por ejemplo `eric@ejemplo.com`.
4. Agrega estos campos (tipo **string**):

   | Campo | Valor |
   |---|---|
   | `email` | tu email en minúsculas (igual al ID del documento) |
   | `name` | tu nombre |
   | `profileId` | `dmr` o `csn` (opcional: tu perfil por defecto) |

5. **Guardar**.

## Paso 7 – Mándame la configuración

Envíame el bloque `firebaseConfig` del Paso 2. Yo lo pongo en el proyecto (archivo `.env`), y desde ese momento la app usa la nube.

---

## Después de conectar

1. Abre la app y entra con tu email y contraseña.
2. **Configuración → Numeración**: escribe el **próximo número** que debe salir este año (por ejemplo `453` si la última cotización fue la 452-26) → **Guardar**.
3. **Configuración → Usuarios**: agrega a las demás personas (email, nombre, perfil y una contraseña inicial). Cada una puede cambiar su contraseña con "Olvidé mi contraseña" en la pantalla de entrada.
4. Si personalizaste sistemas, términos o perfiles mientras probabas en tu computadora (modo local), esos cambios **no** se suben solos: vuelve a hacerlos una vez conectados (la carga inicial sí aparece sola).

## Preguntas frecuentes

- **¿Cuesta algo?** No. Para 2–3 personas el uso queda muy por debajo de los límites gratis.
- **¿Funciona sin internet?** Sí. La primera vez en cada dispositivo hay que entrar con internet; después la app abre y trabaja sin conexión, y sube los cambios sola al reconectar. El número oficial y el envío por email sí necesitan conexión.
- **¿Qué pasa si quito a alguien?** Pierde el acceso al instante (aunque conserve su contraseña). Para borrar su cuenta del todo: Authentication → Usuarios → ⋮ → Eliminar cuenta.
- **¿Puede alguien registrarse solo?** Aunque alguien creara una cuenta, **no puede ver ni cambiar nada** si no está en `allowedUsers`. Si quieres bloquear incluso la creación de cuentas: Authentication → Configuración → *Acciones del usuario* → desactiva "Habilitar creación (registro)". En ese caso las cuentas nuevas se crean solo desde la consola (Paso 3.5) y en la app solo se autoriza el email (sin contraseña).
