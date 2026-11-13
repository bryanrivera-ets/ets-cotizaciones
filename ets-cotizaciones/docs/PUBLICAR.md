# Publicar la app e instalarla

La app se publica en **Firebase Hosting** (gratis) en:

- **https://ets-cotizaciones.web.app**
- (también https://ets-cotizaciones.firebaseapp.com)

Después de publicarla ya no hace falta PowerShell ni `npm run dev` para usarla: se abre desde
esa dirección o desde el ícono instalado.

---

## A. Publicar (la primera vez)

En PowerShell, dentro de la carpeta del proyecto:

```bash
cd "C:\Users\Eric B Rivera\ets-app\ets-cotizaciones"
```

1. Bajar lo último e instalar:

   ```bash
   git pull
   ```

   ```bash
   npm install
   ```

2. Conectar la herramienta de Firebase con tu cuenta (**solo la primera vez**). Se abre el navegador:
   entra con el **Gmail de la empresa** (`etscorp.cotizaciones@gmail.com`) y pulsa **Permitir**.
   Si pregunta si quieres enviar información de uso a Google, puedes contestar **n** (no).

   ```bash
   npx firebase login
   ```

3. Publicar:

   ```bash
   npm run deploy
   ```

   Esto compila la app y sube a Firebase **la app** y **las reglas de seguridad**
   (desde ahora ya no hay que copiar y pegar las reglas a mano).
   Al terminar muestra `✔ Deploy complete!` y la dirección `https://ets-cotizaciones.web.app`.

> Si aparece un error que dice que Hosting no está activado, entra a la consola de Firebase →
> **Compilación → Hosting → Comenzar**, pulsa *Siguiente* en todos los pasos (no hace falta
> ejecutar nada de lo que muestra) y vuelve a correr `npm run deploy`.

## B. Publicar una versión nueva (cada vez que haya cambios)

```bash
git pull
```

```bash
npm run deploy
```

Quien tenga la app abierta verá el aviso **"Hay una versión nueva — Actualizar"**.

---

## C. Instalar en cada dispositivo

La primera vez en cada dispositivo hace falta internet para entrar con email y contraseña.
Después la app abre y funciona sin conexión.

### Computadora (Windows o Mac) con Chrome o Edge
1. Abre **https://ets-cotizaciones.web.app** y entra.
2. Pulsa **⤓ Instalar app** (arriba a la derecha) → **Instalar**.
3. Queda un acceso directo en el escritorio / menú Inicio (Windows) o en Aplicaciones (Mac),
   y se abre en su propia ventana.

### iPad
1. Abre **https://ets-cotizaciones.web.app** en **Safari** y entra.
2. Toca **Compartir** (cuadrado con flecha hacia arriba) → **Agregar a pantalla de inicio** → **Agregar**.
3. Abre la app desde el ícono **Cotizaciones**.

En la app hay una página con estas instrucciones: botón **⤓ Instalar** o la dirección
`https://ets-cotizaciones.web.app/#/instalar`.

---

## Qué funciona sin internet

| Funciona sin conexión | Necesita conexión |
|---|---|
| Abrir la app (después de la primera vez) | Entrar por primera vez en un dispositivo |
| Ver, buscar, crear y editar cotizaciones | Recibir el número oficial (llega solo al reconectar) |
| Vista previa y descarga del PDF | Crear una revisión (REV) |
| Configuración (sistemas, términos, perfiles) | Enviar el email |
| Duplicar | Agregar usuarios / cambiar la numeración |

Todo lo que se cambie sin conexión se sube solo al volver el internet (arriba se ve
"Sin conexión · N cambios sin subir").
