import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import {
  DashboardResumen,
  MetricaAsistencia,
  ReporteIngresos,
  ReporteMiembrosEstado,
  ReporteRenovaciones,
} from '../models/reporte.model';

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private readonly http = inject(HttpClient);

  /**
   * Resumen ejecutivo tipo dashboard con indicadores clave consolidados.
   */
  getDashboardResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${API.reportes}/dashboard`);
  }

  /**
   * Reporte financiero de ingresos por mes, método de pago y listado detallado.
   * @param anio Año a consultar (opcional, histórico si se omite).
   */
  getReporteIngresos(anio?: number): Observable<ReporteIngresos> {
    let params = new HttpParams();
    if (anio !== undefined && anio !== null) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<ReporteIngresos>(`${API.reportes}/ingresos`, { params });
  }

  /**
   * Reporte de miembros activos vs morosos con información detallada y días de mora.
   * @param estado Filtro opcional: 'ACTIVO' o 'MOROSO'.
   * @param sucursalId Filtro opcional por sucursal.
   */
  getReporteMiembrosEstado(estado?: string, sucursalId?: number): Observable<ReporteMiembrosEstado> {
    let params = new HttpParams();
    if (estado && estado.trim() && estado !== 'TODOS') {
      params = params.set('estado', estado.trim().toUpperCase());
    }
    if (sucursalId !== undefined && sucursalId !== null) {
      params = params.set('sucursalId', sucursalId.toString());
    }
    return this.http.get<ReporteMiembrosEstado>(`${API.reportes}/miembros-estado`, { params });
  }

  /**
   * Reporte de renovaciones de membresías y tasa de retención.
   * @param anio Año a consultar (opcional).
   */
  getReporteRenovaciones(anio?: number): Observable<ReporteRenovaciones> {
    let params = new HttpParams();
    if (anio !== undefined && anio !== null) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<ReporteRenovaciones>(`${API.reportes}/renovaciones`, { params });
  }

  /**
   * Métricas y estadísticas de afluencia y asistencia (horas pico, días y top socios).
   * @param mes Mes (1-12, opcional).
   * @param anio Año (opcional).
   * @param sucursalId ID sucursal (opcional).
   */
  getMetricasAsistencia(mes?: number, anio?: number, sucursalId?: number): Observable<MetricaAsistencia> {
    let params = new HttpParams();
    if (mes !== undefined && mes !== null) {
      params = params.set('mes', mes.toString());
    }
    if (anio !== undefined && anio !== null) {
      params = params.set('anio', anio.toString());
    }
    if (sucursalId !== undefined && sucursalId !== null) {
      params = params.set('sucursalId', sucursalId.toString());
    }
    return this.http.get<MetricaAsistencia>(`${API.reportes}/asistencias`, { params });
  }
}
