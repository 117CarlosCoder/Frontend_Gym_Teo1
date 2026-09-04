import { Sucursal } from "../../../core/models/sucursal.model";

export type EstadoMembresia = 'ACTIVA' | 'CONGELADA' | 'CANCELADA' | 'VENCIDA';

export interface PlanMembresia {
  idPlan: number;
  tipo: string;
  descripcion: string;
  precio: number;
  beneficios: string[];
  activo: boolean;
}

export interface Membresia {
  idMembresia: number;
  idSocio: number;
  nombreSocio: string;
  plan: PlanMembresia;
  fechaInicio: string;
  fechaFin: string;
  precio: number;
  estado: EstadoMembresia;
  descripcionEstado: string;
  sucursales: Sucursal[];
  motivoCancelacion?: string;
  fechaCancelacion?: string;
  eliminado: boolean;
  creadoPor: number;
  creadoEn: string;
  actualizadoPor?: number;
  actualizadoEn?: string;
}

export interface MembresiaFormulario {
  idSocio: number;
  nombreSocio: string;
  idPlan: number;
  fechaInicio: string;
  fechaFin: string;
  precio: number;
  estado: EstadoMembresia;
  descripcionEstado: string;
  idsSucursales: number[];
  motivoCancelacion: string;
}

export interface AuditoriaMembresia {
  idAuditoria: number;
  accion: 'CREADA' | 'EDITADA' | 'ASIGNADA' | 'CONGELADA' | 'CANCELADA' | 'REACTIVADA' | 'SUCURSAL_DESACTIVADA';
  idMembresia?: number;
  idSocio?: number;
  nombreSocio?: string;
  idUsuario: number;
  nombreUsuario: string;
  fecha: string;
  detalle: string;
}