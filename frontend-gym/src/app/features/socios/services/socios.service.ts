import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, delay, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { EstadoSocio, SocioTablaDTO } from '../models/socio-tabla-dto.model';
import { MOCK_SOCIOS_TABLA } from '../mocks/socios-tabla.mock';
import { SocioPortalDTO } from '../models/socio-portal-dto.model';
import { MOCK_SOCIO_PORTAL } from '../mocks/socio-portal.mock';
import { API, STORAGE_KEYS } from '../../../core/constants/api.constants';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SociosService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  private readonly sociosSubject = new BehaviorSubject<SocioTablaDTO[]>(this.cargarSociosIniciales());
  readonly socios$ = this.sociosSubject.asObservable();

  constructor() {
    // Sincronizar con el backend al arrancar el servicio solo si existe token real
    if (this.tieneTokenReal()) {
      this.getSocios().subscribe({
        error: () => {},
      });
    }
  }

  private tieneTokenReal(): boolean {
    const sesion = this.storage.obtener<any>(STORAGE_KEYS.sesion);
    const token = sesion?.token;
    return !!(token && !token.startsWith('demo-') && token.includes('.'));
  }

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

  /**
   * Mapea un DTO de respuesta del Backend (Spring Boot 4 / MariaDB) a SocioTablaDTO del front.
   */
  private mapearBackendASocio(item: any): SocioTablaDTO {
    const id = item.id ?? item.idSocio ?? item.id_socio ?? 0;
    const usuarioObj = item.usuario || {};
    const dpi = usuarioObj.dpi ?? item.dpi ?? '';
    const nombre = usuarioObj.nombres ?? item.nombres ?? item.nombre ?? '';
    const apellido = usuarioObj.apellidos ?? item.apellidos ?? item.apellido ?? '';
    const correo = usuarioObj.correo ?? item.correo ?? '';
    const telefono = usuarioObj.telefono ?? item.telefono ?? '';
    const activo = usuarioObj.estado ?? item.estado ?? true;
    const fechaRegistro = item.fechaRegistro ?? item.socioInfo?.fecha_registro ?? new Date().toISOString().split('T')[0];

    const memb = item.membresiaActual;
    let estadoMembresia = 'Sin Membresía';
    let tipoPlan = 'Sin Membresía';
    let idPlan: number | undefined = undefined;
    let fechaInicio: string | undefined = undefined;
    let fechaVencimiento: string | undefined = undefined;

    if (memb) {
      estadoMembresia = memb.estado || (memb.activa ? 'Activa' : 'Vencida');
      tipoPlan = memb.plan || 'Plan Activo';
      idPlan = memb.idPlan;
      fechaInicio = memb.fechaInicio;
      fechaVencimiento = memb.fechaVencimiento;
    } else if (item.tipoPlan && item.tipoPlan !== 'Sin Plan Asignado') {
      estadoMembresia = item.estadoMembresia || 'Sin Membresía';
      tipoPlan = item.tipoPlan;
      idPlan = item.id_plan;
      fechaInicio = item.fechaInicioMembresia;
      fechaVencimiento = item.fechaVencimientoMembresia;
    }

    if (!idPlan && tipoPlan && tipoPlan !== 'Sin Membresía') {
      const lower = tipoPlan.toLowerCase();
      if (lower.includes('mensual')) idPlan = 1;
      else if (lower.includes('trimestral')) idPlan = 2;
      else if (lower.includes('semestral')) idPlan = 3;
      else if (lower.includes('anual')) idPlan = 4;
    }

    // Determinar estado: 'ACTIVO' | 'INACTIVO' | 'MOROSO'
    let estado: EstadoSocio = 'ACTIVO';
    const estStr = String(item.estado || usuarioObj.estado || '').toUpperCase();
    if (estStr === 'MOROSO' || estadoMembresia.toUpperCase().includes('VENCIDA')) {
      estado = 'MOROSO';
    } else if (estStr === 'INACTIVO' || activo === false) {
      estado = 'INACTIVO';
    } else {
      estado = 'ACTIVO';
    }

    return {
      id_socio: id,
      usuario: {
        id,
        dpi,
        nombre,
        apellido,
        correo,
        telefono,
        rol: 'CLIENTE',
        activo: estado !== 'INACTIVO',
        fecha_creacion: item.fechaRegistro || new Date().toISOString(),
        doble_autenticacion: false,
        username: correo ? correo.split('@')[0] : `socio${id}`,
      },
      socioInfo: {
        id_socio: id,
        fecha_registro: fechaRegistro,
      },
      entrenadoresAsignados: item.entrenadoresAsignados || [],
      clasesAsignadas: item.clasesAsignadas || [],
      ultimaMedicion: item.ultimaMedicion,
      estado,
      estadoMembresia,
      tipoPlan,
      id_plan: idPlan,
      fechaInicioMembresia: fechaInicio,
      fechaVencimientoMembresia: fechaVencimiento,
    };
  }

  /**
   * Obtiene la lista de socios desde el endpoint GET /socios?page=0&size=50 del backend
   * cruzando con GET /membresias?size=100 para poblar la membresía activa real de cada socio,
   * con fallback a almacenamiento local si el backend no responde o si está en modo demo.
   */
  getSocios(): Observable<SocioTablaDTO[]> {
    if (!this.tieneTokenReal()) {
      return of(this.sociosSubject.getValue());
    }

    const socios$ = this.http.get<any>(`${API.socios}?page=0&size=50`).pipe(
      catchError((err) => {
        console.warn('API /socios no disponible:', err);
        return of(null);
      })
    );

    const membresias$ = this.http.get<any>(`${API.membresias}?size=100`).pipe(
      catchError((err) => {
        console.warn('API /membresias no disponible:', err);
        return of(null);
      })
    );

    return forkJoin([socios$, membresias$]).pipe(
      map(([resSocios, resMembresias]) => {
        if (!resSocios) {
          return this.sociosSubject.getValue();
        }

        const listaRaw = Array.isArray(resSocios) ? resSocios : resSocios?.content || [];
        const membresiasRaw: any[] = Array.isArray(resMembresias)
          ? resMembresias
          : resMembresias?.content || [];

        // Mapa de membresías activas indexadas por socioId y usuarioId
        const membresiaPorSocio = new Map<number, any>();
        for (const m of membresiasRaw) {
          const socioId = m.socio?.id ?? m.socioId ?? m.idSocio;
          const usuarioId = m.socio?.usuario?.id;
          const esActiva = m.activa === true || m.estado?.nombre?.toUpperCase() === 'ACTIVA' || m.estado?.id === 1;
          if (socioId && (!membresiaPorSocio.has(socioId) || esActiva)) {
            membresiaPorSocio.set(socioId, m);
          }
          if (usuarioId && (!membresiaPorSocio.has(usuarioId) || esActiva)) {
            membresiaPorSocio.set(usuarioId, m);
          }
        }

        if (listaRaw.length > 0) {
          const mapeados = listaRaw.map((s: any) => {
            const dto = this.mapearBackendASocio(s);
            const m =
              membresiaPorSocio.get(dto.id_socio) ||
              (dto.usuario?.id ? membresiaPorSocio.get(dto.usuario.id) : undefined);
            if (m) {
              dto.tipoPlan = m.plan?.nombre || dto.tipoPlan;
              dto.id_plan = m.plan?.id || dto.id_plan;
              dto.estadoMembresia = m.estado?.nombre || (m.activa ? 'Activa' : 'Vencida');
              dto.fechaInicioMembresia = m.fechaInicio || dto.fechaInicioMembresia;
              dto.fechaVencimientoMembresia = m.fechaVencimiento || dto.fechaVencimientoMembresia;
              if (m.activa || dto.estadoMembresia.toUpperCase() === 'ACTIVA') {
                dto.estado = 'ACTIVO';
              }
            }
            if (!dto.id_plan && dto.tipoPlan && dto.tipoPlan !== 'Sin Membresía') {
              const lower = dto.tipoPlan.toLowerCase();
              if (lower.includes('mensual')) dto.id_plan = 1;
              else if (lower.includes('trimestral')) dto.id_plan = 2;
              else if (lower.includes('semestral')) dto.id_plan = 3;
              else if (lower.includes('anual')) dto.id_plan = 4;
            }
            return dto;
          });
          this.guardarEnStorage(mapeados);
          return mapeados;
        }

        return this.sociosSubject.getValue();
      }),
      catchError((err) => {
        console.warn('Error al sincronizar socios y membresías:', err);
        return of(this.sociosSubject.getValue());
      })
    );
  }

  getSocioById(id: number): Observable<SocioTablaDTO | undefined> {
    if (!this.tieneTokenReal()) {
      const local = this.sociosSubject.getValue().find((s) => s.id_socio === id);
      return of(local);
    }

    return this.http.get<any>(`${API.socios}/${id}`).pipe(
      map((res) => this.mapearBackendASocio(res)),
      catchError(() => {
        const local = this.sociosSubject.getValue().find((s) => s.id_socio === id);
        return of(local);
      })
    );
  }

  /**
   * Obtiene la información del socio autenticado para su portal personal
   * combinando GET /socios/me con GET /membresias/me/activa
   */
  getSocio(): Observable<SocioPortalDTO> {
    if (!this.tieneTokenReal()) {
      return of(MOCK_SOCIO_PORTAL);
    }

    const socioMe$ = this.http.get<any>(`${API.socios}/me`).pipe(
      catchError((err) => {
        console.warn('API /socios/me no disponible o no autorizado:', err?.status);
        return of(null);
      })
    );
    const membresiaMe$ = this.http.get<any>(`${API.membresias}/me/activa`).pipe(
      catchError((err) => {
        console.warn('API /membresias/me/activa no disponible o no autorizado:', err?.status);
        return of(null);
      })
    );

    return forkJoin([socioMe$, membresiaMe$]).pipe(
      map(([socioRaw, membRaw]) => {
        if (!socioRaw && !membRaw) {
          return MOCK_SOCIO_PORTAL;
        }

        const usuarioObj = socioRaw?.usuario || {};
        const memb = membRaw || socioRaw?.membresiaActual;
        const plan = membRaw?.plan || {};
        const ultimaAsis = socioRaw?.ultimaAsistencia;

        const asistenciasList = ultimaAsis
          ? [
              {
                idSocio: usuarioObj.id || socioRaw?.id || 1,
                idClase: 1,
                fecha: ultimaAsis.fecha,
                horaEntrada: ultimaAsis.horaEntrada || '08:00:00',
                horaSalida: ultimaAsis.horaSalida || null,
              },
            ]
          : MOCK_SOCIO_PORTAL.asistencias;

        const portalDto: SocioPortalDTO = {
          usuario: {
            id: usuarioObj.id || socioRaw?.id || 1,
            dpi: usuarioObj.dpi || '',
            nombre: usuarioObj.nombres || usuarioObj.nombre || 'Socio',
            apellido: usuarioObj.apellidos || usuarioObj.apellido || '',
            correo: usuarioObj.correo || '',
            telefono: usuarioObj.telefono || '',
            username: usuarioObj.username || '',
            rol: 'CLIENTE',
            activo: usuarioObj.activo ?? true,
            fecha_creacion: socioRaw?.fechaRegistro || new Date().toISOString(),
            doble_autenticacion: false,
          },
          entrenadoresAsignados: MOCK_SOCIO_PORTAL.entrenadoresAsignados,
          clasesAsignadas: MOCK_SOCIO_PORTAL.clasesAsignadas,
          medicion: MOCK_SOCIO_PORTAL.medicion,
          membresia: {
            idMembresia: memb?.id || memb?.idMembresia || 1,
            tipo: plan.nombre || memb?.plan || 'Plan Activo',
            duracionDias: plan.duracion || 30,
            precio: plan.precio != null ? Number(plan.precio) : 250.0,
            descripcion: plan.descripcion || 'Acceso completo a las instalaciones.',
            beneficios: ['Pesas y máquinas', 'Cardio libre', 'Control digital de accesos'],
            fechaInicio: memb?.fechaInicio || new Date().toISOString().split('T')[0],
            fechaVencimiento: memb?.fechaVencimiento || '',
            estado: memb?.estado?.nombre || memb?.estado || (memb?.activa ? 'ACTIVA' : 'INACTIVA'),
            descripcionEstado: memb?.activa ? 'Membresía activa y al día' : 'Membresía no activa',
          },
          asistencias: asistenciasList,
        };

        return portalDto;
      }),
      catchError(() => of(MOCK_SOCIO_PORTAL))
    );
  }

  /**
   * Registra un nuevo socio mediante POST /socios
   */
  crearSocio(datos: {
    dpi: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    estado?: EstadoSocio;
    direccion?: string;
    fechaNacimiento?: string;
  }): Observable<SocioTablaDTO> {
    if (!this.tieneTokenReal()) {
      return this.crearSocioLocal(datos);
    }

    const payload = {
      dpi: datos.dpi.trim(),
      nombres: datos.nombre.trim(),
      apellidos: datos.apellido.trim(),
      correo: datos.correo.trim().toLowerCase(),
      telefono: datos.telefono?.trim() || '55551234',
      direccion: datos.direccion?.trim() || 'Ciudad',
      fechaNacimiento: datos.fechaNacimiento || '2000-01-01',
      sucursalId: 1,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    return this.http.post<any>(API.socios, payload).pipe(
      map((res) => {
        const nuevoSocio = this.mapearBackendASocio(res);
        if (datos.estado) {
          nuevoSocio.estado = datos.estado;
        }
        const sociosActuales = this.sociosSubject.getValue().filter((s) => s.id_socio !== nuevoSocio.id_socio);
        this.guardarEnStorage([nuevoSocio, ...sociosActuales]);
        return nuevoSocio;
      }),
      catchError((err) => {
        const msg = err.message || err.backendError?.message || err.error?.message || 'Datos de entrada inválidos o DPI/Correo ya registrado.';
        if (err.status === 0) {
          console.warn('Backend /socios no disponible (status 0), creando localmente:', err);
          return this.crearSocioLocal(datos);
        }
        return throwError(() => new Error(msg));
      })
    );
  }

  private crearSocioLocal(datos: {
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

    this.guardarEnStorage([nuevoSocio, ...socios]);
    return of(nuevoSocio).pipe(delay(200));
  }

  /**
   * Actualiza datos de un socio mediante PUT /socios/{id}
   */
  actualizarSocio(
    id: number,
    datos: {
      dpi?: string;
      nombre?: string;
      apellido?: string;
      correo?: string;
      telefono?: string;
      estado?: EstadoSocio;
      direccion?: string;
      fechaNacimiento?: string;
    }
  ): Observable<SocioTablaDTO> {
    if (!this.tieneTokenReal()) {
      return this.actualizarSocioLocal(id, datos);
    }

    const socioActual = this.sociosSubject.getValue().find((s) => s.id_socio === id);
    const payload = {
      dpi: datos.dpi?.trim() ?? socioActual?.usuario.dpi ?? '',
      nombres: datos.nombre?.trim() ?? socioActual?.usuario.nombre ?? '',
      apellidos: datos.apellido?.trim() ?? socioActual?.usuario.apellido ?? '',
      telefono: datos.telefono?.trim() ?? socioActual?.usuario.telefono ?? '',
      correo: datos.correo?.trim().toLowerCase() ?? socioActual?.usuario.correo ?? '',
      direccion: datos.direccion?.trim() || 'Ciudad',
      fechaNacimiento: datos.fechaNacimiento || '2000-01-01',
      sucursalId: 1,
      estado: datos.estado !== 'INACTIVO',
    };

    return this.http.put<any>(`${API.socios}/${id}`, payload).pipe(
      map((res) => {
        const actualizado = this.mapearBackendASocio(res);
        if (datos.estado) {
          actualizado.estado = datos.estado;
        }
        this.actualizarEnListaLocal(id, actualizado);
        return actualizado;
      }),
      catchError((err) => {
        const msg = err.message || err.backendError?.message || err.error?.message || 'Error al actualizar el socio en el servidor.';
        if (err.status === 0) {
          console.warn('Backend no disponible para actualizar (status 0), actualizando localmente:', err);
          return this.actualizarSocioLocal(id, datos);
        }
        return throwError(() => new Error(msg));
      })
    );
  }

  private actualizarEnListaLocal(id: number, actualizado: SocioTablaDTO): void {
    const socios = this.sociosSubject.getValue();
    const indice = socios.findIndex((s) => s.id_socio === id);
    if (indice !== -1) {
      const nuevaLista = [...socios];
      nuevaLista[indice] = {
        ...actualizado,
        // Conservar valores de membresía si la respuesta no los trajo completos
        tipoPlan: actualizado.tipoPlan !== 'Sin Membresía' ? actualizado.tipoPlan : socios[indice].tipoPlan,
        estadoMembresia: actualizado.estadoMembresia !== 'Sin Membresía' ? actualizado.estadoMembresia : socios[indice].estadoMembresia,
        fechaVencimientoMembresia: actualizado.fechaVencimientoMembresia || socios[indice].fechaVencimientoMembresia,
      };
      this.guardarEnStorage(nuevaLista);
    }
  }

  private actualizarSocioLocal(
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
    return of(actualizado).pipe(delay(200));
  }

  cambiarEstado(id: number, nuevoEstado: EstadoSocio): Observable<SocioTablaDTO> {
    return this.actualizarSocio(id, { estado: nuevoEstado });
  }

  /**
   * Elimina/Desactiva un socio mediante DELETE /socios/{id}
   */
  eliminarSocio(id: number): Observable<boolean> {
    if (!this.tieneTokenReal()) {
      const filtrados = this.sociosSubject.getValue().filter((s) => s.id_socio !== id);
      this.guardarEnStorage(filtrados);
      return of(true).pipe(delay(200));
    }

    return this.http.delete<void>(`${API.socios}/${id}`).pipe(
      map(() => {
        const filtrados = this.sociosSubject.getValue().filter((s) => s.id_socio !== id);
        this.guardarEnStorage(filtrados);
        return true;
      }),
      catchError((err) => {
        const msg = err.message || err.backendError?.message || err.error?.message || 'Error al eliminar el socio en el servidor.';
        if (err.status === 0) {
          console.warn('Backend no disponible para eliminar (status 0), eliminando localmente:', err);
          const filtrados = this.sociosSubject.getValue().filter((s) => s.id_socio !== id);
          this.guardarEnStorage(filtrados);
          return of(true).pipe(delay(200));
        }
        return throwError(() => new Error(msg));
      })
    );
  }

  /**
   * Asigna un plan a un socio mediante POST /membresias
   * Payload: { idSocio, idPlan, sucursalIds: [1], fechaInicio, idEstadoMembresia: 1 }
   */
  asignarPlan(
    socioId: number,
    planNombre: string,
    planId: number,
    fechaInicio: string,
    fechaVencimiento: string
  ): Observable<SocioTablaDTO> {
    if (!this.tieneTokenReal()) {
      const actualizado = this.actualizarPlanEnLocal(socioId, planNombre, planId, fechaInicio, fechaVencimiento);
      return of(actualizado);
    }

    const payload = {
      idSocio: socioId,
      idPlan: planId,
      sucursalIds: [1],
      fechaInicio: fechaInicio,
      idEstadoMembresia: 1,
    };

    return this.http.post<any>(API.membresias, payload).pipe(
      tap(() => {
        // Re-sincronizar con el backend tras asignación exitosa
        this.getSocios().subscribe({ error: () => {} });
      }),
      map((res) => {
        const vencimientoReal = res?.fechaVencimiento || fechaVencimiento;
        return this.actualizarPlanEnLocal(socioId, planNombre, planId, fechaInicio, vencimientoReal);
      }),
      catchError((err) => {
        const mensaje = err.message || err.backendError?.message || err.error?.message || 'Error al asignar la membresía.';
        if (err.status === 0) {
          // Solo si status === 0 (backend apagado / sin conexión)
          console.warn('Backend /membresias no disponible (status 0), asignando en modo local:', err);
          const actualizado = this.actualizarPlanEnLocal(socioId, planNombre, planId, fechaInicio, fechaVencimiento);
          return of(actualizado);
        }
        // Si el backend respondió con cualquier código HTTP (400, 401, 403, 409, 500, etc.)
        return throwError(() => new Error(mensaje));
      })
    );
  }

  private actualizarPlanEnLocal(
    socioId: number,
    planNombre: string,
    planId: number,
    fechaInicio: string,
    fechaVencimiento: string
  ): SocioTablaDTO {
    const socios = this.sociosSubject.getValue();
    const indice = socios.findIndex((s) => s.id_socio === socioId);
    if (indice === -1) {
      throw new Error('Socio no encontrado.');
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
    return actualizado;
  }
}
