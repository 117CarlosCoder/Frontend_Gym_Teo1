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

/** Curva del PO (Sprint 5): Beneficio en el precio a ciertos tipos de miembros. */
export interface BeneficioMiembro {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: number;
}

export const BENEFICIOS_MIEMBRO: BeneficioMiembro[] = [
  { id: 'REGULAR', nombre: 'Ninguno (Tarifa Regular)', descripcion: 'Precio estándar sin descuento', tipo: 'PORCENTAJE', valor: 0 },
  { id: 'ESTUDIANTE', nombre: 'Estudiante / Universitario (-15%)', descripcion: 'Beneficio con carné de estudiante vigente', tipo: 'PORCENTAJE', valor: 15 },
  { id: 'TERCERA_EDAD', nombre: 'Tercera Edad / Adulto Mayor (-20%)', descripcion: 'Beneficio preferencial para mayores de 60 años', tipo: 'PORCENTAJE', valor: 20 },
  { id: 'CONVENIO', nombre: 'Convenio Corporativo / Fidelidad (-10%)', descripcion: 'Alianzas empresariales y socios con antigüedad', tipo: 'PORCENTAJE', valor: 10 },
  { id: 'PROMO_50', nombre: 'Promoción Especial Apertura (-Q50.00)', descripcion: 'Descuento promocional de monto fijo', tipo: 'MONTO_FIJO', valor: 50 },
];

/** Curva del PO (Sprint 5): Recargo cuando el pago se realiza fuera de plazo. */
export interface RecargoPagoTardio {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'MONTO_FIJO' | 'PORCENTAJE';
  valor: number;
}

export const RECARGOS_PAGO_TARDIO: RecargoPagoTardio[] = [
  { id: 'NINGUNO', nombre: 'Sin recargo (Pago a tiempo)', descripcion: 'Pago dentro de plazo sin penalización', tipo: 'MONTO_FIJO', valor: 0 },
  { id: 'MORA_FIJA', nombre: 'Recargo por mora (+Q25.00)', descripcion: 'Cargo administrativo estándar por pago tardío', tipo: 'MONTO_FIJO', valor: 25 },
  { id: 'MORA_10', nombre: 'Recargo por atraso (+10%)', descripcion: '10% de recargo sobre el precio del plan', tipo: 'PORCENTAJE', valor: 10 },
];

