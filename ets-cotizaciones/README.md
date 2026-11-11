# ETS Cotizaciones (PWA)

App para crear las cotizaciones (proposals) de **ETS Corp. – Epoxy Technologies Systems**.
La especificación completa está en [`ESPECIFICACION.md`](./ESPECIFICACION.md) y el resumen de los
archivos de referencia en [`docs/RESUMEN-REFERENCIA.md`](./docs/RESUMEN-REFERENCIA.md).

## Estado

| Fase | Descripción | Estado |
|---|---|---|
| 1 | Base del proyecto, estructura, README, resumen de referencias | ✅ |
| 2 | Modelos de datos y cálculos (Vitest) | pendiente |
| 3 | Generación de PDF de los 4 tipos | pendiente |
| 4 | Formularios con vista previa y guardado local | pendiente |
| 5 | Biblioteca de sistemas, términos y perfiles | pendiente |
| 6 | Firebase: login, sincronización, numeración, reglas | pendiente |
| 7 | Historial, estados, duplicar, revisiones, email | pendiente |
| 8 | PWA, offline completo y publicación | pendiente |

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
```

## Estructura

```
ets-cotizaciones/
├── ESPECIFICACION.md        especificación del proyecto
├── assets/                  logo original
├── referencia/ejemplos/     PDF reales usados como modelo
├── docs/                    documentación (resumen de referencias, guías)
├── public/                  archivos estáticos (logo, fuentes, iconos PWA)
│   └── fonts/               fuentes incluidas en la app (Fase 3)
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
