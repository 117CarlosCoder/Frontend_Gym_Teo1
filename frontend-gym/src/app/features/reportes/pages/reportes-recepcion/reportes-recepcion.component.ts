import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RUTAS } from '../../../../core/constants/rutas.constants';
import { mensajeDeError } from '../../../../core/services/notificacion.service';
import { hoyIso, sumarDias } from '../../../../core/utils/fechas';
import { GraficoComponent } from '../../../../shared/components/grafico/grafico.component';
import { AsistenciaRegistro } from '../../../asistencia/models/asistencia.model';
import { AsistenciaService } from '../../../asistencia/services/asistencia.service';
import { MembresiaPorVencer, VencimientosService } from '../../../membresias/services/vencimientos.service';
import { MetricasAsistenciaRango, ReporteMiembrosEstado } from '../../models/reporte.model';
import { ReportesService } from '../../services/reportes.service';
import {
  completarSerieDiaria,
  graficoAfluenciaDiaria,
  graficoEstadoMiembros,
  graficoMiembrosPorPlan,
} from '../../utils/graficos-recepcion';

/**
 * Reportes para Recepción: afluencia, estado de los miembros, socios dentro y cobros pendientes.
 * No incluye información financiera (ingresos mensuales), que es exclusiva del administrador.
 */
@Component({
  selector: 'app-reportes-recepcion',
  imports: [DatePipe, DecimalPipe, RouterLink, GraficoComponent],
  templateUrl: './reportes-recepcion.component.html',
  styleUrl: './reportes-recepcion.component.css',
})
export class ReportesRecepcionComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly vencimientosService = inject(VencimientosService);

  protected readonly RUTAS = RUTAS;
  protected readonly opcionesRango = [7, 14, 30];
  protected readonly rangoDias = signal(14);
  protected readonly fechaHoy = new Date();

  protected readonly miembros = signal<ReporteMiembrosEstado | null>(null);
  protected readonly metricas = signal<MetricasAsistenciaRango | null>(null);
  protected readonly asistenciasHoy = signal<AsistenciaRegistro[]>([]);
  protected readonly porVencer = signal<MembresiaPorVencer[]>([]);

  protected readonly cargandoMiembros = signal(true);
  protected readonly cargandoMetricas = signal(true);
  protected readonly errorMiembros = signal<string | null>(null);
  protected readonly errorMetricas = signal<string | null>(null);

  // Indicadores
  protected readonly visitasHoy = computed(() => this.asistenciasHoy().length);
  protected readonly sociosDentro = computed(() => this.asistenciasHoy().filter((a) => a.dentro).length);

  protected readonly diasAfluencia = computed(() => {
    const m = this.metricas();
    return m ? completarSerieDiaria(m.desde, m.hasta, m.serie) : [];
  });

  protected readonly diaMasConcurrido = computed(() => {
    const dias = this.diasAfluencia();
    if (dias.length === 0) return null;
    const max = dias.reduce((a, b) => (b.total > a.total ? b : a));
    return max.total > 0 ? max : null;
  });

  // Gráficos (Highcharts)
  protected readonly graficoAfluencia = computed(() => graficoAfluenciaDiaria(this.diasAfluencia()));
  protected readonly graficoEstado = computed(() => {
    const m = this.miembros();
    return graficoEstadoMiembros(m?.activos ?? 0, m?.morosos ?? 0);
  });
  protected readonly graficoPlanes = computed(() => graficoMiembrosPorPlan(this.miembros()?.distribucionPorPlan ?? []));

  /** Socios morosos ordenados por días de atraso: a quién cobrar primero. */
  protected readonly morosos = computed(() =>
    (this.miembros()?.miembros ?? [])
      .filter((m) => (m.estadoSocio || '').toUpperCase() === 'MOROSO')
      .sort((a, b) => b.diasMora - a.diasMora)
      .slice(0, 10),
  );

  ngOnInit(): void {
    this.cargarMiembros();
    this.cargarMetricas();
    this.asistenciaService.getAsistenciasHoy().subscribe({
      next: (lista) => this.asistenciasHoy.set(lista),
      error: () => this.asistenciasHoy.set([]),
    });
    this.vencimientosService.proximasAVencer(7).subscribe({
      next: (lista) => this.porVencer.set(lista),
      error: () => this.porVencer.set([]),
    });
  }

  protected cambiarRango(dias: number): void {
    this.rangoDias.set(dias);
    this.cargarMetricas();
  }

  protected cargarMiembros(): void {
    this.cargandoMiembros.set(true);
    this.errorMiembros.set(null);
    this.reportesService.getReporteMiembrosEstado().subscribe({
      next: (data) => {
        this.miembros.set(data);
        this.cargandoMiembros.set(false);
      },
      error: (err) => {
        this.errorMiembros.set(mensajeDeError(err, 'No se pudo cargar el estado de los miembros.'));
        this.cargandoMiembros.set(false);
      },
    });
  }

  protected cargarMetricas(): void {
    const hasta = hoyIso();
    const desde = sumarDias(hasta, -(this.rangoDias() - 1));
    this.cargandoMetricas.set(true);
    this.errorMetricas.set(null);
    this.reportesService.getMetricasAsistenciaRango(desde, hasta, 'DIA').subscribe({
      next: (data) => {
        this.metricas.set(data);
        this.cargandoMetricas.set(false);
      },
      error: (err) => {
        this.errorMetricas.set(mensajeDeError(err, 'No se pudo cargar la afluencia del gimnasio.'));
        this.cargandoMetricas.set(false);
      },
    });
  }

  protected imprimir(): void {
    window.print();
  }
}
