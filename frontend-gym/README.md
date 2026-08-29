# Claude Lovers Gym — Frontend

Front-end del sistema de gestión de gimnasio.
Proyecto de laboratorio de **Teoría de Sistemas 1**, Grupo 1 · CUNOC · USAC · Segundo semestre 2026.

- **Framework:** Angular 21 (standalone + signals, sin Zone.js)
- **Backend:** Spring Boot 4 (repositorio aparte)
- **Base de datos:** MariaDB
- **Dominio:** claudelovers.solairy.app

## Puesta en marcha

```bash
npm install
npm start            # servidor de desarrollo en http://localhost:4200/
npm run build        # compilación de producción a dist/
npm test             # pruebas unitarias con Vitest
```

## Credenciales de prueba

Mientras el backend no esté conectado (`environment.useMockAuth = true`), el login
acepta estos usuarios simulados:

| Rol           | Correo                     | Contraseña     |
| ------------- | -------------------------- | -------------- |
| Administrador | admin@claudelovers.com     | `admin123`     |
| Recepción     | recepcion@claudelovers.com | `recepcion123` |
| Socio         | socio@claudelovers.com     | `socio123`     |

Para apuntar al backend real, poner `useMockAuth: false` en
`src/environments/environment.ts` y levantar la API en `http://localhost:8080/api/v1`.

## Estructura del proyecto

```
src/
├── environments/            # apiUrl y banderas por entorno (dev / prod)
├── styles/                  # tokens.css, base.css, utilities.css
├── styles.css               # punto de entrada de estilos globales
└── app/
    ├── core/                # lo que se usa en toda la app (una sola instancia)
    │   ├── constants/       # rutas de la API y de la SPA
    │   ├── guards/          # authGuard, guestGuard, rolGuard
    │   ├── interceptors/    # token JWT y manejo de errores HTTP
    │   ├── models/          # interfaces del dominio (basadas en el ER)
    │   └── services/        # AuthService, StorageService
    ├── shared/              # piezas reutilizables (navbar, footer, utilidades)
    ├── layouts/             # public-layout (sitio) y dashboard-layout (panel)
    └── features/            # una carpeta por funcionalidad
        ├── home/            # landing page + su contenido
        ├── auth/            # login
        └── dashboard/       # área privada
```

Convención: cada feature nueva se crea como `features/<nombre>/pages/<pagina>/`
y se registra con carga diferida en `src/app/app.routes.ts`.

## Rutas

| Ruta         | Acceso                   | Descripción               |
| ------------ | ------------------------ | ------------------------- |
| `/`          | Público                  | Landing page del gimnasio |
| `/login`     | Solo sin sesión          | Inicio de sesión          |
| `/dashboard` | Requiere sesión iniciada | Panel de control          |

## Paleta de colores (Ficha de arranque, Sprint 0)

| Uso        | HEX       | Variable CSS        |
| ---------- | --------- | ------------------- |
| Primario   | `#101D42` | `--color-primary`   |
| Secundario | `#6E6A6F` | `--color-secondary` |
| Acento     | `#035E7B` | `--color-accent`    |
| Fondo      | `#FFFFFF` | `--color-bg`        |
| Texto      | `#000000` | `--color-text`      |

Tipografía principal: **Arial** (`--font-base`).
Todos los tokens están en [`src/styles/tokens.css`](src/styles/tokens.css); no se
deben escribir colores en HEX dentro de los componentes.

## Documentación

- [docs/estructura.md](docs/estructura.md) — guía de carpetas y convenciones del equipo.
