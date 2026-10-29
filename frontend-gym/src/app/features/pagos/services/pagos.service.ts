import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import {
  CotizacionPago,
  EstadoCuenta,
  FacturaCuenta,
  MembresiaPagable,
  MetodoPago,
  Pagina,
  Pago,
  RegistrarAbonoRequest,
  RegistrarPagoRequest,
  ReglasAbono,
} from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);

  listarMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${API.pagos}/metodos-pago`);
  }

  /**
   * Cotización del cobro de una membresía: precio del plan, descuento por promoción vigente,
   * recargo por pago tardío y total a cobrar. Es el mismo cálculo que el backend usa al registrar el pago.
   * Sin idPromocion el backend aplica la promoción vigente con mayor descuento.
   */
  cotizar(idMembresia: number, idPromocion?: number | null): Observable<CotizacionPago> {
    const params = idPromocion ? new HttpParams().set('idPromocion', idPromocion) : undefined;
    return this.http.get<any>(`${API.pagos}/cotizacion/${idMembresia}`, { params }).pipe(
      map((dto) => ({
        idMembresia: dto.idMembresia,
        montoBase: Number(dto.montoBase ?? 0),
        idPromocion: dto.idPromocion ?? null,
        nombrePromocion: dto.nombrePromocion ?? null,
        descuento: Number(dto.descuento ?? 0),
        pagoTardio: !!dto.pagoTardio,
        diasAtraso: Number(dto.diasAtraso ?? 0),
        porcentajeRecargo: Number(dto.porcentajeRecargo ?? 0),
        recargo: Number(dto.recargo ?? 0),
        total: Number(dto.total ?? 0),
        fechaCalculo: dto.fechaCalculo,
      })),
    );
  }

  /** Registra el pago; el backend recalcula la fecha de vencimiento según la duración del plan. */
  registrar(pago: RegistrarPagoRequest): Observable<Pago> {
    return this.http.post<Pago>(API.pagos, pago).pipe(map((dto) => this.normalizar(dto)));
  }

  /** Historial de pagos de un socio, del más reciente al más antiguo. */
  historialPorSocio(idSocio: number, pagina = 0, tamano = 10): Observable<Pagina<Pago>> {
    const params = new HttpParams()
      .set('page', pagina)
      .set('size', tamano)
      .set('sort', 'fechaPago,desc');
    return this.http.get<Pagina<Pago>>(`${API.pagos}/socio/${idSocio}`, { params }).pipe(
      map((res) => ({ ...res, content: (res.content ?? []).map((p) => this.normalizar(p)) })),
    );
  }

  /** Abono al saldo de una factura pagada en cuotas. */
  registrarAbono(abono: RegistrarAbonoRequest): Observable<Pago> {
    return this.http.post<Pago>(`${API.pagos}/abonos`, abono).pipe(map((dto) => this.normalizar(dto)));
  }

  /** Estado de cuenta de un socio (ADMIN, RECEPCIONISTA o el propio socio). */
  estadoCuenta(idSocio: number): Observable<EstadoCuenta> {
    return this.http.get<any>(`${API.pagos}/estado-cuenta/socio/${idSocio}`).pipe(map((dto) => this.mapearCuenta(dto)));
  }

  /** Estado de cuenta del socio autenticado. */
  miEstadoCuenta(): Observable<EstadoCuenta> {
    return this.http.get<any>(`${API.pagos}/estado-cuenta/me`).pipe(map((dto) => this.mapearCuenta(dto)));
  }

  obtenerReglasAbono(): Observable<ReglasAbono> {
    return this.http.get<any>(`${API.configuracion}/abonos`).pipe(map((dto) => this.mapearReglasAbono(dto)));
  }

  actualizarReglasAbono(reglas: Pick<ReglasAbono, 'porcentajeMinimoInicial' | 'plazoDias'>): Observable<ReglasAbono> {
    return this.http.put<any>(`${API.configuracion}/abonos`, reglas).pipe(map((dto) => this.mapearReglasAbono(dto)));
  }

  /** Membresías del socio a las que se les puede aplicar un pago. */
  membresiasDeSocio(idSocio: number): Observable<MembresiaPagable[]> {
    return this.http.get<any[]>(`${API.membresias}/socio/${idSocio}`).pipe(
      map((lista) =>
        (lista ?? []).map((dto) => ({
          id: dto.id,
          nombrePlan: dto.plan?.nombre ?? 'Plan',
          duracionDias: Number(dto.plan?.duracion ?? 30),
          precio: Number(dto.plan?.precio ?? 0),
          fechaInicio: dto.fechaInicio,
          fechaVencimiento: dto.fechaVencimiento ?? null,
          estado: (dto.estado?.nombre ?? (dto.activa ? 'ACTIVA' : 'INACTIVA')).toUpperCase(),
          activa: !!dto.activa,
        })),
      ),
    );
  }

  /** Descarga el comprobante en PDF generado por el backend. */
  descargarComprobante(idComprobante: number): Observable<Blob> {
    return this.http.get(`${API.pagos}/${idComprobante}/pdf`, { responseType: 'blob' });
  }

  /** Guarda el PDF en el equipo del usuario. */
  guardarPdf(pdf: Blob, idComprobante: number): void {
    const url = URL.createObjectURL(pdf);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `comprobante_pago_${idComprobante}.pdf`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private normalizar(dto: Pago): Pago {
    const montoPagado = Number(dto.montoPagado ?? 0);
    const descuento = Number(dto.descuento ?? 0);
    const recargo = Number(dto.recargo ?? 0);
    return {
      ...dto,
      montoPagado,
      descuento,
      recargo,
      montoBase: dto.montoBase != null ? Number(dto.montoBase) : montoPagado + descuento - recargo,
      idPromocion: dto.idPromocion ?? null,
      nombrePromocion: dto.nombrePromocion ?? null,
      totalFactura: dto.totalFactura != null ? Number(dto.totalFactura) : null,
      estadoFactura: dto.estadoFactura ?? null,
      numeroAbono: Number(dto.numeroAbono ?? 1),
      totalAbonado: dto.totalAbonado != null ? Number(dto.totalAbonado) : null,
      saldoPendiente: Number(dto.saldoPendiente ?? 0),
      fechaLimiteSaldo: dto.fechaLimiteSaldo ?? null,
    };
  }

  private mapearCuenta(dto: any): EstadoCuenta {
    return {
      idSocio: dto?.idSocio,
      nombreSocio: dto?.nombreSocio ?? null,
      totalFacturado: Number(dto?.totalFacturado ?? 0),
      totalPagado: Number(dto?.totalPagado ?? 0),
      saldoPendiente: Number(dto?.saldoPendiente ?? 0),
      saldoVencido: Number(dto?.saldoVencido ?? 0),
      proximaFechaLimite: dto?.proximaFechaLimite ?? null,
      facturas: (dto?.facturas ?? []).map(
        (f: any): FacturaCuenta => ({
          idFactura: f.idFactura,
          idMembresia: f.idMembresia,
          nombrePlan: f.nombrePlan ?? 'Plan',
          fechaEmision: f.fechaEmision,
          fechaLimite: f.fechaLimite ?? null,
          montoBase: Number(f.montoBase ?? 0),
          descuento: Number(f.descuento ?? 0),
          recargo: Number(f.recargo ?? 0),
          total: Number(f.total ?? 0),
          pagado: Number(f.pagado ?? 0),
          saldo: Number(f.saldo ?? 0),
          estado: f.estado ?? 'PAGADA',
          abonos: (f.abonos ?? []).map((a: any) => ({
            idComprobante: a.idComprobante,
            fechaPago: a.fechaPago,
            monto: Number(a.monto ?? 0),
            metodoPago: a.metodoPago ?? null,
            referencia: a.referencia ?? null,
          })),
        }),
      ),
    };
  }

  private mapearReglasAbono(dto: any): ReglasAbono {
    return {
      porcentajeMinimoInicial: Number(dto?.porcentajeMinimoInicial ?? 100),
      plazoDias: Number(dto?.plazoDias ?? 0),
      fechaActualizacion: dto?.fechaActualizacion ?? null,
    };
  }
}
