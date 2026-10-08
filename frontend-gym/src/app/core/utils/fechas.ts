/**
 * Utilidades de fechas en formato ISO (YYYY-MM-DD).
 * Se calcula en UTC para que el cambio de horario o la zona horaria no muevan el día.
 */

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function aUtc(fecha: string): number {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

function aIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Fecha de hoy según el reloj local del usuario. */
export function hoyIso(): string {
  const ahora = new Date();
  return aIso(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
}

export function sumarDias(fecha: string, dias: number): string {
  return aIso(aUtc(fecha) + dias * MS_POR_DIA);
}

/** Días desde hoy hasta la fecha indicada (negativo si ya pasó). */
export function diasHasta(fecha: string, hoy: string = hoyIso()): number {
  return Math.round((aUtc(fecha) - aUtc(hoy)) / MS_POR_DIA);
}

/**
 * Misma regla que el backend al registrar un pago:
 * si la membresía sigue vigente se extiende desde su vencimiento; si ya venció, desde hoy.
 */
export function calcularNuevoVencimiento(
  vencimientoActual: string | null | undefined,
  duracionDias: number,
  hoy: string = hoyIso(),
): string {
  const base = vencimientoActual && vencimientoActual.slice(0, 10) >= hoy ? vencimientoActual : hoy;
  return sumarDias(base, duracionDias);
}
