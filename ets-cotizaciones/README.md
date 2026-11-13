# ETS Cotizaciones (PWA)

App para crear las cotizaciones (proposals) de **ETS Corp. – Epoxy Technologies Systems**.
La especificación completa está en [`ESPECIFICACION.md`](./ESPECIFICACION.md) y el resumen de los
archivos de referencia en [`docs/RESUMEN-REFERENCIA.md`](./docs/RESUMEN-REFERENCIA.md).

## Estado

| Fase | Descripción | Estado |
|---|---|---|
| 1 | Base del proyecto, estructura, README, resumen de referencias | ✅ |
| 2 | Modelos de datos y cálculos (Vitest) | ✅ |
| 3 | Generación de PDF de los 4 tipos ([resultados](./docs/fase3/README.md)) | ✅ |
| 4 | Formularios con vista previa y guardado local | ✅ |
| 5 | Biblioteca de sistemas, catálogo T&M, términos y perfiles (Configuración) | ✅ |
| 6 | Firebase: login, sincronización offline, numeración, reglas ([configurar](./docs/FIREBASE-CONFIGURACION.md)) | ✅ (falta conectar tu proyecto) |
| 7 | Historial con búsqueda, estados, duplicar, revisiones, registro de cambios, enviar por email | ✅ |
| 8 | PWA (instalar en desktop e iPad), offline completo y publicación ([cómo publicar](./docs/PUBLICAR.md)) | ✅ (falta correr `npm run deploy` con tu cuenta) |

## Requisitos

- Node.js 20 o superior (probado con Node 22) y npm.

## Comandos

Todos se ejecutan dentro de esta carpeta (`ets-cotizaciones/`).

```bash
npm install          # instala dependencias (solo la primera vez)
npm run dev          # servidor de desarrollo en http://localhost:5173
npm test             # pruebas (Vitest)
npm run typecheck    # verificación de tipos TypeScript
npm run lint         # revisión de código (oxlint)
npm run build        # compila la versión de producción en dist/
npm run preview      # sirve la versión de producción localmente
npm run test:rules   # prueba las reglas de seguridad de Firestore (inicia el emulador; requiere Java)
npm run emulators    # emuladores de Firebase (auth + firestore) para desarrollo
npm run dev:emu      # la app conectada a los emuladores (en otra ventana)
npm run deploy       # compila y publica en Firebase Hosting + reglas (antes: npx firebase login)
npm run pdf:examples # genera los PDF de los 6 ejemplos en out/pdf/
npm run pdf:compare  # compara out/pdf/ con referencia/ejemplos/ (Python 3 + pymupdf + Pillow)
```

## Publicación

La app se publica en **https://ets-cotizaciones.web.app** con `npm run deploy`. Pasos e instalación en desktop / iPad: [`docs/PUBLICAR.md`](./docs/PUBLICAR.md).

## Firebase

- Sin archivo `.env`, la app funciona en **modo local** (todo se guarda solo en ese navegador).
- Con `.env` (ver `.env.example`), usa Firebase: inicio de sesión, datos compartidos, offline y numeración.
- Pasos en la consola: [`docs/FIREBASE-CONFIGURACION.md`](./docs/FIREBASE-CONFIGURACION.md).
- Reglas de seguridad: [`firestore.rules`](./firestore.rules), probadas en `tests/rules/`.

## Estructura

```
ets-cotizaciones/
├── ESPECIFICACION.md        especificación del proyecto
├── assets/                  logo original
├── referencia/ejemplos/     PDF reales usados como modelo
├── docs/                    documentación (resumen de referencias, guías)
├── public/                  archivos estáticos (logo, fuentes, iconos PWA)
│   └── fonts/               fuentes libres incluidas en la app (ver LICENCIAS.md)
├── scripts/                 generar y comparar los PDF de ejemplo
└── src/
    ├── app/                 App principal, navegación y layout
    ├── domain/              modelos de datos y cálculos puros (dinero en centavos) + pruebas
    ├── pdf/                 plantillas del PDF (@react-pdf/renderer)
    ├── features/
    │   ├── quotes/          formularios de cotización y vista previa
    │   ├── library/         biblioteca de sistemas y catálogo T&M
    │   ├── terms/           términos y condiciones
    │   ├── profiles/        perfiles de usuario y firmantes
    │   └── history/         historial, búsqueda, estados, revisiones
    ├── services/            Firebase, almacenamiento local, numeración, email
    ├── ui/                  componentes reutilizables
    └── styles/              estilos globales
```

## Stack

React + TypeScript + Vite · vite-plugin-pwa · Firebase (Auth, Firestore offline, Hosting) ·
@react-pdf/renderer · Vitest.
