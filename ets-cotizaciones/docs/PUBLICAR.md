# Publicar la app e instalarla

La app se publica en **Firebase Hosting** (gratis) en:

- **https://ets-cotizaciones.web.app**
- (también https://ets-cotizaciones.firebaseapp.com)

Después de publicarla ya no hace falta PowerShell ni `npm run dev` para usarla: se abre desde
esa dirección o desde el ícono instalado.

---

## A. Publicación automática con GitHub (recomendada)

GitHub compila, prueba y publica la app **en la nube** cada vez que se fusiona un pull request en
`main`. Tu computadora no tiene que compilar nada. Si alguna prueba falla, **no** se publica.

Se configura **una sola vez** (unos 10 minutos):

### A1. Crear la "cuenta de servicio" (la llave que usa GitHub para publicar)

1. Entra con el Gmail de la empresa a:
   **https://console.cloud.google.com/iam-admin/serviceaccounts?project=ets-cotizaciones**
2. Pulsa **+ Crear cuenta de servicio**.
3. Nombre: `github-publicar` → **Crear y continuar**.
4. En **Seleccionar un rol** agrega estos dos (usa el buscador de roles):
   - **Administrador de Firebase** (*Firebase Admin*)
   - **Consumidor de Service Usage** (*Service Usage Consumer*)
5. **Continuar** → **Listo**.
6. En la lista, haz clic en `github-publicar@…` → pestaña **Claves** → **Agregar clave** →
   **Crear clave nueva** → **JSON** → **Crear**. Se descarga un archivo `.json`.

> ⚠️ Ese archivo es una **llave secreta**: no lo mandes por chat ni por email. Solo se pega en GitHub
> (paso A2) y después se borra.

### A2. Guardar la llave en GitHub

1. Abre **https://github.com/bryanrivera-ets/ets-cotizaciones/settings/secrets/actions**
2. **New repository secret**.
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Secret: abre el archivo `.json` descargado con el **Bloc de notas**, selecciona todo (Ctrl + A),
   copia (Ctrl + C) y pégalo aquí (Ctrl + V).
5. **Add secret**.
6. Borra el archivo `.json` de tu carpeta Descargas (y de la papelera).

### A3. Publicar

- **Automático:** cada vez que fusiones un pull request en `main`.
- **A mano:** https://github.com/bryanrivera-ets/ets-cotizaciones/actions/workflows/publicar.yml →
  **Run workflow** → **Run workflow**.

En la pestaña **Actions** de GitHub ves el avance (unos 2–3 minutos). ✅ verde = publicada en
**https://ets-cotizaciones.web.app**. ❌ rojo = algo falló y no se publicó (la versión anterior sigue
funcionando).

## B. Publicar desde tu computadora (alternativa)

Solo si la computadora tiene memoria suficiente (en algunas falla con "heap out of memory").

```bash
npx firebase login
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
