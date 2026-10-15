import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ReportesDashboardComponent } from './reportes-dashboard.component';
import { ReportesService } from '../../services/reportes.service';

describe('ReportesDashboardComponent', () => {
  let component: ReportesDashboardComponent;
  let fixture: ComponentFixture<ReportesDashboardComponent>;
  let reportesServiceSpy: any;

  beforeEach(async () => {
    const spy = {
      getDashboardResumen: () =>
        of({
          totalSocios: 120,
          totalSociosActivos: 90,
          totalSociosMorosos: 30,
          totalSociosInactivos: 0,
          porcentajeActivos: 75,
          porcentajeMorosos: 25,
          ingresosMesActual: 15400,
          asistenciasHoy: 42,
          membresiasPorVencer: [],
          topPlanes: [],
          asistenciasUltimos7Dias: [],
          ingresosUltimos6Meses: [],
        }),
      getReporteIngresos: () =>
        of({
          anioConsultado: 2026,
          ingresoTotal: 25000,
          totalTransacciones: 50,
          ingresosPorMes: [],
          ingresosPorMetodoPago: [],
          pagosDetalle: [],
        }),
      getReporteMiembrosEstado: () =>
        of({
          fechaCorte: '2026-10-15',
          totalSocios: 120,
          activos: 90,
          morosos: 30,
          inactivos: 0,
          porcentajeActivos: 75,
          porcentajeMorosos: 25,
          distribucionPorSucursal: [],
          miembros: [],
        }),
      getReporteRenovaciones: () =>
        of({
          anioConsultado: 2026,
          totalRenovaciones: 15,
          tasaRetencionPromedio: 85,
          renovacionesPorMes: [],
          detalles: [],
        }),
      getMetricasAsistencia: () =>
        of({
          totalAsistenciasPeriodo: 300,
          promedioDiario: 10,
          diaMayorAfluencia: 'Lunes',
          horaPico: '18:00 - 19:00',
          asistenciasPorDiaSemana: [],
          distribucionHorasPico: [],
          topSociosAsistencia: [],
          asistenciasPorSucursal: [],
        }),
    };

    await TestBed.configureTestingModule({
      imports: [ReportesDashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ReportesService, useValue: spy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar el resumen ejecutivo al inicio', () => {
    expect(component.resumen()?.totalSocios).toBe(120);
    expect(component.resumen()?.totalSociosActivos).toBe(90);
  });

  it('debe cambiar de tab a ingresos y llamar a reporte de ingresos', () => {
    component.cambiarTab('ingresos');
    expect(component.tabActiva()).toBe('ingresos');
    expect(component.reporteIngresos()?.ingresoTotal).toBe(25000);
  });

  it('debe cambiar de tab a miembros y cargar miembros estado', () => {
    component.cambiarTab('miembros');
    expect(component.tabActiva()).toBe('miembros');
    expect(component.reporteMiembros()?.morosos).toBe(30);
  });
});
