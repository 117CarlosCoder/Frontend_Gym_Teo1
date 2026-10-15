import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ReportesService } from '../../services/reportes.service';
import {
  DashboardResumen,
  MetricaAsistencia,
  MiembroEstadoDetalle,
  ReporteIngresos,
  ReporteMiembrosEstado,
  ReporteRenovaciones,
} from '../../models/reporte.model';
import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { RUTAS } from '../../../../core/constants/rutas.constants';
import { AuthService } from '../../../../core/services/auth.service';

export type ReporteTab = 'dashboard' | 'ingresos' | 'miembros' | 'renovaciones' | 'asistencias';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './reportes-dashboard.component.html',
  styleUrl: './reportes-dashboard.component.css',
})
export class ReportesDashboardComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly notificacion = inject(NotificacionService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly RUTAS = RUTAS;

  // Permisos según rol
  readonly esAdmin = computed(() => this.auth.tieneRol('ADMIN'));
  readonly esRecepcionista = computed(() => this.auth.tieneRol('RECEPCION', 'RECEPCIONISTA'));

  // Pestaña activa
  readonly tabActiva = signal<ReporteTab>('dashboard');

  // Estados de carga
  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Math para cálculo en template
  readonly Math = Math;

  // Datos reactivos de cada reporte
  readonly resumen = signal<DashboardResumen | null>(null);
  readonly reporteIngresos = signal<ReporteIngresos | null>(null);
  readonly reporteMiembros = signal<ReporteMiembrosEstado | null>(null);
  readonly reporteRenovaciones = signal<ReporteRenovaciones | null>(null);
  readonly metricasAsistencia = signal<MetricaAsistencia | null>(null);

  // Filtros interactivos
  protected readonly anioFiltroIngresos = signal<number>(new Date().getFullYear());
  protected readonly anioFiltroRenovaciones = signal<number>(new Date().getFullYear());
  protected readonly estadoFiltroMiembros = signal<string>('TODOS');
  protected readonly sucursalFiltroMiembros = signal<number | undefined>(undefined);

  protected readonly mesFiltroAsistencias = signal<number>(new Date().getMonth() + 1);
  protected readonly anioFiltroAsistencias = signal<number>(new Date().getFullYear());
  protected readonly busquedaMiembro = signal<string>('');

  // Fecha actual para reportes impresos
  readonly fechaHoy = new Date();

  // Años disponibles para selección
  protected readonly aniosDisponibles: number[] = [2026, 2025, 2024];

  // Año activo contextual según la pestaña seleccionada
  readonly anioActivo = computed(() => {
    const tab = this.tabActiva();
    if (tab === 'ingresos') {
      return this.reporteIngresos()?.anio || this.anioFiltroIngresos();
    }
    if (tab === 'renovaciones') {
      return this.reporteRenovaciones()?.anio || this.anioFiltroRenovaciones();
    }
    if (tab === 'asistencias') {
      return this.anioFiltroAsistencias();
    }
    return new Date().getFullYear();
  });

  readonly tituloReporteActivo = computed(() => {
    switch (this.tabActiva()) {
      case 'dashboard':
        return 'Resumen Ejecutivo y Métricas Consolidadas';
      case 'ingresos':
        return `Reporte Financiero de Ingresos y Recaudación (${this.anioActivo()})`;
      case 'miembros':
        return 'Reporte de Miembros: Activos vs. Morosos';
      case 'renovaciones':
        return `Reporte Analítico de Renovaciones y Retención (${this.anioActivo()})`;
      case 'asistencias':
        return `Métricas de Afluencia y Horarios Pico (${this.obtenerNombreMes(this.mesFiltroAsistencias())} ${this.anioFiltroAsistencias()})`;
    }
  });

  readonly descripcionReporteActivo = computed(() => {
    switch (this.tabActiva()) {
      case 'dashboard':
        return 'Panel consolidado de indicadores clave de rendimiento (KPIs), ingresos y afluencia.';
      case 'ingresos':
        return 'Consolidado de ingresos agrupados por mes, método de pago y detalle de cobros auditados.';
      case 'miembros':
        return 'Estado de membresías, control de vencimientos, días de atraso y saldos pendientes.';
      case 'renovaciones':
        return 'Análisis de retención periódica de socios, suscripciones nuevas y membresías renovadas.';
      case 'asistencias':
        return 'Monitoreo de asistencia por hora, días de mayor concurrencia y socios recurrentes.';
    }
  });

  readonly horarioPicoCalculado = computed(() => {
    const rep = this.metricasAsistencia();
    if (!rep) return '18:00 - 19:00 (Estándar)';
    return rep.horaPico || '18:00 - 19:00 (Estándar)';
  });

  // Nombres de los meses
  protected readonly meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' },
  ];

  // Miembros filtrados en la tabla por búsqueda
  protected readonly miembrosFiltrados = computed(() => {
    const listado = this.reporteMiembros()?.miembros || [];
    const query = this.busquedaMiembro().toLowerCase().trim();
    if (!query) return listado;

    return listado.filter((m) =>
      `${m.nombres} ${m.apellidos} ${m.correo} ${m.dpi} ${m.planActual || ''} ${m.sucursal || ''}`
        .toLowerCase()
        .includes(query)
    );
  });

  ngOnInit(): void {
    this.cargarTabActual();
  }

  cambiarTab(tab: ReporteTab): void {
    this.tabActiva.set(tab);
    this.error.set(null);
    this.cargarTabActual();
  }

  cargarTabActual(): void {
    const tab = this.tabActiva();
    switch (tab) {
      case 'dashboard':
        this.cargarDashboardResumen();
        break;
      case 'ingresos':
        this.cargarReporteIngresos();
        break;
      case 'miembros':
        this.cargarReporteMiembros();
        break;
      case 'renovaciones':
        this.cargarReporteRenovaciones();
        break;
      case 'asistencias':
        this.cargarMetricasAsistencia();
        break;
    }
  }

  cargarDashboardResumen(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reportesService.getDashboardResumen().subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo cargar el resumen ejecutivo.'));
      },
    });
  }

  cargarReporteIngresos(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reportesService.getReporteIngresos(this.anioFiltroIngresos()).subscribe({
      next: (data) => {
        this.reporteIngresos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo generar el reporte de ingresos.'));
      },
    });
  }

  cambiarAnioIngresos(val: any): void {
    const anio = val === 'todos' ? undefined : Number(val);
    this.anioFiltroIngresos.set(anio as any);
    this.cargarReporteIngresos();
  }

  cargarReporteMiembros(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reportesService
      .getReporteMiembrosEstado(this.estadoFiltroMiembros(), this.sucursalFiltroMiembros())
      .subscribe({
        next: (data) => {
          this.reporteMiembros.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(err, 'No se pudo obtener el reporte de miembros.'));
        },
      });
  }

  cambiarFiltroEstadoMiembro(estado: string): void {
    this.estadoFiltroMiembros.set(estado);
    this.cargarReporteMiembros();
  }

  cambiarFiltroSucursalMiembro(sucursalIdStr: string): void {
    const sucId = sucursalIdStr ? Number(sucursalIdStr) : undefined;
    this.sucursalFiltroMiembros.set(sucId);
    this.cargarReporteMiembros();
  }

  cargarReporteRenovaciones(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reportesService.getReporteRenovaciones(this.anioFiltroRenovaciones()).subscribe({
      next: (data) => {
        this.reporteRenovaciones.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo generar el reporte de renovaciones.'));
      },
    });
  }

  cambiarAnioRenovaciones(val: any): void {
    const anio = Number(val);
    if (!anio || isNaN(anio)) return;
    this.anioFiltroRenovaciones.set(anio);
    this.cargarReporteRenovaciones();
  }

  cargarMetricasAsistencia(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reportesService
      .getMetricasAsistencia(this.mesFiltroAsistencias(), this.anioFiltroAsistencias())
      .subscribe({
        next: (data) => {
          this.metricasAsistencia.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(err, 'No se pudieron consultar las métricas de asistencia.'));
        },
      });
  }

  cambiarMesAsistencia(val: any): void {
    const mes = Number(val);
    if (!mes || isNaN(mes)) return;
    this.mesFiltroAsistencias.set(mes);
    this.cargarMetricasAsistencia();
  }

  irACobroSocio(socioId: number): void {
    this.router.navigate(['/dashboard/pagos'], { queryParams: { socio: socioId } });
  }

  imprimirReporte(): void {
    window.print();
  }

  obtenerNombreMes(numMes: number): string {
    const nombres = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return nombres[numMes - 1] || `Mes ${numMes}`;
  }

  calcularPorcentajeBarra(monto: number, maximo: number): number {
    if (!maximo || maximo <= 0) return 0;
    const p = Math.round((monto / maximo) * 100);
    return Math.min(100, Math.max(8, p));
  }

  calcularMaximoIngreso(ingresos: { total: number }[]): number {
    if (!ingresos || ingresos.length === 0) return 100;
    return Math.max(...ingresos.map((i) => i.total), 1);
  }
}
