import type { Options } from 'highcharts';

import { sumarDias } from '../../../core/utils/fechas';
import { DistribucionPlan } from '../models/reporte.model';

/**
 * El backend solo devuelve los días que tuvieron asistencias; aquí se completa
 * cada día del rango con 0 para que la línea de afluencia no salte días.
 */
export function completarSerieDiaria(
  desde: string,
  hasta: string,
  serie: { periodo: string; total: number }[],
): { fecha: string; total: number }[] {
  const porFecha = new Map(serie.map((p) => [p.periodo.slice(0, 10), p.total]));
  const resultado: { fecha: string; total: number }[] = [];
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    resultado.push({ fecha, total: porFecha.get(fecha) ?? 0 });
  }
  return resultado;
}

/** "2026-10-21" -> "21/10" */
function etiquetaDia(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}

/** Afluencia diaria del gimnasio (área suavizada). */
export function graficoAfluenciaDiaria(dias: { fecha: string; total: number }[]): Options {
  return {
    chart: { type: 'areaspline' },
    xAxis: { categories: dias.map((d) => etiquetaDia(d.fecha)), tickInterval: dias.length > 14 ? 2 : 1 },
    yAxis: { min: 0, allowDecimals: false, title: { text: 'Visitas' } },
    legend: { enabled: false },
    tooltip: { pointFormat: '<b>{point.y}</b> visitas' },
    plotOptions: {
      areaspline: { fillOpacity: 0.25, marker: { radius: 3 } },
    },
    series: [{ type: 'areaspline', name: 'Visitas', data: dias.map((d) => d.total), color: '#035e7b' }],
  };
}

/** Miembros activos frente a morosos (dona). */
export function graficoEstadoMiembros(activos: number, morosos: number): Options {
  return {
    chart: { type: 'pie' },
    tooltip: { pointFormat: '<b>{point.y}</b> socios ({point.percentage:.1f}%)' },
    plotOptions: {
      pie: {
        innerSize: '60%',
        dataLabels: { enabled: true, format: '{point.name}: {point.y}' },
        showInLegend: true,
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Socios',
        data: [
          { name: 'Activos', y: activos, color: '#1e7d55' },
          { name: 'Morosos', y: morosos, color: '#b3261e' },
        ],
      },
    ],
  };
}

/** Cantidad de socios por plan contratado (barras horizontales). */
export function graficoMiembrosPorPlan(distribucion: DistribucionPlan[]): Options {
  const ordenada = [...distribucion].sort((a, b) => b.cantidadSocios - a.cantidadSocios);
  return {
    chart: { type: 'bar' },
    xAxis: { categories: ordenada.map((p) => p.nombrePlan), title: { text: undefined } },
    yAxis: { min: 0, allowDecimals: false, title: { text: 'Socios' } },
    legend: { enabled: false },
    plotOptions: { bar: { borderRadius: 4, dataLabels: { enabled: true } } },
    series: [{ type: 'bar', name: 'Socios', data: ordenada.map((p) => p.cantidadSocios), color: '#101d42' }],
  };
}
