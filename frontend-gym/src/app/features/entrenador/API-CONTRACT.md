# Contrato API esperado: módulo de entrenador

La interfaz consume estas rutas protegidas por JWT. El backend debe obtener el entrenador asociado desde el usuario autenticado (`/me`) y limitar todas las respuestas y escrituras a ese entrenador; no recibe un `id_entrenador` suministrado por el navegador.

Base: `/entrenadores/me`

| Método | Ruta | Respuesta |
| --- | --- | --- |
| `GET` | `/socios` | Lista de asignaciones: `idSocio`, `nombres`, `apellidos`, `correo`, `fechaInicio`, `fechaFin`, `activo`, `motivo`. Incluye asignaciones activas e históricas. |
| `GET` | `/socios/dentro` | Lista de socios asignados con asistencia abierta: `idSocio`, `nombreSocio`, `horaEntrada`, `sucursal`. |
| `GET` | `/rutinas` | Lista semanal de rutinas: `idRutina`, `diaSemana`, `grupoMuscular`, `descripcion`, `horaInicio`, `horaFin`, `activa`. |
| `POST` | `/rutinas` | Crea una rutina con el cuerpo indicado abajo y devuelve la rutina creada. |
| `PUT` | `/rutinas/{idRutina}` | Actualiza una rutina del entrenador autenticado y devuelve la rutina actualizada. |
| `DELETE` | `/rutinas/{idRutina}` | Elimina la rutina del entrenador autenticado; responde `204 No Content`. |
| `GET` | `/reportes?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | Devuelve las métricas personales y el progreso de los socios asignados. |

Ejemplo de cuerpo para crear o actualizar una rutina:

```json
{
  "diaSemana": "LUNES",
  "grupoMuscular": "Tren superior",
  "descripcion": "Press, remo y trabajo accesorio",
  "horaInicio": "08:00",
  "horaFin": "09:00",
  "activa": true
}
```

La respuesta de reportes contiene `desde`, `hasta`, `sociosAsignados`, `asignacionesActivas`, `rutinasActivas`, `asistenciasSocios` y `progresoSocios`. Cada progreso incluye `idSocio`, `nombreSocio`, `fechaAnterior`, `fechaActual`, `pesoAnterior`, `pesoActual`, `grasaAnterior`, `grasaActual`, `masaMuscularAnterior` y `masaMuscularActual`; las mediciones pueden ser `null` si no existen.

`diaSemana` usa los valores `LUNES`, `MARTES`, `MIÉRCOLES`, `JUEVES`, `VIERNES`, `SÁBADO` y `DOMINGO`. Las rutas deben devolver arreglos JSON para listas vacías y errores HTTP claros para operaciones no autorizadas o datos inválidos.
