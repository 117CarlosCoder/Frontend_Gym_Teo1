import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import {
  GuardarRutinaRequest,
  ReporteEntrenador,
  RutinaSemanal,
  SocioAsignadoEntrenador,
  SocioDentroEntrenador,
} from '../models/entrenador.model';

@Injectable({ providedIn: 'root' })
export class EntrenadorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.entrenadores}/me`;

  getSociosAsignados(): Observable<SocioAsignadoEntrenador[]> {
    return this.http.get<SocioAsignadoEntrenador[]>(`${this.baseUrl}/socios`);
  }

  getSociosDentro(): Observable<SocioDentroEntrenador[]> {
    return this.http.get<SocioDentroEntrenador[]>(`${this.baseUrl}/socios/dentro`);
  }

  getRutinas(): Observable<RutinaSemanal[]> {
    return this.http.get<RutinaSemanal[]>(`${this.baseUrl}/rutinas`);
  }

  guardarRutina(rutina: GuardarRutinaRequest, idRutina?: number): Observable<RutinaSemanal> {
    if (idRutina !== undefined) {
      return this.http.put<RutinaSemanal>(`${this.baseUrl}/rutinas/${idRutina}`, rutina);
    }
    return this.http.post<RutinaSemanal>(`${this.baseUrl}/rutinas`, rutina);
  }

  eliminarRutina(idRutina: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/rutinas/${idRutina}`);
  }

  getReporte(desde: string, hasta: string): Observable<ReporteEntrenador> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ReporteEntrenador>(`${this.baseUrl}/reportes`, { params });
  }
}
