# Guía de estructura y convenciones — Frontend

Documento de referencia para el equipo. La idea es que los cinco integrantes
escriban el código de la misma forma y que agregar una pantalla nueva no
requiera inventar dónde ponerla.

## 1. Las cuatro capas

| Carpeta     | Qué va aquí                                                                | Qué NO va aquí                            |
| ----------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| `core/`     | Servicios singleton, guards, interceptores, modelos y constantes globales. | Componentes visuales.                     |
| `shared/`   | Componentes, directivas y pipes reutilizados por dos o más features.       | Lógica de negocio o llamadas HTTP.        |
| `layouts/`  | Envolturas de página (header + `<router-outlet />` + footer).              | Contenido específico de una pantalla.     |
| `features/` | Una carpeta por funcionalidad del sistema (socios, membresías, clases…).   | Código que use otra feature directamente. |

Regla práctica: si dos features necesitan lo mismo, sube a `shared/` (si es
visual) o a `core/` (si es lógica).

## 2. Cómo agregar una pantalla nueva

Ejemplo: módulo de socios.

```bash
ng generate component features/socios/pages/lista-socios
ng generate service features/socios/services/socios
```

1. El servicio usa las URLs de `core/constants/api.constants.ts`.
2. Los modelos van en `core/models/gimnasio.model.ts` (o uno propio si crece).
3. La ruta se registra con carga diferida en `app.routes.ts`:

```ts
{
  path: 'socios',
  canActivate: [authGuard, rolGuard('ADMIN', 'RECEPCION')],
  loadComponent: () =>
    import('./features/socios/pages/lista-socios/lista-socios')
      .then((m) => m.ListaSocios),
  title: 'Socios | Claude Lovers Gym',
}
```

## 3. Convenciones de código

- **Componentes standalone**, sin `NgModule`.
- **Signals** para el estado del componente (`signal`, `computed`); nada de
  `BehaviorSubject` para estado local.
- **`inject()`** en vez de constructor con parámetros.
- Nuevo control de flujo de plantillas: `@if`, `@for`, `@let` (no `*ngIf`/`*ngFor`).
- Nombres de archivos y carpetas en `kebab-case`; clases en `PascalCase`.
- Identificadores del dominio en español (socio, membresía, inscripción) para
  que coincidan con la base de datos y el ER.
- Miembros `protected` cuando solo los usa la plantilla; `private` si son
  internos del componente.

## 4. Estilos

- Los colores, tamaños, radios y sombras salen de `src/styles/tokens.css`.
  **No escribir HEX dentro de los componentes.**
- Clases reutilizables (`.btn`, `.card`, `.field`, `.container`, `.section`)
  están en `src/styles/utilities.css`.
- Cada componente usa nomenclatura tipo BEM en su propio `.css`
  (`bloque__elemento--modificador`).
- Presupuesto de CSS por componente: 8 kB de advertencia, 16 kB de error.

## 5. Autenticación

Flujo actual:

1. `Login` envía las credenciales a `AuthService.login()`.
2. En modo demo la respuesta se simula; con backend real hace `POST /auth/login`.
3. La sesión (token + usuario + expiración) se guarda en `localStorage`
   bajo la llave `gym.sesion` y se expone como signals.
4. `authInterceptor` agrega `Authorization: Bearer <token>` a cada petición.
5. `errorInterceptor` traduce los errores y cierra sesión ante un `401`.
6. `authGuard` protege rutas privadas; `guestGuard` evita ver el login con la
   sesión abierta; `rolGuard(...)` restringe por rol.

Cuando el backend esté listo solo hay que cambiar `useMockAuth` a `false` y
borrar el arreglo `USUARIOS_DEMO` de `auth.service.ts`.

## 6. Pendientes del backlog (frontend)

- Módulo de socios (alta, baja, búsqueda y detalle).
- Membresías e inscripciones con control de vencimiento.
- Registro de asistencia de socios y entrenadores.
- Clases dirigidas con reserva de cupo.
- Reportes / KPIs para administración.
