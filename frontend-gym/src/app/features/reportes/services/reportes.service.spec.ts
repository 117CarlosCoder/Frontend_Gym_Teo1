import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportesService } from './reportes.service';
import { API } from '../../../core/constants/api.constants';

describe('ReportesService', () => {
  let service: ReportesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReportesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe llamar a GET /reportes/dashboard', () => {
    const mockDashboard: any = { totalSocios: 100, totalSociosActivos: 80, totalSociosMorosos: 20 };

    service.getDashboardResumen().subscribe((res) => {
      expect(res.totalSocios).toBe(mockDashboard.totalSocios);
      expect(res.totalSociosActivos).toBe(mockDashboard.totalSociosActivos);
      expect(res.totalSociosMorosos).toBe(mockDashboard.totalSociosMorosos);
    });

    const req = httpTesting.expectOne(`${API.reportes}/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDashboard);
  });

  it('debe normalizar el total de miembros, los planes y los ingresos recientes del dashboard', () => {
    service.getDashboardResumen().subscribe((res) => {
      expect(res.totalSocios).toBe(100);
      expect(res.topPlanes).toEqual([
        { planId: 1, nombrePlan: 'Mensual', cantidadSocios: 30, porcentaje: 75 },
        { planId: 2, nombrePlan: 'Anual', cantidadSocios: 10, porcentaje: 25 },
      ]);
      expect(res.ingresosUltimos6Meses[0].total).toBe(1250);
    });

    const req = httpTesting.expectOne(`${API.reportes}/dashboard`);
    req.flush({
      activos: 70,
      morosos: 20,
      inactivos: 10,
      planesContratados: [
        { idPlan: 1, planNombre: 'Mensual', cantidad: 30 },
        { idPlan: 2, planNombre: 'Anual', cantidad: 10 },
      ],
      ingresosUltimosMeses: [{ numeroMes: 10, montoTotal: 1250 }],
    });
  });

  it('debe llamar a GET /reportes/ingresos con parámetro de año', () => {
    const mockIngresos: any = { anioConsultado: 2026, ingresoTotal: 15000 };

    service.getReporteIngresos(2026).subscribe((res) => {
      expect(res.anioConsultado).toBe(2026);
    });

    const req = httpTesting.expectOne((r) => r.url === `${API.reportes}/ingresos` && r.params.get('anio') === '2026');
    expect(req.request.method).toBe('GET');
    req.flush(mockIngresos);
  });

  it('debe filtrar ingresos por fecha de inicio y fecha de fin', () => {
    service.getReporteIngresos(undefined, '2026-01-01', '2026-03-31').subscribe();

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${API.reportes}/ingresos` &&
        r.params.get('fechaInicio') === '2026-01-01' &&
        r.params.get('fechaFin') === '2026-03-31' &&
        !r.params.has('anio')
    );
    req.flush({});
  });

  it('debe llamar a GET /reportes/miembros-estado con filtro MOROSO y sucursal', () => {
    const mockMiembros: any = { totalSocios: 50, morosos: 15 };

    service.getReporteMiembrosEstado('MOROSO', 1).subscribe((res) => {
      expect(res.morosos).toBe(15);
    });

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${API.reportes}/miembros-estado` &&
        r.params.get('estado') === 'MOROSO' &&
        r.params.get('sucursalId') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockMiembros);
  });

  it('debe llamar a GET /reportes/renovaciones con año', () => {
    const mockRenovaciones: any = { anioConsultado: 2026, totalRenovaciones: 45 };

    service.getReporteRenovaciones(2026).subscribe((res) => {
      expect(res.totalRenovaciones).toBe(45);
    });

    const req = httpTesting.expectOne((r) => r.url === `${API.reportes}/renovaciones` && r.params.get('anio') === '2026');
    expect(req.request.method).toBe('GET');
    req.flush(mockRenovaciones);
  });

  it('debe llamar a GET /reportes/asistencias con mes y año', () => {
    const mockAsistencias: any = { totalAsistenciasPeriodo: 250, horaPico: '18:00 - 19:00' };

    service.getMetricasAsistencia(10, 2026, 1).subscribe((res) => {
      expect(res.horaPico).toBe('18:00 - 19:00');
    });

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${API.reportes}/asistencias` &&
        r.params.get('mes') === '10' &&
        r.params.get('anio') === '2026' &&
        r.params.get('sucursalId') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockAsistencias);
  });

  it('debe filtrar asistencias por fecha de inicio y fecha de fin', () => {
    service.getMetricasAsistencia(undefined, undefined, undefined, '2026-10-01', '2026-10-20').subscribe();

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${API.reportes}/asistencias` &&
        r.params.get('fechaInicio') === '2026-10-01' &&
        r.params.get('fechaFin') === '2026-10-20' &&
        !r.params.has('mes') &&
        !r.params.has('anio')
    );
    req.flush({});
  });
});
