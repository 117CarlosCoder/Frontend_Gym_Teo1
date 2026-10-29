import { completarSerieDiaria, graficoEstadoMiembros, graficoMiembrosPorPlan } from './graficos-recepcion';

describe('gráficos del reporte de recepción', () => {
  it('completa con cero los días sin asistencias', () => {
    const dias = completarSerieDiaria('2026-10-19', '2026-10-22', [
      { periodo: '2026-10-19', total: 4 },
      { periodo: '2026-10-21', total: 7 },
    ]);

    expect(dias).toEqual([
      { fecha: '2026-10-19', total: 4 },
      { fecha: '2026-10-20', total: 0 },
      { fecha: '2026-10-21', total: 7 },
      { fecha: '2026-10-22', total: 0 },
    ]);
  });

  it('arma la dona de activos frente a morosos', () => {
    const opciones = graficoEstadoMiembros(12, 3);
    const datos = (opciones.series?.[0] as any).data;

    expect(datos.map((d: any) => [d.name, d.y])).toEqual([
      ['Activos', 12],
      ['Morosos', 3],
    ]);
  });

  it('ordena los planes de mayor a menor cantidad de socios', () => {
    const opciones = graficoMiembrosPorPlan([
      { planId: 1, nombrePlan: 'Mensual', cantidadSocios: 2, porcentaje: 20 },
      { planId: 2, nombrePlan: 'Anual', cantidadSocios: 8, porcentaje: 80 },
    ]);

    expect((opciones.xAxis as any).categories).toEqual(['Anual', 'Mensual']);
    expect((opciones.series?.[0] as any).data).toEqual([8, 2]);
  });
});
