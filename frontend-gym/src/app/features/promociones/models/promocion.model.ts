/** Promociones de descuento que el administrador configura y que se aplican al cobrar. */

export type TipoDescuento = 'PORCENTAJE' | 'MONTO_FIJO';

export interface Promocion {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipoDescuento: TipoDescuento;
  /** Porcentaje (0-100) o monto en quetzales, según el tipo. */
  valorDescuento: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  /** Activa y con la fecha de hoy dentro de su vigencia. */
  vigente: boolean;
}

export interface GuardarPromocionRequest {
  nombre: string;
  descripcion?: string;
  tipoDescuento: TipoDescuento;
  valorDescuento: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

export interface RecargoTardio {
  /** Porcentaje (0-100) del precio del plan que se cobra si la membresía ya venció. */
  porcentaje: number;
  fechaActualizacion: string | null;
}

/** Mismo cálculo que el backend: el descuento nunca supera el precio del plan. */
export function calcularDescuento(promocion: Pick<Promocion, 'tipoDescuento' | 'valorDescuento'>, precio: number): number {
  const descuento =
    promocion.tipoDescuento === 'PORCENTAJE'
      ? Math.round(precio * promocion.valorDescuento) / 100
      : Math.round(promocion.valorDescuento * 100) / 100;
  return Math.min(descuento, precio);
}

/** "15 %" o "Q 50.00" */
export function describirDescuento(promocion: Pick<Promocion, 'tipoDescuento' | 'valorDescuento'>): string {
  return promocion.tipoDescuento === 'PORCENTAJE'
    ? `${Number(promocion.valorDescuento)} %`
    : `Q ${Number(promocion.valorDescuento).toFixed(2)}`;
}
