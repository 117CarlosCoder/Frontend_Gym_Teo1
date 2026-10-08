/** Modelos del módulo de pagos (M4). Reflejan los DTO de /pagos del backend. */

export interface MetodoPago {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Pago {
  idComprobante: number;
  idFactura: number;
  idSocio: number;
  nombreSocio: string;
  correoSocio: string;
  dpiSocio: string;
  idMembresia: number;
  nombrePlan: string;
  duracionPlan: number;
  nuevaFechaVencimiento: string;
  metodoPago: MetodoPago | null;
  fechaPago: string;
  montoPagado: number;
  referencia: string | null;
  nombreRecepcionista: string;
  observacion: string | null;
}

export interface RegistrarPagoRequest {
  idMembresia: number;
  idMetodoPago: number;
  monto: number;
  referencia?: string;
  observacion?: string;
}

/** Página de resultados de Spring Data. */
export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Membresía resumida para elegir a cuál se aplica el pago. */
export interface MembresiaPagable {
  id: number;
  nombrePlan: string;
  duracionDias: number;
  precio: number;
  fechaInicio: string;
  fechaVencimiento: string | null;
  estado: string;
  activa: boolean;
}
