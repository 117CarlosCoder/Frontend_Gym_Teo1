import { diasHasta } from '../../../core/utils/fechas';

/** Congelamiento temporal de una membresía: los días congelados se suman a su vencimiento. */

export type EstadoCongelamiento = 'PROGRAMADO' | 'ACTIVO' | 'FINALIZADO' | 'ANULADO';

export interface Congelamiento {
  id: number;
  idMembresia: number;
  nombrePlan: string | null;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  motivo: string | null;
  estado: EstadoCongelamiento;
  /** Vencimiento de la membresía después del congelamiento. */
  fechaVencimientoMembresia: string | null;
  fechaRegistro: string | null;
  registradoPor: string | null;
}

export interface CongelarMembresiaRequest {
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
}

/** Reglas del gimnasio (configurables por el ADMIN). */
export interface ReglasCongelamiento {
  diasMinimo: number;
  diasMaximo: number;
  maximoPorAnio: number;
  fechaActualizacion: string | null;
}

/** Días entre dos fechas ISO (yyyy-MM-dd), ambas incluidas. */
export function diasDeCongelamiento(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  return diasHasta(fin, inicio) + 1;
}
