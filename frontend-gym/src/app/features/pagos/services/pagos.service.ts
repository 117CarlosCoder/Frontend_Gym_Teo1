import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import { MembresiaPagable, MetodoPago, Pagina, Pago, RegistrarPagoRequest } from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);

  listarMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${API.pagos}/metodos-pago`);
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
    return { ...dto, montoPagado: Number(dto.montoPagado ?? 0) };
  }
}
