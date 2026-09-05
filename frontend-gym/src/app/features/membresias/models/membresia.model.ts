import { Sucursal } from "../../../core/models/sucursal.model";

export type EstadoMembresia = 'ACTIVA' | 'CONGELADA' | 'CANCELADA' | 'VENCIDA';

export interface EstadoMembresiaCatalogo {
  idEstado: number;
  nombre: EstadoMembresia;
  descripcion: string;
}

export const ESTADOS_MEMBRESIA: EstadoMembresiaCatalogo[] = [
  { idEstado: 1, nombre: 'ACTIVA', descripcion: 'Membresía vigente y con acceso habilitado' },
  { idEstado: 2, nombre: 'VENCIDA', descripcion: 'Membresía caducada pendiente de renovación' },
  { idEstado: 3, nombre: 'CONGELADA', descripcion: 'Membresía temporalmente suspendida por solicitud' },
  { idEstado: 4, nombre: 'CANCELADA', descripcion: 'Membresía dada de baja definitivamente' },
];

export interface PlanMembresia {
  idPlan: number;
  tipo: string;
  descripcion: string;
  duracionMeses: number;
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
  idEstado: number;
  fechaInicio: string;
  fechaFin: string;
  precio: number;
  estado: EstadoMembresia;
  descripcionEstado: string;
  motivoCancelacion: string;
}

export interface AuditoriaMembresia {
  idAuditoria: number;
  accion: 'CREADA' | 'EDITADA' | 'PLAN_CAMBIADO' | 'FECHAS_CAMBIADAS' | 'ESTADO_CAMBIADO' | 'SUCURSAL_AGREGADA' | 'SUCURSAL_QUITADA' | 'CONGELADA' | 'CANCELADA' | 'REACTIVADA' | 'SUCURSAL_DESACTIVADA' | 'SUCURSAL_REACTIVADA';
  idMembresia?: number;
  idSocio?: number;
  nombreSocio?: string;
  idUsuario: number;
  nombreUsuario: string;
  fecha: string;
  detalle: string;
  valorAnterior?: string;
  valorNuevo?: string;
}

/** Payload preparado para POST/PUT /membresias. */
export interface MembresiaBackendRequest {
  idSocio: number;
  idPlan: number;
  idEstado: number;
  fechaInicio: string;
  fechaFin: string;
}