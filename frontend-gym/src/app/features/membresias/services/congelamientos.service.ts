import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import { Congelamiento, CongelarMembresiaRequest, ReglasCongelamiento } from '../models/congelamiento.model';

@Injectable({ providedIn: 'root' })
export class CongelamientosService {
  private readonly http = inject(HttpClient);

  listar(idMembresia: number): Observable<Congelamiento[]> {
    return this.http
      .get<any[]>(`${API.membresias}/${idMembresia}/congelamientos`)
      .pipe(map((lista) => (lista ?? []).map((c) => this.mapear(c))));
  }

  /** Congelamientos del socio autenticado (portal del socio). */
  misCongelamientos(): Observable<Congelamiento[]> {
    return this.http
      .get<any[]>(`${API.membresias}/me/congelamientos`)
      .pipe(map((lista) => (lista ?? []).map((c) => this.mapear(c))));
  }

  congelar(idMembresia: number, solicitud: CongelarMembresiaRequest): Observable<Congelamiento> {
    return this.http
      .post<any>(`${API.membresias}/${idMembresia}/congelamientos`, solicitud)
      .pipe(map((c) => this.mapear(c)));
  }

  /** Descongela antes de tiempo (o anula uno programado); el backend devuelve los días no usados. */
  finalizar(idCongelamiento: number): Observable<Congelamiento> {
    return this.http
      .post<any>(`${API.membresias}/congelamientos/${idCongelamiento}/finalizar`, {})
      .pipe(map((c) => this.mapear(c)));
  }

  obtenerReglas(): Observable<ReglasCongelamiento> {
    return this.http.get<any>(`${API.configuracion}/congelamiento`).pipe(map((r) => this.mapearReglas(r)));
  }

  actualizarReglas(reglas: Omit<ReglasCongelamiento, 'fechaActualizacion'>): Observable<ReglasCongelamiento> {
    return this.http.put<any>(`${API.configuracion}/congelamiento`, reglas).pipe(map((r) => this.mapearReglas(r)));
  }

  private mapear(dto: any): Congelamiento {
    return {
      id: dto.id,
      idMembresia: dto.idMembresia,
      nombrePlan: dto.nombrePlan ?? null,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      dias: Number(dto.dias ?? 0),
      motivo: dto.motivo ?? null,
      estado: dto.estado ?? 'PROGRAMADO',
      fechaVencimientoMembresia: dto.fechaVencimientoMembresia ?? null,
      fechaRegistro: dto.fechaRegistro ?? null,
      registradoPor: dto.registradoPor ?? null,
    };
  }

  private mapearReglas(dto: any): ReglasCongelamiento {
    return {
      diasMinimo: Number(dto?.diasMinimo ?? 1),
      diasMaximo: Number(dto?.diasMaximo ?? 30),
      maximoPorAnio: Number(dto?.maximoPorAnio ?? 1),
      fechaActualizacion: dto?.fechaActualizacion ?? null,
    };
  }
}
