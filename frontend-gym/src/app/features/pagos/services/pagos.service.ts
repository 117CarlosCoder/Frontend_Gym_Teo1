import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import { CotizacionPago, MembresiaPagable, MetodoPago, Pagina, Pago, RegistrarPagoRequest } from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);

  listarMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${API.pagos}/metodos-pago`);
  }

  /**
   * Cotización del cobro de una membresía: precio del plan, descuento por promoción vigente,
   * recargo por pago tardío y total a cobrar. Es el mismo cálculo que el backend usa al registrar el pago.
   */
  cotizar(idMembresia: number): Observable<CotizacionPago> {
    return this.http.get<any>(`${API.pagos}/cotizacion/${idMembresia}`).pipe(
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
    };
  }
}
