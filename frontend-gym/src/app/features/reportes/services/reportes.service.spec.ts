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
      expect(res).toEqual(mockDashboard);
    });

    const req = httpTesting.expectOne(`${API.reportes}/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDashboard);
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
});

