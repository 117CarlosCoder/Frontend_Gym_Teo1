import { AsistenciaRegistro } from '../models/asistencia.model';
import { contarEntradasPorHora, formatearHora, formatearPermanencia } from './grafico-asistencias';

function asistencia(horaEntrada: string, dentro: boolean): AsistenciaRegistro {
  return {
    idAsistencia: Math.random(),
    idSocio: 1,
    nombreSocio: 'Ana',
    apellidoSocio: 'López',
    idSucursal: 1,
    sucursal: 'Sucursal Central (Zona 1)',
    fecha: '2026-10-21',
    horaEntrada,
    horaSalida: dentro ? null : '23:00:00',
    dentro,
    minutosPermanencia: null,
    registradoPor: 'Recepción',
  };
}

describe('gráfico de asistencias de hoy', () => {
  it('agrupa las entradas por hora separando quienes siguen dentro', () => {
    const resultado = contarEntradasPorHora([
      asistencia('06:10:00', false),
      asistencia('06:45:00', true),
      asistencia('08:05:00', true),
    ]);

    expect(resultado.horas).toEqual([6, 7, 8]);
    expect(resultado.dentro).toEqual([1, 0, 1]);
    expect(resultado.salieron).toEqual([1, 0, 0]);
  });

  it('no muestra datos cuando no hay asistencias (sin socios inventados)', () => {
    expect(contarEntradasPorHora([])).toEqual({ horas: [], dentro: [], salieron: [] });
  });

  it('formatea horas y permanencia', () => {
    expect(formatearHora('07:45:10.123')).toBe('07:45');
    expect(formatearHora(null)).toBe('-');
    expect(formatearPermanencia(85)).toBe('1 h 25 min');
    expect(formatearPermanencia(40)).toBe('40 min');
    expect(formatearPermanencia(null)).toBe('-');
  });
});
