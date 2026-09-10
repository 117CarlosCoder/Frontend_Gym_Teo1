import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, delay, of, throwError } from 'rxjs';
import { EstadoSocio, SocioTablaDTO } from '../models/socio-tabla-dto.model';
import { MOCK_SOCIOS_TABLA } from '../mocks/socios-tabla.mock';
import { SocioPortalDTO } from '../models/socio-portal-dto.model';
import { MOCK_SOCIO_PORTAL } from '../mocks/socio-portal.mock';
import { STORAGE_KEYS } from '../../../core/constants/api.constants';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SociosService {
  private readonly storage = inject(StorageService);

  private readonly sociosSubject = new BehaviorSubject<SocioTablaDTO[]>(this.cargarSociosIniciales());
  readonly socios$ = this.sociosSubject.asObservable();

  private cargarSociosIniciales(): SocioTablaDTO[] {
    const guardados = this.storage.obtener<SocioTablaDTO[]>(STORAGE_KEYS.socios);
    if (guardados && Array.isArray(guardados) && guardados.length > 0) {
      return guardados;
    }
    this.storage.guardar(STORAGE_KEYS.socios, MOCK_SOCIOS_TABLA);
    return [...MOCK_SOCIOS_TABLA];
  }

  private guardarEnStorage(socios: SocioTablaDTO[]): void {
    this.storage.guardar(STORAGE_KEYS.socios, socios);
    this.sociosSubject.next(socios);
  }

  getSocios(): Observable<SocioTablaDTO[]> {
    return of(this.sociosSubject.getValue()).pipe(delay(200));
  }

  getSocioById(id: number): Observable<SocioTablaDTO | undefined> {
    const socio = this.sociosSubject.getValue().find((s) => s.id_socio === id);
    return of(socio).pipe(delay(100));
  }

  getSocio(): Observable<SocioPortalDTO> {
    return of(MOCK_SOCIO_PORTAL).pipe(delay(200));
  }

  crearSocio(datos: {
    dpi: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    estado?: EstadoSocio;
  }): Observable<SocioTablaDTO> {
    const socios = this.sociosSubject.getValue();
    const existeCorreo = socios.some(
      (s) => s.usuario.correo.toLowerCase() === datos.correo.toLowerCase().trim()
    );
    if (existeCorreo) {
      return throwError(() => new Error('Ya existe un socio con este correo electrónico.'));
    }

    const maxId = socios.reduce((max, s) => Math.max(max, s.id_socio), 0);
    const nuevoId = maxId + 1;
    const ahora = new Date().toISOString();

    const nuevoSocio: SocioTablaDTO = {
      id_socio: nuevoId,
      usuario: {
        id: nuevoId,
        dpi: datos.dpi.trim(),
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim().toLowerCase(),
        telefono: datos.telefono.trim(),
        rol: 'CLIENTE',
        activo: datos.estado !== 'INACTIVO',
        fecha_creacion: ahora,
        doble_autenticacion: false,
        username: datos.correo.split('@')[0],
      },
      socioInfo: {
        id_socio: nuevoId,
        fecha_registro: ahora.split('T')[0],
      },
      entrenadoresAsignados: [],
      clasesAsignadas: [],
      estado: datos.estado || 'ACTIVO',
      estadoMembresia: 'Sin Membresía',
      tipoPlan: 'Sin Plan Asignado',
    };

    const nuevaLista = [nuevoSocio, ...socios];
    this.guardarEnStorage(nuevaLista);
    return of(nuevoSocio).pipe(delay(300));
  }

  actualizarSocio(
    id: number,
    datos: {
      dpi?: string;
      nombre?: string;
      apellido?: string;
      correo?: string;
      telefono?: string;
      estado?: EstadoSocio;
    }
  ): Observable<SocioTablaDTO> {
    const socios = this.sociosSubject.getValue();
    const indice = socios.findIndex((s) => s.id_socio === id);
    if (indice === -1) {
      return throwError(() => new Error('Socio no encontrado.'));
    }

    const actual = socios[indice];
    const actualizado: SocioTablaDTO = {
      ...actual,
      usuario: {
        ...actual.usuario,
        dpi: datos.dpi !== undefined ? datos.dpi.trim() : actual.usuario.dpi,
        nombre: datos.nombre !== undefined ? datos.nombre.trim() : actual.usuario.nombre,
        apellido: datos.apellido !== undefined ? datos.apellido.trim() : actual.usuario.apellido,
        correo: datos.correo !== undefined ? datos.correo.trim().toLowerCase() : actual.usuario.correo,
        telefono: datos.telefono !== undefined ? datos.telefono.trim() : actual.usuario.telefono,
        activo: datos.estado !== undefined ? datos.estado !== 'INACTIVO' : actual.usuario.activo,
      },
      estado: datos.estado !== undefined ? datos.estado : actual.estado,
    };

    const nuevaLista = [...socios];
    nuevaLista[indice] = actualizado;
    this.guardarEnStorage(nuevaLista);
    return of(actualizado).pipe(delay(300));
  }

  cambiarEstado(id: number, nuevoEstado: EstadoSocio): Observable<SocioTablaDTO> {
    return this.actualizarSocio(id, { estado: nuevoEstado });
  }

  eliminarSocio(id: number): Observable<boolean> {
    const socios = this.sociosSubject.getValue();
    const filtrados = socios.filter((s) => s.id_socio !== id);
    if (filtrados.length === socios.length) {
      return throwError(() => new Error('Socio no encontrado para eliminar.'));
    }
    this.guardarEnStorage(filtrados);
    return of(true).pipe(delay(250));
  }

  asignarPlan(
    socioId: number,
    planNombre: string,
    planId: number,
    fechaInicio: string,
    fechaVencimiento: string
  ): Observable<SocioTablaDTO> {
    const socios = this.sociosSubject.getValue();
    const indice = socios.findIndex((s) => s.id_socio === socioId);
    if (indice === -1) {
      return throwError(() => new Error('Socio no encontrado.'));
    }

    const actual = socios[indice];
    const actualizado: SocioTablaDTO = {
      ...actual,
      estado: 'ACTIVO',
      estadoMembresia: 'Activa',
      tipoPlan: planNombre,
      id_plan: planId,
      fechaInicioMembresia: fechaInicio,
      fechaVencimientoMembresia: fechaVencimiento,
      usuario: {
        ...actual.usuario,
        activo: true,
      },
    };

    const nuevaLista = [...socios];
    nuevaLista[indice] = actualizado;
    this.guardarEnStorage(nuevaLista);
    return of(actualizado).pipe(delay(300));
  }
}

