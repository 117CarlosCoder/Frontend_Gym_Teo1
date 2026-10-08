import { calcularNuevoVencimiento, diasHasta, sumarDias } from './fechas';

describe('utilidades de fechas', () => {
  const hoy = '2026-10-08';

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-12-20', 30)).toBe('2027-01-19');
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('calcula los días que faltan para una fecha', () => {
    expect(diasHasta('2026-10-15', hoy)).toBe(7);
    expect(diasHasta('2026-10-08', hoy)).toBe(0);
    expect(diasHasta('2026-10-01', hoy)).toBe(-7);
  });

  it('extiende desde el vencimiento actual si la membresía sigue vigente (plan mensual)', () => {
    expect(calcularNuevoVencimiento('2026-10-20', 30, hoy)).toBe('2026-11-19');
  });

  it('calcula desde hoy si la membresía ya venció (plan trimestral)', () => {
    expect(calcularNuevoVencimiento('2026-09-01', 90, hoy)).toBe('2027-01-06');
  });

  it('calcula desde hoy si no hay vencimiento previo (plan anual)', () => {
    expect(calcularNuevoVencimiento(null, 365, hoy)).toBe('2027-10-08');
  });
});
