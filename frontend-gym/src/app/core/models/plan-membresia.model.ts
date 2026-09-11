export interface PlanMembresia {
  id_plan: number;
  nombre: string;
  duracion: number; // duración en días
  precio: number;
  descripcion?: string;
  beneficios?: string[];
  activo?: boolean;
}

export interface AsignacionPlanDTO {
  id_socio: number;
  id_plan: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  observacion?: string;
}

export interface AsignacionPlanDTO {
  id_socio: number;
  id_plan: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  observacion?: string;
}

