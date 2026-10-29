import type { Options } from 'highcharts';

import { AsistenciaRegistro } from '../models/asistencia.model';

/** "07:45:10.123" -> "07:45". Devuelve "-" si no hay hora. */
export function formatearHora(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : '-';
}

/** 85 -> "1 h 25 min"; null -> "-". */
export function formatearPermanencia(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined) return '-';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas} h ${resto} min` : `${resto} min`;
}

/** Cuenta las entradas de cada hora del día, separando a quienes siguen dentro de quienes ya salieron. */
export function contarEntradasPorHora(asistencias: AsistenciaRegistro[]): {
  horas: number[];
  dentro: number[];
  salieron: number[];
} {
  const conHora = asistencias.filter((a) => !!a.horaEntrada);
  if (conHora.length === 0) return { horas: [], dentro: [], salieron: [] };

  const horaDe = (a: AsistenciaRegistro) => Number(a.horaEntrada.slice(0, 2));
  const primera = Math.min(...conHora.map(horaDe));
  const ultima = Math.max(...conHora.map(horaDe));
  const horas = Array.from({ length: ultima - primera + 1 }, (_, i) => primera + i);

  return {
    horas,
    dentro: horas.map((h) => conHora.filter((a) => horaDe(a) === h && a.dentro).length),
    salieron: horas.map((h) => conHora.filter((a) => horaDe(a) === h && !a.dentro).length),
  };
}

/** Gráfico de columnas apiladas con las entradas de hoy por hora (Highcharts). */
export function construirGraficoEntradasPorHora(asistencias: AsistenciaRegistro[]): Options {
  const { horas, dentro, salieron } = contarEntradasPorHora(asistencias);
  return {
    chart: { type: 'column' },
    xAxis: {
      categories: horas.map((h) => `${String(h).padStart(2, '0')}:00`),
      title: { text: 'Hora de entrada' },
    },
    yAxis: {
      min: 0,
      allowDecimals: false,
      title: { text: 'Socios' },
      stackLabels: { enabled: true },
    },
    tooltip: { shared: true },
    plotOptions: { column: { stacking: 'normal', borderRadius: 4 } },
    series: [
      { type: 'column', name: 'Siguen dentro', data: dentro, color: '#1e7d55' },
      { type: 'column', name: 'Ya salieron', data: salieron, color: '#6e6a6f' },
    ],
  };
}
