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
  /** Precio del plan antes de descuento y recargo. */
  montoBase: number;
  /** Descuento aplicado por promoción vigente (0 si no aplica). */
  descuento: number;
  /** Recargo por pago tardío / mora (0 si se pagó a tiempo). */
  recargo: number;
  idPromocion: number | null;
  nombrePromocion: string | null;
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

/**
 * Cotización del cobro calculada por el backend (Curva del PO):
 * total = precio del plan - descuento (promoción vigente) + recargo (pago tardío).
 */
export interface CotizacionPago {
  idMembresia: number;
  montoBase: number;
  idPromocion: number | null;
  nombrePromocion: string | null;
  descuento: number;
  pagoTardio: boolean;
  diasAtraso: number;
  porcentajeRecargo: number;
  recargo: number;
  total: number;
  fechaCalculo: string;
}

