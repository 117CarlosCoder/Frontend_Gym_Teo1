export const DIAS_SEMANA = [
  'LUNES',
  'MARTES',
  'MIÉRCOLES',
  'JUEVES',
  'VIERNES',
  'SÁBADO',
  'DOMINGO',
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface SocioAsignadoEntrenador {
  idSocio: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  motivo?: string | null;
}

export interface SocioDentroEntrenador {
  idSocio: number;
  nombreSocio: string;
  horaEntrada: string;
  sucursal: string;
}

export interface RutinaSemanal {
  idRutina: number;
  diaSemana: DiaSemana;
  grupoMuscular: string;
  descripcion: string;
  horaInicio: string | null;
  horaFin: string | null;
  activa: boolean;
}

export interface ProgresoSocioEntrenador {
  idSocio: number;
  nombreSocio: string;
  fechaAnterior: string | null;
  fechaActual: string | null;
  pesoAnterior: number | null;
  pesoActual: number | null;
  grasaAnterior: number | null;
  grasaActual: number | null;
  masaMuscularAnterior: number | null;
  masaMuscularActual: number | null;
}

export interface ReporteEntrenador {
  desde: string;
  hasta: string;
  sociosAsignados: number;
  asignacionesActivas: number;
  rutinasActivas: number;
  asistenciasSocios: number;
  progresoSocios: ProgresoSocioEntrenador[];
}

export interface GuardarRutinaRequest {
  diaSemana: DiaSemana;
  grupoMuscular: string;
  descripcion: string;
  horaInicio: string | null;
  horaFin: string | null;
  activa: boolean;
}
