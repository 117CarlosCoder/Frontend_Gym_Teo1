import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';

import { AsistenciaRegistro, RegistrarAsistenciaRequest, SocioAsistencia } from '../models/asistencia.model';
import { Sucursal } from '../../../core/models/sucursal.model';
import { API } from '../../../core/constants/api.constants';
import { SociosService } from '../../socios/services/socios.service';

/** Sucursales registradas en la base de datos (migración V5 del backend). */
export const SUCURSALES_GIMNASIO: Sucursal[] = [
  { idSucursal: 1, nombre: 'Sucursal Central (Zona 1)', direccion: '12 Calle 5-45 Zona 1, Ciudad de Guatemala', activa: true },
  { idSucursal: 2, nombre: 'Sucursal Norte (Zona 10)', direccion: 'Avenida Las Américas 8-20 Zona 10', activa: true },
  { idSucursal: 3, nombre: 'Sucursal Sur (Carretera)', direccion: 'Km 14.5 Carretera a El Salvador', activa: true },
];

/** Control de acceso al gimnasio (M6): entradas, salidas y socios dentro. Todo se lee del backend. */
@Injectable({
  providedIn: 'root',
})
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly sociosService = inject(SociosService);

  getSucursales(): Observable<Sucursal[]> {
    return of(SUCURSALES_GIMNASIO);
  }

  /** Asistencias de hoy (con hora de entrada, salida y si el socio sigue dentro). */
  getAsistenciasHoy(idSucursal?: number | null): Observable<AsistenciaRegistro[]> {
    let params = new HttpParams();
    if (idSucursal) params = params.set('sucursalId', idSucursal);
    return this.http
      .get<any[]>(`${API.asistencias}/hoy`, { params })
      .pipe(map((lista) => (lista ?? []).map((dto) => this.mapear(dto))));
  }

  /** Historial de entradas y salidas del socio que inició sesión. */
  getMisAsistencias(limite = 30): Observable<AsistenciaRegistro[]> {
    const params = new HttpParams().set('limite', limite);
    return this.http
      .get<any[]>(`${API.asistencias}/me`, { params })
      .pipe(map((lista) => (lista ?? []).map((dto) => this.mapear(dto))));
  }

  /** Socios reales para la pantalla de control de acceso. */
  getSociosParaAsistencia(): Observable<SocioAsistencia[]> {
    return this.sociosService.getSocios().pipe(
      map((socios) =>
        (socios ?? []).map((s) => ({
          idSocio: s.id_socio,
          nombre: s.usuario?.nombre || 'Socio',
          apellido: s.usuario?.apellido || '',
          estadoMembresia: s.estadoMembresia || 'Sin Membresía',
          tipoPlan: s.tipoPlan || 'Sin Plan',
        })),
      ),
    );
  }

  /**
   * Registra el ingreso (POST /asistencias/registro). El backend valida que la membresía esté vigente,
   * que el socio esté activo y que no siga dentro del gimnasio; si no, responde con el motivo del bloqueo.
   */
  registrarEntrada(request: RegistrarAsistenciaRequest): Observable<AsistenciaRegistro> {
    const payload = { id_socio: request.idSocio, sucursal_id: request.idSucursal };
    return this.http.post<any>(`${API.asistencias}/registro`, payload).pipe(
      map((res) => {
        const usuario = res.socio?.usuario ?? {};
        return {
          idAsistencia: res.idAsistencia,
          idSocio: request.idSocio,
          nombreSocio: usuario.nombres ?? 'Socio',
          apellidoSocio: usuario.apellidos ?? '',
          idSucursal: res.sucursalId ?? request.idSucursal,
          sucursal: res.sucursalNombre ?? this.nombreSucursal(request.idSucursal),
          fecha: res.fecha,
          horaEntrada: res.horaEntrada,
          horaSalida: null,
          dentro: true,
          minutosPermanencia: null,
          registradoPor: res.recepcionistaNombre ?? res.registradoPorNombre ?? 'Recepción',
        };
      }),
    );
  }

  /** Registra la salida en el backend; queda guardada aunque se cierre la sesión. */
  registrarSalida(idAsistencia: number): Observable<AsistenciaRegistro> {
    return this.http
      .post<any>(`${API.asistencias}/${idAsistencia}/salida`, {})
      .pipe(map((dto) => this.mapear(dto)));
  }

  private mapear(dto: any): AsistenciaRegistro {
    return {
      idAsistencia: dto.idAsistencia,
      idSocio: dto.idSocio,
      nombreSocio: dto.nombresSocio ?? 'Socio',
      apellidoSocio: dto.apellidosSocio ?? '',
      idSucursal: dto.sucursalId ?? null,
      sucursal: dto.sucursalNombre ?? this.nombreSucursal(dto.sucursalId),
      fecha: dto.fecha,
      horaEntrada: dto.horaEntrada,
      horaSalida: dto.horaSalida ?? null,
      dentro: dto.dentro ?? !dto.horaSalida,
      minutosPermanencia: dto.minutosPermanencia ?? null,
      registradoPor: dto.registradoPor ?? 'Recepción',
    };
  }

  private nombreSucursal(id: number | null | undefined): string {
    return SUCURSALES_GIMNASIO.find((s) => s.idSucursal === id)?.nombre ?? 'Sucursal';
  }
}
