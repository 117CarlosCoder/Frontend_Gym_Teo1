import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { AsistenciaRegistro, RegistrarAsistenciaRequest, SocioAsistencia } from '../models/asistencia.model';
import { MOCK_ASISTENCIAS_HOY, MOCK_SOCIOS_ASISTENCIA, MOCK_SUCURSALES } from '../mocks/asistencia.mock';
import { Sucursal } from '../../../core/models/sucursal.model';
import { API, STORAGE_KEYS } from '../../../core/constants/api.constants';
import { SociosService } from '../../socios/services/socios.service';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly sociosService = inject(SociosService);
  private readonly storage = inject(StorageService);

  private asistencias: AsistenciaRegistro[] = this.cargarAsistenciasIniciales();
  private currentId = 100;

  private cargarAsistenciasIniciales(): AsistenciaRegistro[] {
    const guardadas = this.storage.obtener<AsistenciaRegistro[]>(STORAGE_KEYS.asistencias);
    if (guardadas && Array.isArray(guardadas) && guardadas.length > 0) {
      return guardadas;
    }
    return [...MOCK_ASISTENCIAS_HOY];
  }

  private guardarEnStorage(asistencias: AsistenciaRegistro[]): void {
    this.asistencias = asistencias;
    this.storage.guardar(STORAGE_KEYS.asistencias, asistencias);
  }

  getSucursales(): Observable<Sucursal[]> {
    return of(MOCK_SUCURSALES);
  }

  getAsistenciasHoy(idSucursal: number): Observable<AsistenciaRegistro[]> {
    const sucursal = MOCK_SUCURSALES.find((s) => s.idSucursal === idSucursal);
    if (!sucursal) return of([]);

    const filtradas = this.asistencias.filter((a) => a.sucursal === sucursal.nombre);
    return of(filtradas);
  }

  /**
   * Obtiene la lista de socios para la pantalla de asistencia,
   * consumiendo la información real de SociosService / Backend.
   */
  getSociosParaAsistencia(): Observable<SocioAsistencia[]> {
    return this.sociosService.getSocios().pipe(
      map((socios) => {
        if (!socios || socios.length === 0) {
          return MOCK_SOCIOS_ASISTENCIA;
        }
        return socios.map((s) => ({
          idSocio: s.id_socio,
          nombre: s.usuario?.nombre || 'Socio',
          apellido: s.usuario?.apellido || '',
          estadoMembresia: s.estadoMembresia || 'Sin Membresía',
          tipoPlan: s.tipoPlan || 'Sin Plan',
        }));

      }),
      catchError(() => of(MOCK_SOCIOS_ASISTENCIA))
    );
  }

  /**
   * Registra el ingreso de un socio al gimnasio.
   * Llama a POST /asistencias/registro en el backend con { id_socio, sucursal_id }.
   * El backend valida membresía activa y que el socio no esté moroso.
   */
  registrarEntrada(request: RegistrarAsistenciaRequest): Observable<AsistenciaRegistro> {
    const payload = {
      id_socio: request.idSocio,
      sucursal_id: request.idSucursal,
    };

    return this.http.post<any>(`${API.asistencias}/registro`, payload).pipe(
      map((res) => {
        const sucursalObj = MOCK_SUCURSALES.find((s) => s.idSucursal === request.idSucursal);
        const nueva: AsistenciaRegistro = {
          idAsistencia: res.idAsistencia ?? ++this.currentId,
          idSocio: request.idSocio,
          nombreSocio: res.socio?.usuario?.nombres ?? res.socio?.nombres ?? 'Socio',
          apellidoSocio: res.socio?.usuario?.apellidos ?? res.socio?.apellidos ?? '',
          sucursal: res.sucursalNombre ?? sucursalObj?.nombre ?? 'Sucursal Central',
          fecha: res.fecha ?? new Date().toISOString().split('T')[0],
          horaEntrada: res.horaEntrada ?? new Date().toTimeString().split(' ')[0],
          horaSalida: null,
          registradoPor: res.registradoPorNombre ?? 'Recepción',
        };
        return nueva;
      }),
      tap((nueva) => {
        const actualizadas = [nueva, ...this.asistencias];
        this.guardarEnStorage(actualizadas);
      }),
      catchError((error) => {
        // Manejar rechazo 400 del backend (ej: "El socio no cuenta con una membresía activa vigente" o moroso)
        if (error.status === 400 || error.status === 404 || error.status === 403) {
          const mensaje = error.error?.message || error.error?.error || 'Rechazado por el sistema de control.';
          return throwError(() => new Error(mensaje));
        }

        // Fallback local si backend no responde (status 0)
        if (error.status === 0) {
          const sucursal = MOCK_SUCURSALES.find((s) => s.idSucursal === request.idSucursal);
          const now = new Date();
          const nueva: AsistenciaRegistro = {
            idAsistencia: ++this.currentId,
            idSocio: request.idSocio,
            nombreSocio: 'Socio Local',
            apellidoSocio: '',
            sucursal: sucursal ? sucursal.nombre : 'Central',
            fecha: now.toISOString().split('T')[0],
            horaEntrada: now.toTimeString().split(' ')[0],
            horaSalida: null,
            registradoPor: 'Recepción',
          };
          const actualizadas = [nueva, ...this.asistencias];
          this.guardarEnStorage(actualizadas);
          return of(nueva);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Registra la hora de salida de una asistencia existente.
   */
  registrarSalida(idAsistencia: number): Observable<AsistenciaRegistro> {
    const registro = this.asistencias.find((a) => a.idAsistencia === idAsistencia);
    if (registro) {
      const now = new Date();
      registro.horaSalida = now.toTimeString().split(' ')[0];
      this.guardarEnStorage([...this.asistencias]);
      return of({ ...registro });
    }
    return throwError(() => new Error('Asistencia no encontrada.'));
  }

  /**
   * Consulta el historial de asistencias de un socio llamando a GET /asistencias/socio/{socioId}.
   */
  getAsistenciasPorSocio(socioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API.asistencias}/socio/${socioId}`).pipe(
      catchError((error) => {
        console.warn(`Error al consultar asistencias del socio ${socioId}:`, error);
        return of([]);
      })
    );
  }
}
