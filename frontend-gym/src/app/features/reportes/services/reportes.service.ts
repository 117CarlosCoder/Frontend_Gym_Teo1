import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import {
  DashboardResumen,
  MetricaAsistencia,
  MetricasAsistenciaRango,
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
   * Normaliza los campos para garantizar que 'anio', 'ingresoTotal' y desgloses estén siempre completos.
   * @param anio Año a consultar (opcional, histórico si se omite).
   */
  getReporteIngresos(anio?: number): Observable<ReporteIngresos> {
    let params = new HttpParams();
    if (anio !== undefined && anio !== null) {
      params = params.set('anio', anio.toString());
    }

    return this.http.get<any>(`${API.reportes}/ingresos`, { params }).pipe(
      map((res: any) => {
        const anioResuelto = res.anio ?? anio ?? new Date().getFullYear();
        const total = res.totalPeriodo ?? res.ingresoTotal ?? 0;
        const totalTx = res.cantidadPagosPeriodo ?? res.totalTransacciones ?? 0;

        return {
          anio: anioResuelto,
          anioConsultado: anioResuelto,
          ingresoTotal: Number(total),
          totalPeriodo: Number(total),
          totalTransacciones: Number(totalTx),
          cantidadPagosPeriodo: Number(totalTx),
          ingresoPromedioMensual: res.ingresoPromedioMensual ? Number(res.ingresoPromedioMensual) : 0,
          mesMayorIngreso: res.mesMayorIngreso || '',
          montoMayorIngreso: res.montoMayorIngreso ? Number(res.montoMayorIngreso) : 0,
          ingresosPorMes: (res.ingresosPorMes || []).map((m: any) => ({
            mes: m.mes,
            nombreMes: m.nombreMes,
            anio: m.anio ?? anioResuelto,
            total: Number(m.total ?? 0),
            transacciones: Number(m.cantidadPagos ?? m.transacciones ?? 0),
            cantidadPagos: Number(m.cantidadPagos ?? m.transacciones ?? 0),
          })),
          ingresosPorMetodoPago: (res.ingresosPorMetodoPago || []).map((mp: any) => ({
            metodoPago: mp.metodoPago,
            total: Number(mp.total ?? 0),
            transacciones: Number(mp.cantidad ?? mp.transacciones ?? 0),
            cantidad: Number(mp.cantidad ?? mp.transacciones ?? 0),
            porcentaje: Number(mp.porcentaje ?? 0),
          })),
          pagosDetalle: (res.ultimosPagos || res.pagosDetalle || []).map((p: any) => ({
            idComprobante: p.comprobanteId ?? p.idComprobante ?? 0,
            comprobanteId: p.comprobanteId ?? p.idComprobante ?? 0,
            fechaPago: p.fechaPago,
            nombreSocio: p.nombreSocio ?? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim(),
            nombrePlan: p.nombrePlan ?? p.plan ?? '',
            metodoPago: p.metodoPago ?? 'EFECTIVO',
            monto: Number(p.montoPagado ?? p.monto ?? 0),
            referencia: p.referencia ?? null,
            recepcionista: p.nombreRecepcionista ?? p.recepcionista ?? 'Recepción',
          })),
          ultimosPagos: (res.ultimosPagos || res.pagosDetalle || []).map((p: any) => ({
            idComprobante: p.comprobanteId ?? p.idComprobante ?? 0,
            comprobanteId: p.comprobanteId ?? p.idComprobante ?? 0,
            fechaPago: p.fechaPago,
            nombreSocio: p.nombreSocio ?? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim(),
            nombrePlan: p.nombrePlan ?? p.plan ?? '',
            metodoPago: p.metodoPago ?? 'EFECTIVO',
            monto: Number(p.montoPagado ?? p.monto ?? 0),
            referencia: p.referencia ?? null,
            recepcionista: p.nombreRecepcionista ?? p.recepcionista ?? 'Recepción',
          })),
        };
      })
    );
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

    return this.http.get<any>(`${API.reportes}/miembros-estado`, { params }).pipe(
      map((res: any) => ({
        fechaCorte: res.fechaCorte ?? new Date().toISOString().split('T')[0],
        totalSocios: Number(res.totalSocios ?? 0),
        activos: Number(res.activos ?? 0),
        morosos: Number(res.morosos ?? 0),
        inactivos: Number(res.inactivos ?? 0),
        porcentajeActivos: Number(res.porcentajeActivos ?? 0),
        porcentajeMorosos: Number(res.porcentajeMorosos ?? 0),
        distribucionPorSucursal: (res.distribucionPorSucursal || []).map((d: any) => ({
          sucursalId: d.sucursalId,
          nombreSucursal: d.nombreSucursal,
          activos: Number(d.activos ?? 0),
          morosos: Number(d.morosos ?? 0),
          total: Number(d.total ?? 0),
        })),
        distribucionPorPlan: (res.distribucionPorPlan || []).map((d: any) => ({
          planId: d.planId,
          nombrePlan: d.nombrePlan ?? 'Plan',
          cantidadSocios: Number(d.cantidad ?? d.cantidadSocios ?? 0),
          porcentaje: Number(d.porcentaje ?? 0),
        })),
        miembros: (res.miembros || []).map((m: any) => ({
          socioId: m.socioId,
          nombres: m.nombres ?? '',
          apellidos: m.apellidos ?? '',
          correo: m.correo ?? '',
          dpi: m.dpi ?? '',
          estadoSocio: m.estado ?? m.estadoSocio ?? 'ACTIVO',
          planActual: m.planNombre ?? m.planActual ?? 'Sin plan',
          fechaFinMembresia: m.fechaVencimientoMembresia ?? m.fechaFinMembresia ?? null,
          diasMora: Number(m.diasMora ?? 0),
          saldoPendiente: Number(m.saldoPendiente ?? 0),
          sucursal: m.sucursalNombre ?? m.sucursal ?? 'Central',
        })),
      }))
    );
  }

  /**
   * Serie de asistencias en un rango de fechas (GET /asistencias/metricas), sin información financiera.
   * @param desde Fecha inicial (YYYY-MM-DD).
   * @param hasta Fecha final (YYYY-MM-DD).
   * @param agrupacion DIA, SEMANA o MES.
   */
  getMetricasAsistenciaRango(
    desde: string,
    hasta: string,
    agrupacion: 'DIA' | 'SEMANA' | 'MES' = 'DIA',
  ): Observable<MetricasAsistenciaRango> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta).set('agrupacion', agrupacion);
    return this.http.get<any>(`${API.asistencias}/metricas`, { params }).pipe(
      map((res: any) => ({
        desde: res.desde ?? desde,
        hasta: res.hasta ?? hasta,
        agrupacion: res.agrupacion ?? agrupacion,
        totalAsistencias: Number(res.totalAsistencias ?? 0),
        sociosUnicos: Number(res.sociosUnicos ?? 0),
        promedioDiario: Number(res.promedioDiario ?? 0),
        serie: (res.serie || []).map((p: any) => ({ periodo: String(p.periodo), total: Number(p.total ?? 0) })),
        porSucursal: (res.porSucursal || []).map((s: any) => ({
          idSucursal: s.idSucursal ?? null,
          nombreSucursal: s.nombreSucursal ?? 'Sin sucursal',
          total: Number(s.total ?? 0),
        })),
      })),
    );
  }

  /**
   * Reporte de renovaciones de membresías y tasa de retención.
   * Normaliza 'anio', 'tasaRetencionPromedio' y listas de renovaciones.
   * @param anio Año a consultar (opcional).
   */
  getReporteRenovaciones(anio?: number): Observable<ReporteRenovaciones> {
    let params = new HttpParams();
    if (anio !== undefined && anio !== null) {
      params = params.set('anio', anio.toString());
    }

    return this.http.get<any>(`${API.reportes}/renovaciones`, { params }).pipe(
      map((res: any) => {
        const anioResuelto = res.anio ?? anio ?? new Date().getFullYear();
        const tasa = res.tasaRenovacionGlobal ?? res.tasaRetencionPromedio ?? 0;
        const totalRen = res.totalRenovaciones ?? 0;

        return {
          anio: anioResuelto,
          anioConsultado: anioResuelto,
          totalRenovaciones: Number(totalRen),
          totalMembresiasPeriodo: Number(res.totalMembresiasPeriodo ?? 0),
          nuevasMembresias: Number(res.nuevasMembresias ?? 0),
          tasaRetencionPromedio: Number(tasa),
          tasaRenovacionGlobal: Number(tasa),
          proximasAVencerSiguienteSemana: Number(res.proximasAVencerSiguienteSemana ?? 0),
          renovacionesPorMes: (res.renovacionesPorMes || []).map((rm: any) => ({
            mes: rm.mes,
            anio: rm.anio ?? anioResuelto,
            nombreMes: rm.nombreMes,
            renovaciones: Number(rm.renovaciones ?? 0),
            nuevas: Number(rm.nuevas ?? 0),
            total: Number(rm.total ?? 0),
            tasaRetencion: Number(rm.tasaRenovacion ?? rm.tasaRetencion ?? 0),
            tasaRenovacion: Number(rm.tasaRenovacion ?? rm.tasaRetencion ?? 0),
          })),
          detalles: (res.ultimasRenovaciones || res.detalles || []).map((d: any) => ({
            idMembresia: d.idMembresia ?? d.membresiaId ?? 0,
            membresiaId: d.idMembresia ?? d.membresiaId ?? 0,
            idSocio: d.idSocio ?? d.socioId ?? 0,
            socioId: d.idSocio ?? d.socioId ?? 0,
            nombreSocio: d.nombreSocio ?? '',
            planRenovado: d.planRenovado ?? d.nombrePlan ?? '',
            fechaRenovacion: d.fechaRenovacion ?? d.fecha ?? '',
            nuevaFechaVencimiento: d.nuevaFechaVencimiento ?? d.fechaVencimiento ?? '',
          })),
          ultimasRenovaciones: (res.ultimasRenovaciones || res.detalles || []).map((d: any) => ({
            idMembresia: d.idMembresia ?? d.membresiaId ?? 0,
            membresiaId: d.idMembresia ?? d.membresiaId ?? 0,
            idSocio: d.idSocio ?? d.socioId ?? 0,
            socioId: d.idSocio ?? d.socioId ?? 0,
            nombreSocio: d.nombreSocio ?? '',
            planRenovado: d.planRenovado ?? d.nombrePlan ?? '',
            fechaRenovacion: d.fechaRenovacion ?? d.fecha ?? '',
            nuevaFechaVencimiento: d.nuevaFechaVencimiento ?? d.fechaVencimiento ?? '',
          })),
        };
      })
    );
  }

  /**
   * Métricas y estadísticas de afluencia y asistencia (horas pico, días y top socios).
   * Calcula dinámicamente el horario pico en base al recuento de clientes, aplicando estándar si no hay datos.
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

    return this.http.get<any>(`${API.reportes}/asistencias`, { params }).pipe(
      map((res: any) => {
        const total = res.asistenciasMesActual ?? res.totalAsistenciasPeriodo ?? res.asistenciasHoy ?? 0;
        const listaHoras = res.horasPico || res.distribucionHorasPico || [];

        // Calcular horario pico en base a la cantidad de clientes
        let maxCantidad = 0;
        let franjaMax: string | null = null;
        for (const h of listaHoras) {
          const c = Number(h.cantidad ?? h.totalAsistencias ?? 0);
          if (c > maxCantidad) {
            maxCantidad = c;
            franjaMax = h.etiquetaHora || h.franjaHoraria;
          }
        }

        // Si hay clientes, mostrar la franja pico y cantidad. Si no hay, dejar el estándar "18:00 - 19:00"
        const horarioPicoFinal = (maxCantidad > 0 && franjaMax)
          ? `${franjaMax} (${maxCantidad} ${maxCantidad === 1 ? 'cliente' : 'clientes'})`
          : (res.horaPico || '18:00 - 19:00');

        // Buscar día con mayor afluencia
        const listaDias = res.asistenciasPorDiaSemana || [];
        let maxDiaCant = 0;
        let diaNombreMax: string | null = null;
        for (const d of listaDias) {
          const c = Number(d.cantidad ?? d.totalAsistencias ?? 0);
          if (c > maxDiaCant) {
            maxDiaCant = c;
            diaNombreMax = d.nombreDia || d.diaSemana;
          }
        }

        return {
          totalAsistenciasPeriodo: Number(total),
          asistenciasMesActual: Number(total),
          asistenciasSemanaActual: Number(res.asistenciasSemanaActual ?? 0),
          asistenciasHoy: Number(res.asistenciasHoy ?? 0),
          promedioDiario: Number(res.promedioDiarioMes ?? res.promedioDiario ?? 0),
          promedioDiarioMes: Number(res.promedioDiarioMes ?? res.promedioDiario ?? 0),
          diaMayorAfluencia: diaNombreMax || res.diaMayorAfluencia || 'Lunes',
          horaPico: horarioPicoFinal,
          horasPico: listaHoras.map((h: any) => ({
            hora: h.hora,
            etiquetaHora: h.etiquetaHora || h.franjaHoraria || `${h.hora}:00 - ${h.hora + 1}:00`,
            franjaHoraria: h.etiquetaHora || h.franjaHoraria || `${h.hora}:00 - ${h.hora + 1}:00`,
            totalAsistencias: Number(h.cantidad ?? h.totalAsistencias ?? 0),
            cantidad: Number(h.cantidad ?? h.totalAsistencias ?? 0),
            porcentaje: total > 0
              ? Math.round((Number(h.cantidad ?? h.totalAsistencias ?? 0) * 100) / total)
              : 0,
          })),
          distribucionHorasPico: listaHoras.map((h: any) => ({
            hora: h.hora,
            etiquetaHora: h.etiquetaHora || h.franjaHoraria || `${h.hora}:00 - ${h.hora + 1}:00`,
            franjaHoraria: h.etiquetaHora || h.franjaHoraria || `${h.hora}:00 - ${h.hora + 1}:00`,
            totalAsistencias: Number(h.cantidad ?? h.totalAsistencias ?? 0),
            cantidad: Number(h.cantidad ?? h.totalAsistencias ?? 0),
            porcentaje: total > 0
              ? Math.round((Number(h.cantidad ?? h.totalAsistencias ?? 0) * 100) / total)
              : 0,
          })),
          asistenciasPorDiaSemana: (res.asistenciasPorDiaSemana || []).map((d: any) => ({
            numeroDia: d.numeroDia,
            nombreDia: d.nombreDia || d.diaSemana || 'Día',
            diaSemana: d.nombreDia || d.diaSemana || 'Día',
            totalAsistencias: Number(d.cantidad ?? d.totalAsistencias ?? 0),
            cantidad: Number(d.cantidad ?? d.totalAsistencias ?? 0),
            porcentaje: Number(d.porcentaje ?? 0),
          })),
          topSociosAsistencia: (res.topSociosFrecuentes || res.topSociosAsistencia || []).map((s: any) => ({
            socioId: s.socioId,
            nombreSocio: s.nombreCompleto || s.nombreSocio || 'Socio',
            nombreCompleto: s.nombreCompleto || s.nombreSocio || 'Socio',
            totalVisitas: Number(s.asistencias ?? s.totalVisitas ?? 0),
            asistencias: Number(s.asistencias ?? s.totalVisitas ?? 0),
          })),
          asistenciasPorSucursal: (res.asistenciasPorSucursal || []).map((s: any) => ({
            sucursalId: s.sucursalId,
            nombreSucursal: s.nombreSucursal || 'Sede Central',
            totalAsistencias: Number(s.cantidad ?? s.totalAsistencias ?? 0),
            cantidad: Number(s.cantidad ?? s.totalAsistencias ?? 0),
          })),
        };
      })
    );
  }
}
