import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import { GuardarPromocionRequest, Promocion, RecargoTardio } from '../models/promocion.model';

@Injectable({ providedIn: 'root' })
export class PromocionesService {
  private readonly http = inject(HttpClient);

  /** Todas las promociones (solo ADMIN). */
  listar(): Observable<Promocion[]> {
    return this.http.get<any[]>(API.promociones).pipe(map((lista) => (lista ?? []).map((p) => this.mapear(p))));
  }

  /** Promociones activas y dentro de su vigencia (ADMIN y RECEPCIONISTA, para elegir al cobrar). */
  listarVigentes(): Observable<Promocion[]> {
    return this.http
      .get<any[]>(`${API.promociones}/vigentes`)
      .pipe(map((lista) => (lista ?? []).map((p) => this.mapear(p))));
  }

  crear(promocion: GuardarPromocionRequest): Observable<Promocion> {
    return this.http.post<any>(API.promociones, promocion).pipe(map((p) => this.mapear(p)));
  }

  actualizar(id: number, cambios: Partial<GuardarPromocionRequest>): Observable<Promocion> {
    return this.http.put<any>(`${API.promociones}/${id}`, cambios).pipe(map((p) => this.mapear(p)));
  }

  /** El backend rechaza eliminar una promoción ya aplicada en facturas (se debe desactivar). */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${API.promociones}/${id}`);
  }

  obtenerRecargoTardio(): Observable<RecargoTardio> {
    return this.http.get<any>(`${API.configuracion}/recargo-tardio`).pipe(map((r) => this.mapearRecargo(r)));
  }

  actualizarRecargoTardio(porcentaje: number): Observable<RecargoTardio> {
    return this.http
      .put<any>(`${API.configuracion}/recargo-tardio`, { porcentaje })
      .pipe(map((r) => this.mapearRecargo(r)));
  }

  private mapear(dto: any): Promocion {
    return {
      id: dto.id,
      nombre: dto.nombre ?? '',
      descripcion: dto.descripcion ?? null,
      tipoDescuento: dto.tipoDescuento === 'MONTO_FIJO' ? 'MONTO_FIJO' : 'PORCENTAJE',
      valorDescuento: Number(dto.valorDescuento ?? 0),
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      activo: !!dto.activo,
      vigente: !!dto.vigente,
    };
  }

  private mapearRecargo(dto: any): RecargoTardio {
    return { porcentaje: Number(dto?.porcentaje ?? 0), fechaActualizacion: dto?.fechaActualizacion ?? null };
  }
}
