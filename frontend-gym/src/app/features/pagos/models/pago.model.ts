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
  // Pago en cuotas / abonos
  /** Total de la factura (precio - descuento + recargo). */
  totalFactura: number | null;
  /** PAGADA o PENDIENTE (con saldo). */
  estadoFactura: string | null;
  /** 1 = pago inicial; 2 en adelante = abonos al saldo. */
  numeroAbono: number;
  /** Pagado en la factura hasta este comprobante, incluido. */
  totalAbonado: number | null;
  /** Saldo que quedó después de este comprobante. */
  saldoPendiente: number;
  fechaLimiteSaldo: string | null;
}

/** Reglas del gimnasio para pagar en abonos (configurables por el ADMIN). */
export interface ReglasAbono {
  /** Porcentaje mínimo del total que se paga en el primer abono (100 = no se permiten abonos). */
  porcentajeMinimoInicial: number;
  /** Días de plazo para liquidar el saldo. */
  plazoDias: number;
  fechaActualizacion: string | null;
}

export interface RegistrarAbonoRequest {
  idFactura: number;
  idMetodoPago: number;
  monto: number;
  referencia?: string;
}

export type EstadoFacturaCuenta = 'PAGADA' | 'PENDIENTE' | 'VENCIDA' | 'ANULADA';

export interface AbonoCuenta {
  idComprobante: number;
  fechaPago: string;
  monto: number;
  metodoPago: string | null;
  referencia: string | null;
}

export interface FacturaCuenta {
  idFactura: number;
  idMembresia: number;
  nombrePlan: string;
  fechaEmision: string;
  /** Fecha límite para liquidar el saldo (null si ya está pagada). */
  fechaLimite: string | null;
  montoBase: number;
  descuento: number;
  recargo: number;
  total: number;
  pagado: number;
  saldo: number;
  estado: EstadoFacturaCuenta;
  abonos: AbonoCuenta[];
}

/** Estado de cuenta del socio: facturado, pagado y saldo pendiente. */
export interface EstadoCuenta {
  idSocio: number;
  nombreSocio: string | null;
  totalFacturado: number;
  totalPagado: number;
  saldoPendiente: number;
  saldoVencido: number;
  proximaFechaLimite: string | null;
  facturas: FacturaCuenta[];
}

export interface RegistrarPagoRequest {
  idMembresia: number;
  idMetodoPago: number;
  monto: number;
  /** Promoción elegida al cobrar; si se omite el backend aplica la vigente con mayor descuento. */
  idPromocion?: number;
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

