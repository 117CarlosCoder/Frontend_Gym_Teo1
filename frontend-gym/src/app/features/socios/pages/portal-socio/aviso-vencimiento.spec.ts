import { MiMembresia } from '../../../membresias/services/vencimientos.service';
import { construirAviso } from './portal-socio.component';

function membresia(diasRestantes: number): MiMembresia {
  return { idMembresia: 1, plan: 'Plan Mensual', fechaVencimiento: '2026-10-15', diasRestantes, activa: true };
}

describe('aviso de vencimiento para el socio (M5)', () => {
  it('no muestra aviso si falta más que el margen de aviso', () => {
    expect(construirAviso(membresia(20), 7)).toBeNull();
  });

  it('avisa cuando la membresía vence dentro del margen', () => {
    const aviso = construirAviso(membresia(3), 7);
    expect(aviso?.nivel).toBe('aviso');
    expect(aviso?.titulo).toContain('3 días');
  });

  it('marca como urgente si vence hoy', () => {
    expect(construirAviso(membresia(0), 7)?.titulo).toBe('Tu membresía vence hoy');
  });

  it('marca como vencida si la fecha ya pasó', () => {
    const aviso = construirAviso(membresia(-2), 7);
    expect(aviso?.nivel).toBe('peligro');
    expect(aviso?.detalle).toContain('2 días');
  });

  it('no muestra aviso si el socio no tiene membresía activa', () => {
    expect(construirAviso(null)).toBeNull();
  });
});
