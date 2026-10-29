# Manual Técnico — Frontend Claude Lovers Gym

Sistema web de administración del gimnasio Claude Lovers Gym. Este documento describe cómo
preparar el entorno, configurar, ejecutar, compilar y mantener el **frontend** (aplicación
Angular ubicada en `frontend-gym/`). El backend (Spring Boot) vive en el repositorio
`Backend_Gym_Teo1` y se documenta por separado.

## Contenido

1. [Resumen del sistema](#1-resumen-del-sistema)
2. [Requisitos de entorno](#2-requisitos-de-entorno)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Comandos de ejecución](#4-comandos-de-ejecución)
5. [Estructura del programa](#5-estructura-del-programa)
6. [Vistas del sistema](#6-vistas-del-sistema)
7. [Manejo de rutas y API](#7-manejo-de-rutas-y-api)
8. [Pruebas automatizadas](#8-pruebas-automatizadas)
9. [Despliegue](#9-despliegue)
10. [Solución de problemas](#10-solución-de-problemas)

---

## 1. Resumen del sistema

| Aspecto            | Detalle                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| Framework          | Angular 21 (componentes *standalone*, *signals*, control de flujo `@if`/`@for`) |
| Lenguaje           | TypeScript 5.9                                                          |
| Estilos            | Bootstrap 5.3 + Bootstrap Icons 1.13 + hojas propias (`src/styles/`)    |
| Gráficos           | Highcharts 13                                                           |
| Peticiones HTTP    | `HttpClient` de Angular con interceptores funcionales                   |
| Pruebas unitarias  | Vitest 4 + jsdom (builder `@angular/build:unit-test`)                   |
| Servidor en producción | Nginx (imagen Docker), que además hace de proxy hacia el backend    |

Roles que maneja la interfaz: **ADMIN**, **RECEPCIONISTA** (también aceptado como `RECEPCION`),
**ENTRENADOR** y **CLIENTE** (socio, también aceptado como `SOCIO`). Cada rol ve un menú y
una pantalla de inicio distintos (ver [sección 7.2](#72-rutas-protegidas-área-privada)).

---

## 2. Requisitos de entorno

### 2.1 Herramientas

| Herramienta     | Versión requerida                     | Notas |
| --------------- | ------------------------------------- | ----- |
| **Node.js**     | **22.12.0** (LTS 22)                  | Es la versión que usan el pipeline de CI (`actions/setup-node`, `node-version: '22'`) y la imagen Docker (`node:22-alpine`). Está fijada en `frontend-gym/.nvmrc`. Angular 21 también acepta `^20.19.0` o `>=24.0.0`. |
| **npm**         | **11.6.0**                            | Gestor de paquetes oficial del proyecto (campo `packageManager` de `package.json`). **No** se usan yarn ni pnpm: el archivo de bloqueo es `package-lock.json`. |
| Angular CLI     | 21.2.x                                | Se instala como dependencia del proyecto; se ejecuta con `npx ng` o mediante los scripts de npm. No hace falta instalarlo de forma global. |
| Git             | 2.30 o superior                        | Para clonar y trabajar con ramas y *pull requests*. |
| Docker + Docker Compose (opcional) | Docker 24+ / Compose v2 | Solo para levantar el sistema completo (base de datos, backend y frontend) en contenedores. |
| Backend         | Repositorio `Backend_Gym_Teo1`         | Para el desarrollo local, la API debe responder en `http://localhost:8080`. |

Con `nvm` se puede seleccionar la versión exacta de Node desde la carpeta del proyecto:

```bash
cd frontend-gym
nvm install   # lee .nvmrc (22.12.0)
nvm use
node -v       # v22.12.0
npm -v        # 11.6.0 (si no coincide: npm install -g npm@11.6.0)
```

### 2.2 Navegadores soportados

Angular 21 compila para los navegadores **"Baseline widely available"**. Las versiones mínimas
con las que se genera el código del proyecto son:

| Navegador             | Versión mínima |
| --------------------- | -------------- |
| Google Chrome         | 111            |
| Microsoft Edge        | 111            |
| Mozilla Firefox       | 112            |
| Safari (macOS)        | 16.4           |
| Safari (iOS / iPadOS) | 16.4           |
| Chrome para Android   | Versión actual |
| Firefox para Android  | Versión actual |

Internet Explorer no está soportado. La interfaz es *responsive* (cuadrícula de Bootstrap) y
se probó en escritorio y en teléfono móvil.

---

## 3. Variables de entorno

El proyecto maneja dos tipos de configuración, y es importante no confundirlos:

1. **Entornos de Angular** (`frontend-gym/src/environments/`): se incrustan en el JavaScript
   **al compilar**. Todo lo que se escriba ahí lo puede ver cualquier usuario en el navegador,
   así que **nunca** deben contener contraseñas, llaves ni secretos.
2. **Archivo `.env`** (raíz del repositorio): lo lee **Docker Compose** al levantar los
   contenedores. Contiene la configuración de la base de datos y del backend. El navegador
   nunca lo recibe.

### 3.1 Entornos de Angular

| Archivo                 | Se usa en                                         | `apiUrl` |
| ----------------------- | ------------------------------------------------- | -------- |
| `environment.ts`        | `npm run dev` / `npm start` (configuración `development`) | `http://localhost:8080` (backend local) |
| `environment.prod.ts`   | `npm run build` (configuración `production`)      | `/api` (ruta relativa: Nginx la redirige al backend) |

El reemplazo de un archivo por otro lo hace `angular.json` mediante `fileReplacements` en la
configuración `production`.

| Propiedad      | Tipo    | Descripción |
| -------------- | ------- | ----------- |
| `production`   | boolean | `true` en la compilación de producción. |
| `apiUrl`       | string  | Base de todas las URL de la API (`core/constants/api.constants.ts`). En producción es relativa (`/api`) para no depender de la IP del servidor ni de CORS. |
| `useMockAuth`  | boolean | Muestra el modo demostración en la pantalla de inicio de sesión. Debe ser `false` cuando se trabaja con el backend real. |
| `appName`      | string  | Nombre visible de la aplicación. |

Para apuntar a otro backend en desarrollo, basta con cambiar `apiUrl` en `environment.ts`.

### 3.2 Archivo `.env` (Docker Compose)

Se adjunta la plantilla [`.env.example`](../.env.example). Para usarla:

```bash
cp .env.example .env
# editar .env y reemplazar las contraseñas y el JWT_SECRET por valores propios
```

El archivo `.env` real **no se sube al repositorio**. Todas las variables tienen un valor por
defecto en `docker-compose.yml`, de modo que el sistema arranca aunque falte alguna; en un
servidor real se deben definir todas.

| Variable                  | Usada por            | Descripción | Ejemplo |
| ------------------------- | -------------------- | ----------- | ------- |
| `DB_NAME`                 | MariaDB y backend    | Nombre de la base de datos. | `gymdb` |
| `DB_USER`                 | MariaDB y backend    | Usuario de la base de datos. | `gymuser` |
| `DB_PASSWORD`             | MariaDB y backend    | Contraseña del usuario y del `root` de MariaDB. **Secreta.** Solo se aplica cuando el volumen se crea por primera vez; cambiarla después impide que el backend se conecte. | `cambiar-esta-clave` |
| `USER_SECURITY`           | Backend              | Usuario de la autenticación básica temporal de Spring Security. | `admin` |
| `PASSWORD_SECURITY`       | Backend              | Contraseña de esa autenticación temporal. **Secreta.** | `cambiar-esta-clave` |
| `JWT_SECRET`              | Backend              | Llave para firmar los tokens de sesión (hexadecimal de 64 caracteres). **Secreta.** Si cambia, todas las sesiones abiertas dejan de ser válidas. | `404E63...5970` |
| `JWT_EXPIRATION`          | Backend              | Vigencia del token, en milisegundos. | `86400000` (24 h) |
| `RESEND_API_KEY`          | Backend              | Llave de la API de Resend para enviar correos (recordatorios de vencimiento). **Secreta.** Si está vacía, no se envían correos. | `re_xxxxxxxx` |
| `RESEND_FROM`             | Backend              | Remitente de los correos. | `Gimnasio <onboarding@resend.dev>` |
| `DATA_INITIALIZER_ENABLED`| Backend              | Si es `true`, crea los usuarios de prueba cuando la tabla de usuarios está vacía. | `true` |
| `JAVA_TOOL_OPTIONS`       | Backend (opcional)   | Límites de memoria de la JVM, pensados para instancias pequeñas. | `-Xms128m -Xmx256m` |

---

## 4. Comandos de ejecución

Todos los comandos se ejecutan dentro de la carpeta `frontend-gym/`.

### 4.1 Instalación

```bash
cd frontend-gym
npm install
```

Para una instalación idéntica a la del archivo de bloqueo (recomendado en servidores de
integración continua) se puede usar `npm ci`.

### 4.2 Entorno local de desarrollo

```bash
npm run dev        # equivalente a: npm start  /  npx ng serve
```

- Abre la aplicación en **http://localhost:4200** con recarga automática al guardar cambios.
- Usa `environment.ts`, por lo que el backend debe estar escuchando en `http://localhost:8080`.
- Usuarios de prueba que crea el backend (contraseña `Admin123*`):

| Rol           | Correo                         |
| ------------- | ------------------------------ |
| Administrador | `clp64413@gmail.com`           |
| Recepción     | `maria.castro@gymdemo.com`     |
| Entrenador    | `alejandro.garcia@gymdemo.com` |
| Socio         | `lucia.hernandez@gymdemo.com`  |

### 4.3 Compilación para producción

```bash
npm run build      # equivalente a: npx ng build (configuración production)
```

- Genera los archivos estáticos en `frontend-gym/dist/frontend-gym/browser/`.
- Aplica minificación, *tree shaking*, nombres con *hash* para la caché y `environment.prod.ts`.
- Límites de tamaño configurados en `angular.json`: aviso a partir de 1.5 MB y error a partir
  de 3 MB en la carga inicial; aviso a partir de 20 kB y error a partir de 40 kB por hoja de
  estilos de componente.

### 4.4 Otros comandos

| Comando                  | Uso |
| ------------------------ | --- |
| `npm test`               | Ejecuta las pruebas unitarias en modo observación. |
| `npx ng test --no-watch` | Ejecuta las pruebas una sola vez (así corre en el CI). |
| `npm run watch`          | Compila en modo desarrollo cada vez que cambia un archivo. |
| `npx prettier --write src` | Da formato al código según `.prettierrc`. |

### 4.5 Sistema completo con Docker

Desde la raíz del repositorio (con `Backend_Gym_Teo1` clonado al mismo nivel que
`Frontend_Gym_Teo1`):

```bash
cp .env.example .env
docker compose up --build -d
```

| Servicio       | Contenedor     | Puerto local |
| -------------- | -------------- | ------------ |
| Frontend (Nginx) | `gym_frontend` | http://localhost:4200 |
| Backend        | `gym_backend`  | http://localhost:8080 |
| MariaDB        | `gym_db`       | 3306 |

---

## 5. Estructura del programa

### 5.1 Árbol de carpetas

```text
Frontend_Gym_Teo1/
├── .env.example                 Plantilla de variables para Docker Compose
├── docker-compose.yml           Base de datos + backend + frontend
├── docs/
│   └── MANUAL_TECNICO.md        Este documento
├── .github/workflows/
│   ├── ci.yml                   Instala, prueba y compila en cada push/PR a main y develop
│   └── cd.yml                   Publica la imagen en GHCR y despliega en EC2 (rama main)
└── frontend-gym/
    ├── .nvmrc                   Versión de Node.js del proyecto
    ├── angular.json             Configuración de compilación, servidor y pruebas
    ├── package.json             Dependencias y scripts de npm
    ├── Dockerfile               Compilación (Node 22) + servidor Nginx
    ├── nginx.conf               SPA, caché de recursos y proxy /api -> backend
    ├── docs/estructura.md       Convenciones de código del equipo
    ├── public/                  Archivos estáticos (favicon, imágenes)
    └── src/
        ├── index.html           Página base
        ├── main.ts              Punto de entrada: arranca la aplicación
        ├── styles.css           Estilos globales
        ├── styles/              tokens.css (colores, tipografía, espacios), base.css, utilities.css
        ├── environments/        environment.ts (desarrollo) y environment.prod.ts (producción)
        └── app/
            ├── app.ts / app.html    Componente raíz: <router-outlet> + avisos flotantes
            ├── app.config.ts        Proveedores: router, HttpClient e interceptores
            ├── app.routes.ts        Tabla de rutas (sección 7)
            ├── core/                Lógica global y única en toda la aplicación
            │   ├── constants/       api.constants.ts (URL de la API), rutas.constants.ts
            │   ├── guards/          authGuard, guestGuard, rolGuard
            │   ├── interceptors/    authInterceptor (token), errorInterceptor (errores HTTP)
            │   ├── models/          Tipos e interfaces compartidas (usuario, auth, plan...)
            │   ├── services/        AuthService, StorageService, NotificacionService
            │   └── utils/           fechas.ts (cálculo de vencimientos y días)
            ├── shared/components/   Componentes visuales reutilizables
            │   ├── modal/           Ventana emergente con manejo de errores
            │   ├── toast-container/ Avisos flotantes (éxito, error, aviso)
            │   ├── grafico/         Envoltorio de Highcharts
            │   ├── navbar/, footer/ Encabezado y pie del sitio público
            │   └── socio-form/      Formulario de socio (reservado, sin uso actual)
            ├── layouts/
            │   ├── public-layout/   Envoltura del sitio público (navbar + footer)
            │   └── dashboard-layout/ Envoltura del área privada (menú por rol)
            └── features/            Una carpeta por módulo funcional
                ├── auth/            Inicio de sesión
                ├── home/            Página pública
                ├── dashboard/       Panel de administración y recepción
                ├── socios/          Gestión de miembros y portal del socio
                ├── planes/          Catálogo de planes
                ├── membresias/      Membresías y vencimientos
                ├── pagos/           Cobros, historial y comprobantes PDF
                ├── asistencia/      Control de acceso (entradas y salidas)
                ├── reportes/        Reportes de administración y de recepción
                ├── entrenador/      Espacio del entrenador
                └── usuarios/        Gestión de usuarios y perfil
```

Cada carpeta de `features/` sigue la misma organización interna:

```text
features/<modulo>/
├── pages/        Vistas enrutables (una por pantalla)
├── components/   Piezas visuales propias del módulo
├── services/     Acceso a la API del módulo
├── models/       Tipos e interfaces del módulo
├── utils/        Funciones puras (cálculos, armado de gráficos)
└── mocks/        Datos de ejemplo usados solo como respaldo o en pruebas
```

### 5.2 Equivalencias con la estructura solicitada

La rúbrica menciona carpetas típicas de React (`/components`, `/pages`, `/services`, `/hooks`,
`/types`). En Angular cada concepto tiene su lugar:

| Carpeta solicitada | Equivalente en este proyecto | Explicación |
| ------------------ | ---------------------------- | ----------- |
| `/src`             | `frontend-gym/src`           | Código fuente de la aplicación. |
| `/components`      | `app/shared/components/` y `app/features/*/components/` | Componentes reutilizables (globales o de un módulo). |
| `/pages`           | `app/features/*/pages/` y `app/layouts/` | Cada vista enrutable es un componente *standalone* cargado de forma diferida. |
| `/services`        | `app/core/services/` y `app/features/*/services/` | Clases `@Injectable` que encapsulan las llamadas HTTP y el estado compartido. |
| `/hooks`           | *Signals* (`signal`, `computed`, `effect`) dentro de componentes y servicios | Angular no tiene *hooks*: el estado reactivo se maneja con *signals* y la lógica reutilizable vive en servicios inyectables y en funciones de `utils/`. |
| `/types`           | `app/core/models/` y `app/features/*/models/` | Interfaces y tipos de TypeScript (archivos `*.model.ts`). |

Las convenciones de nombres y la forma de agregar una pantalla nueva están en
[`frontend-gym/docs/estructura.md`](../frontend-gym/docs/estructura.md).

---

## 6. Vistas del sistema

### 6.1 Vistas enrutables

| # | Ruta | Componente (`src/app/...`) | Roles | Descripción | Endpoints principales |
|---|------|----------------------------|-------|-------------|-----------------------|
| 1 | `/` | `features/home/pages/home-page` | Público | Página de presentación del gimnasio: servicios, planes, clases y llamado a iniciar sesión. | — (contenido de `home/data/home-content.ts`) |
| 2 | `/login` | `features/auth/pages/login` | Público (solo sin sesión) | Inicio de sesión con correo y contraseña; botones de acceso rápido con las cuentas de prueba. | `POST /auth/signin`, `GET /users/me` |
| 3 | `/dashboard` | `features/dashboard/pages/dashboard-home` | ADMIN, RECEPCIONISTA | Panel principal. Admin: indicadores y accesos a módulos. Recepción: marcaje rápido de entradas, asistencias del día y salida. Ambos: membresías por vencer. | `GET /socios`, `GET /planes`, `GET /asistencias/hoy`, `POST /asistencias/registro`, `POST /asistencias/{id}/salida`, `GET /membresias/proximas-a-vencer` |
| 4 | `/dashboard` | `features/socios/pages/portal-socio` | CLIENTE | Portal del socio: datos personales, membresía activa, aviso de vencimiento, último pago con desglose y comprobante, historial de pagos y de asistencias (hora de entrada y salida), carné digital. | `GET /socios/me`, `GET /membresias/me/activa`, `GET /pagos/socio/{id}`, `GET /pagos/{id}/pdf`, `GET /asistencias/me` |
| 5 | `/dashboard/portal-socio` | `features/socios/pages/portal-socio` | CLIENTE | Misma vista que la anterior, con dirección propia. | Igual que la vista 4 |
| 6 | `/dashboard` | `features/entrenador/pages/espacio-entrenador` | ENTRENADOR | Espacio del entrenador: socios asignados, socios dentro del gimnasio, rutinas semanales (crear, editar, eliminar), reportes personales y progreso de mediciones. | `GET/POST/PUT/DELETE /entrenadores/me/...` (ver `features/entrenador/API-CONTRACT.md`) |
| 7 | `/dashboard/entrenador` | `features/entrenador/pages/espacio-entrenador` | ENTRENADOR | Misma vista que la anterior, con dirección propia. | Igual que la vista 6 |
| 8 | `/dashboard/socios` | `features/socios/pages/lista-socios` | ADMIN, RECEPCIONISTA | Gestión de miembros: búsqueda, filtros por estado, alta, edición, baja o eliminación, reactivación y asignación de plan. | `GET/POST/PUT/DELETE /socios`, `PATCH /socios/{id}/reactivar`, `POST /membresias` |
| 9 | `/dashboard/planes` | `features/planes/pages/lista-planes` | ADMIN, RECEPCIONISTA (edición solo ADMIN) | Catálogo de planes: crear, editar, eliminar y asignar un plan a un miembro con cálculo de vencimiento. | `GET/POST/PUT/DELETE /planes`, `POST /membresias` |
| 10 | `/dashboard/asistencia` | `features/asistencia/pages/registro-asistencia` | ADMIN, RECEPCIONISTA | Control de acceso (M6): entrada por ID o desde la lista, bloqueo con motivo si la membresía está vencida o inactiva o si el socio ya está dentro, registro de salida, gráfico de entradas por hora y tabla del día. | `GET /asistencias/hoy`, `POST /asistencias/registro`, `POST /asistencias/{id}/salida` |
| 11 | `/dashboard/membresias` | `features/membresias/pages/gestion-membresias` | ADMIN, RECEPCIONISTA | Membresías: crear, editar, cancelar con motivo, sucursales y bitácora de cambios. | `GET/POST /membresias`, `POST /membresias/{id}/cancelar`, `GET /planes` |
| 12 | `/dashboard/pagos` | `features/pagos/pages/gestion-pagos` | ADMIN, RECEPCIONISTA | Pagos y estado de cuenta: selección de socio, membresías, cotización del cobro (precio, descuento por promoción, recargo por pago tardío y total), registro del pago, historial y comprobante PDF. Acepta `?socio=ID` para abrir un socio directamente. | `GET /membresias/socio/{id}`, `GET /pagos/cotizacion/{id}`, `POST /pagos`, `GET /pagos/socio/{id}`, `GET /pagos/{id}/pdf`, `GET /pagos/metodos-pago` |
| 13 | `/dashboard/reportes` | `features/reportes/pages/reportes-dashboard` | ADMIN | Reportes completos: resumen ejecutivo, ingresos por mes y método de pago, miembros activos y morosos, renovaciones y afluencia. Permite imprimir. | `GET /reportes/dashboard`, `/reportes/ingresos`, `/reportes/miembros-estado`, `/reportes/renovaciones`, `/reportes/asistencias` |
| 14 | `/dashboard/reportes` | `features/reportes/pages/reportes-recepcion` | RECEPCIONISTA | Reportes de recepción **sin información financiera**: visitas del día, socios dentro, afluencia diaria (7, 14 o 30 días), activos frente a morosos, socios por plan y morosos para cobrar. | `GET /asistencias/metricas`, `GET /reportes/miembros-estado`, `GET /asistencias/hoy`, `GET /membresias/proximas-a-vencer` |
| 15 | `/dashboard/usuarios` | `features/usuarios/pages/gestion-usuarios` | ADMIN | Usuarios del sistema: alta con contraseña temporal, edición, cambio de rol y desactivación. | `GET/POST/PUT/DELETE /users`, `GET /roles` |
| 16 | `/dashboard/perfil` | `features/usuarios/pages/perfil-usuario` | Todos los roles con sesión | Perfil propio: datos de contacto y cambio de contraseña. | `GET/PUT /users/me` |
| 17 | `**` (cualquier otra) | — | — | Redirige a la página pública `/`. | — |

### 6.2 Vistas internas (modales y paneles)

| Vista | Ubicación | Dónde aparece |
| ----- | --------- | ------------- |
| Nuevo miembro / Editar miembro / Baja o eliminación / Asignar plan | Modales en `lista-socios` | Vista 8 |
| Crear plan / Editar plan / Eliminar plan / Asignar plan a miembro | Modales en `lista-planes` | Vista 9 |
| Crear usuario / Editar usuario / Desactivar usuario | Modales en `gestion-usuarios` | Vista 15 |
| Membresía del socio (crear, editar, cancelar) | Modal en `gestion-membresias` | Vista 11 |
| Registrar pago | Modal en `gestion-pagos` | Vista 12 |
| Rutina semanal (crear o editar) | Formulario en `espacio-entrenador` | Vista 6 |
| Carné digital con QR | Modal en `portal-socio` | Vista 4 |
| Membresías por vencer | `features/membresias/components/panel-vencimientos` | Vista 3 |
| Historial de pagos | `features/pagos/components/historial-pagos` | Vistas 4 y 12 |

### 6.3 Componentes compartidos

| Componente | Archivo | Función |
| ---------- | ------- | ------- |
| `app-modal` | `shared/components/modal` | Marco común de todas las ventanas emergentes: título, cierre con la X o con Escape, bloqueo mientras se guarda y área de error siempre visible dentro del modal. |
| `app-toast-container` | `shared/components/toast-container` | Avisos flotantes encima de cualquier pantalla o modal (`NotificacionService`). |
| `app-grafico` | `shared/components/grafico` | Envoltorio de Highcharts con la paleta del gimnasio; se vuelve a dibujar cuando cambian sus datos. |
| `app-navbar`, `app-footer` | `shared/components/navbar`, `shared/components/footer` | Encabezado y pie del sitio público. |
| `PublicLayout` | `layouts/public-layout` | Envoltura de la página pública. |
| `DashboardLayout` | `layouts/dashboard-layout` | Envoltura del área privada: menú según el rol, datos del usuario, acceso al perfil y cierre de sesión. |

---

## 7. Manejo de rutas y API

Las rutas están en `src/app/app.routes.ts`. Todas las vistas se cargan de forma diferida
(`loadComponent`) para reducir el tamaño de la carga inicial.

### 7.1 Rutas públicas

| Ruta     | Protección   | Comportamiento |
| -------- | ------------ | -------------- |
| `/`      | Ninguna      | Página pública. |
| `/login` | `guestGuard` | Si ya hay sesión, redirige a `/dashboard`. |
| `**`     | Ninguna      | Cualquier ruta desconocida redirige a `/`. |

### 7.2 Rutas protegidas (área privada)

Todo lo que cuelga de `/dashboard` pasa primero por `authGuard`. Si no hay sesión, se redirige
a `/login?redirigir=<ruta solicitada>`.

| Mecanismo | Archivo | Uso |
| --------- | ------- | --- |
| `authGuard` | `core/guards/auth.guard.ts` | Exige una sesión válida. |
| `rolGuard(...roles)` | `core/guards/rol.guard.ts` | Exige uno de los roles indicados; si no lo tiene, redirige a `/dashboard`. |
| `canMatch` por rol | `app.routes.ts` | Permite que **una misma ruta** muestre vistas distintas según el rol: `/dashboard` (panel, portal del socio o espacio del entrenador) y `/dashboard/reportes` (reportes de administración o de recepción). |

`AuthService.tieneRol()` trata como equivalentes `RECEPCION` y `RECEPCIONISTA`, y también
`SOCIO` y `CLIENTE`.

| Ruta | ADMIN | RECEPCIONISTA | ENTRENADOR | CLIENTE |
| ---- | :---: | :-----------: | :--------: | :-----: |
| `/dashboard` | Panel | Panel | Espacio del entrenador | Portal del socio |
| `/dashboard/socios` | Sí | Sí | — | — |
| `/dashboard/planes` | Sí | Sí | — | — |
| `/dashboard/asistencia` | Sí | Sí | — | — |
| `/dashboard/membresias` | Sí | Sí | — | — |
| `/dashboard/pagos` | Sí | Sí | — | — |
| `/dashboard/reportes` | Completo | Sin ingresos | — | — |
| `/dashboard/usuarios` | Sí | — | — | — |
| `/dashboard/perfil` | Sí | Sí | Sí | Sí |
| `/dashboard/entrenador` | — | — | Sí | — |
| `/dashboard/portal-socio` | — | — | — | Sí |

El menú lateral (`layouts/dashboard-layout`) muestra solo los enlaces permitidos para el rol.
La seguridad real la aplica el backend con `@PreAuthorize`; las guardas del frontend solo
evitan mostrar pantallas a quien no corresponde.

### 7.3 Consumo de la API

- Todas las URL se construyen en `core/constants/api.constants.ts` a partir de
  `environment.apiUrl`. Ningún componente escribe una URL a mano.
- Cada módulo tiene su servicio (`features/*/services/*.service.ts`) que hace las peticiones y
  convierte las respuestas del backend en los modelos del frontend.
- En producción `apiUrl` es `/api`. Nginx (`frontend-gym/nginx.conf`) envía todo lo que empieza
  con `/api/` al contenedor del backend (`proxy_pass http://backend:8080/`), así el navegador
  habla con un solo origen y no hay problemas de CORS ni de IP.

### 7.4 Gestión del token de sesión

1. **Inicio de sesión** (`AuthService.login`): envía `POST /auth/signin` con
   `{ correo, contrasenia }`. El backend responde con un **JWT**. Con ese token se consulta
   `GET /users/me` para obtener el nombre y el rol del usuario.
2. **Almacenamiento**: la sesión (`token`, `usuario` y `expiraEn`) se guarda en `localStorage`
   bajo la llave `gym.sesion`, a través de `StorageService`, que tolera navegadores sin
   almacenamiento disponible.
3. **Vigencia en el cliente**: la sesión se descarta a las **8 horas** o si el token guardado
   no tiene formato JWT. El backend aplica además su propia expiración (`JWT_EXPIRATION`).
4. **Envío del token**: `authInterceptor` (`core/interceptors/auth.interceptor.ts`) agrega la
   cabecera `Authorization: Bearer <token>` a cada petición.
5. **Estado reactivo**: `AuthService` expone *signals* (`usuario`, `rol`, `estaAutenticado`)
   que usan las guardas, el menú y las vistas.
6. **Cierre de sesión**: `AuthService.logout()` llama a `POST /auth/signout`, borra
   `gym.sesion` y vuelve a la página pública.

### 7.5 Captura centralizada de errores HTTP

Todas las peticiones pasan por `errorInterceptor` (`core/interceptors/error.interceptor.ts`),
registrado en `app.config.ts` junto con `authInterceptor`:

```ts
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

El interceptor:

1. Si la respuesta es **401** (y no viene de `/auth/`), cierra la sesión y redirige a `/login`.
2. Convierte cualquier error en un `AppHttpError` con un **mensaje legible en español**, en este
   orden de prioridad:
   - el campo `message`, `mensaje` o `error` que envía el backend
     (por ejemplo: *"Disculpe pero su deuda es de Q. 250.00"*);
   - los errores de validación por campo, unidos en un solo texto;
   - un mensaje genérico según el código: 0 sin conexión, 401, 403, 404 y 5xx.
3. Conserva el código HTTP (`status`) y el cuerpo original (`backendError`) para casos especiales.

En los componentes el mensaje se obtiene con `mensajeDeError(err, 'texto por defecto')`
(`core/services/notificacion.service.ts`) y se muestra de una de dos formas:

| Situación | Cómo se muestra |
| --------- | --------------- |
| Error al guardar desde una ventana emergente | Dentro del mismo modal (`[error]` de `app-modal`). El modal queda abierto y con los botones habilitados para corregir o cancelar. |
| Error al cargar datos o en una acción fuera de un modal | Aviso flotante rojo (`NotificacionService.error`) o alerta con botón "Reintentar" en la sección afectada. |

```ts
this.pagosService.registrar(pago).subscribe({
  next: (p) => this.notificacion.exito(`Pago #${p.idComprobante} registrado.`),
  error: (err) => this.errorModal.set(mensajeDeError(err, 'No se pudo registrar el pago.')),
});
```

---

## 8. Pruebas automatizadas

Las pruebas usan **Vitest** con **jsdom** y corren en el pipeline de CI (`.github/workflows/ci.yml`)
en cada *push* y *pull request* a `main` y `develop`, antes de compilar.

```bash
cd frontend-gym
npx ng test --no-watch
```

| Área | Archivos de prueba |
| ---- | ------------------ |
| Autenticación | `core/services/auth.service.spec.ts`, `features/auth/pages/login/login.spec.ts` |
| Fechas y vencimientos | `core/utils/fechas.spec.ts` |
| Ventanas emergentes | `shared/components/modal/modal.component.spec.ts` |
| Control de acceso (M6) | `features/asistencia/services/asistencia.service.spec.ts`, `registro-asistencia.component.spec.ts`, `asistencia/utils/grafico-asistencias.spec.ts` |
| Pagos, descuento y recargo | `features/pagos/services/pagos.service.spec.ts`, `gestion-pagos.component.spec.ts` |
| Vencimientos (M5) | `features/membresias/services/vencimientos.service.spec.ts`, `portal-socio/aviso-vencimiento.spec.ts` |
| Reportes | `features/reportes/services/reportes.service.spec.ts`, `reportes-dashboard.component.spec.ts`, `reportes/utils/graficos-recepcion.spec.ts` |
| Socios, planes y usuarios | `socios.service.spec.ts`, `lista-socios.component.spec.ts`, `portal-socio.component.spec.ts`, `planes.service.spec.ts`, `usuarios.service.spec.ts` |
| Página pública y componente raíz | `features/home/pages/home-page/home-page.spec.ts`, `app.spec.ts` |
| Componentes compartidos | `shared/components/socio-form/socio-form.component.spec.ts` |

---

## 9. Despliegue

1. **CI** (`ci.yml`): instala Node 22, ejecuta `npm install`, corre las pruebas y compila con `npm run build`.
2. **CD** (`cd.yml`): cuando el CI termina bien en `main`, GitHub Actions construye la imagen
   Docker del frontend, la publica en GitHub Container Registry
   (`ghcr.io/<propietario>/frontend-gym:latest`) y se conecta por SSH a la instancia EC2, donde
   descarga la imagen y reemplaza el contenedor `gym_frontend`. El servidor no compila nada.
3. **Imagen** (`frontend-gym/Dockerfile`), en dos etapas:
   - `node:22-alpine` instala dependencias y ejecuta `npm run build -- --configuration production`;
   - `nginx:alpine` sirve `dist/frontend-gym/browser` con `nginx.conf`.
4. **Nginx** (`nginx.conf`):
   - todas las rutas de la SPA responden con `index.html`;
   - `index.html` se sirve con `Cache-Control: no-cache` para que el navegador cargue siempre la
     versión más reciente después de cada despliegue;
   - los recursos con *hash* (`.js`, `.css`, fuentes, imágenes) se guardan en caché 6 meses;
   - `/api/` se redirige al backend.

Secretos que necesita el CD en GitHub (*Settings > Secrets and variables > Actions*):
`EC2_HOST`, `EC2_USER` y `EC2_SSH_KEY`.

---

## 10. Solución de problemas

| Síntoma | Causa probable | Solución |
| ------- | -------------- | -------- |
| "No se pudo conectar con el servidor" al iniciar sesión en local | El backend no está corriendo en `http://localhost:8080`. | Levantar el backend o cambiar `apiUrl` en `environment.ts`. |
| El mismo mensaje en producción después de un despliegue | El navegador conserva una versión anterior de la aplicación. | Recargar sin caché (`Ctrl + Shift + R`) o abrir una pestaña privada. |
| Error 502 en `/api/...` en producción | El contenedor del backend está detenido o reiniciándose. | `docker ps -a` y `docker logs --tail 100 gym_backend` en el servidor. |
| `npm install` falla o muestra avisos de motor | Versión de Node distinta a la requerida. | `nvm use` (lee `.nvmrc`) y repetir la instalación. |
| Me envía a `/login` mientras trabajo | El token expiró (401) o pasaron 8 horas de sesión. | Iniciar sesión de nuevo. |
| Una opción del menú no aparece | El rol del usuario no tiene permiso para esa vista (sección 7.2). | Entrar con un usuario del rol correspondiente. |
| Advertencia de *budget* al compilar | La carga inicial superó 1.5 MB o el estilo de un componente superó 20 kB. | Revisar importaciones pesadas o mover estilos a `src/styles/`. |
