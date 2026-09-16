import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import {
  AuditoriaMembresia,
  EstadoMembresia,
  ESTADOS_MEMBRESIA,
  Membresia,
  MembresiaBackendRequest,
  MembresiaFormulario,
  PlanMembresia,
} from '../models/membresia.model';
import {
  MOCK_AUDITORIA_MEMBRESIAS,
  MOCK_MEMBRESIAS,
  MOCK_PLANES,
  MOCK_SUCURSALES_MEMBRESIA,
} from '../mocks/membresias.mock';
import { Sucursal } from '../../../core/models/sucursal.model';
import { API } from '../../../core/constants/api.constants';

const MEMBERSHIPS_KEY = 'gym.membresias';
const AUDIT_KEY = 'gym.auditoria.membresias';
const BRANCHES_KEY = 'gym.sucursales';

@Injectable({ providedIn: 'root' })
export class MembresiasService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);

  getMembresias(): Observable<Membresia[]> {
    return this.http.get<any>(`${API.membresias}?size=100`).pipe(
      map((res) => {
        const items = Array.isArray(res) ? res : res?.content || [];
        if (items.length === 0) {
          return this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
        }
        return items.map((dto: any) => this.mapearDtoAMembresia(dto));
      }),
      catchError(() => of(this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS)))
    );
  }

  getPlanes(): Observable<PlanMembresia[]> {
    return this.http.get<any[]>(API.planes).pipe(
      map((planes) => {
        if (Array.isArray(planes) && planes.length > 0) {
          return planes.map((p) => ({
            idPlan: p.id ?? p.id_plan,
            tipo: p.nombre,
            duracionMeses: Math.max(1, Math.round((p.duracion || 30) / 30)),
            precio: Number(p.precio),
            descripcion: p.descripcion || '',
            beneficios: p.beneficios && p.beneficios.length > 0 ? p.beneficios : ['Pesas y máquinas', 'Cardio libre'],
            activo: true,
          }));
        }
        return MOCK_PLANES.filter((plan) => plan.activo);
      }),

      catchError(() => of(MOCK_PLANES.filter((plan) => plan.activo)))
    );
  }

  getEstados(): Observable<typeof ESTADOS_MEMBRESIA> {
    return of(ESTADOS_MEMBRESIA.filter((estado) => estado.nombre !== 'VENCIDA')).pipe(delay(100));
  }

  getSucursales(): Observable<Sucursal[]> {
    return of(this.read(BRANCHES_KEY, MOCK_SUCURSALES_MEMBRESIA)).pipe(delay(100));
  }

  getAuditoria(): Observable<AuditoriaMembresia[]> {
    return of(this.read(AUDIT_KEY, MOCK_AUDITORIA_MEMBRESIAS)).pipe(delay(100));
  }

  crear(formulario: MembresiaFormulario, planes: PlanMembresia[]): Observable<Membresia> {
    const plan = planes.find((item) => item.idPlan === formulario.idPlan);
    const estado = this.estadoPorId(formulario.idEstado);
    if (!plan || !formulario.idSocio || !estado || !['ACTIVA', 'CONGELADA'].includes(estado.nombre)) {
      return throwError(() => new Error('Socio, plan y un estado válido para una nueva membresía son obligatorios.'));
    }

    const payloadBackend = {
      idSocio: formulario.idSocio,
      idPlan: formulario.idPlan,
      fechaInicio: formulario.fechaInicio,
      sucursalIds: [1],
      idEstadoMembresia: formulario.idEstado,
    };

    return this.http.post<any>(API.membresias, payloadBackend).pipe(
      map((res) => this.mapearDtoAMembresia(res)),
      tap((nueva) => {
        const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
        this.write(MEMBERSHIPS_KEY, [...membresias, nueva]);
        this.audit('CREADA', nueva, `Membresía ${nueva.plan.tipo} creada en backend.`);
      }),
      catchError((error) => {
        if (error.status === 400 || error.status === 409) {
          return throwError(() => new Error(error.error?.message || 'El socio ya cuenta con una membresía activa vigente.'));
        }
        // Fallback local
        const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
        const ahora = new Date().toISOString();
        const usuario = this.auth.usuario();
        const fechaFin = this.calcularFechaFin(formulario.fechaInicio, plan.duracionMeses);
        const payload = this.prepararPayload(formulario, fechaFin);
        const nueva: Membresia = {
          idMembresia: this.nextId(membresias),
          idSocio: formulario.idSocio,
          nombreSocio: formulario.nombreSocio,
          plan,
          fechaInicio: payload.fechaInicio,
          fechaFin: payload.fechaFin,
          precio: plan.precio,
          estado: estado.nombre,
          descripcionEstado: estado.descripcion,
          motivoCancelacion: formulario.motivoCancelacion || undefined,
          eliminado: false,
          creadoPor: usuario?.id ?? 0,
          creadoEn: ahora,
        };
        this.write(MEMBERSHIPS_KEY, [...membresias, nueva]);
        this.audit('CREADA', nueva, `Membresía ${nueva.plan.tipo} creada.`);
        return of(nueva);
      })
    );
  }

  actualizar(id: number, formulario: MembresiaFormulario, planes: PlanMembresia[]): Observable<Membresia> {
    const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
    const actual = membresias.find((item) => item.idMembresia === id && !item.eliminado);
    const plan = planes.find((item) => item.idPlan === formulario.idPlan);
    const estado = this.estadoPorId(formulario.idEstado);
    if (!actual || !plan || !estado || estado.nombre === 'VENCIDA') {
      return throwError(() => new Error('Membresía o datos de actualización inválidos.'));
    }

    const usuario = this.auth.usuario();
    const fechaFin = this.calcularFechaFin(formulario.fechaInicio, plan.duracionMeses);
    const payload = this.prepararPayload(formulario, fechaFin);
    const actualizado: Membresia = {
      ...actual,
      plan,
      fechaInicio: payload.fechaInicio,
      fechaFin: payload.fechaFin,
      precio: plan.precio,
      estado: estado.nombre,
      descripcionEstado: estado.descripcion,
      motivoCancelacion: formulario.motivoCancelacion || undefined,
      actualizadoPor: usuario?.id ?? 0,
      actualizadoEn: new Date().toISOString(),
    };
    this.write(MEMBERSHIPS_KEY, membresias.map((item) => (item.idMembresia === id ? actualizado : item)));
    this.auditarCambios(actual, actualizado);
    return of(actualizado);
  }

  /**
   * Cancela una membresía en el backend (POST /membresias/{id}/cancelar).
   */
  cancelarMembresia(
    id: number,
    datos: { motivo: string; comentarios?: string; reembolso?: boolean; montoReembolso?: number }
  ): Observable<any> {
    return this.http.post<any>(`${API.membresias}/${id}/cancelar`, datos).pipe(
      tap(() => {
        const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
        const actualizadas = membresias.map((m) =>
          m.idMembresia === id ? { ...m, estado: 'CANCELADA' as EstadoMembresia, motivoCancelacion: datos.motivo } : m
        );
        this.write(MEMBERSHIPS_KEY, actualizadas);
      }),
      catchError((error) => {
        return throwError(() => new Error(error.error?.message || 'Error al cancelar la membresía.'));
      })
    );
  }

  /**
   * Obtiene el historial de membresías de un socio llamando a GET /membresias/socio/{socioId}.
   */
  getHistorialPorSocio(socioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API.membresias}/socio/${socioId}`).pipe(
      catchError((error) => {
        console.warn(`Error al consultar historial de membresías para socio ${socioId}:`, error);
        return of([]);
      })
    );
  }

  desactivarSucursal(idSucursal: number): Observable<Sucursal> {
    return this.cambiarEstadoSucursal(idSucursal, false);
  }

  reactivarSucursal(idSucursal: number): Observable<Sucursal> {
    return this.cambiarEstadoSucursal(idSucursal, true);
  }

  private cambiarEstadoSucursal(idSucursal: number, activa: boolean): Observable<Sucursal> {
    const sucursales = this.read(BRANCHES_KEY, MOCK_SUCURSALES_MEMBRESIA);
    const actual = sucursales.find((item) => item.idSucursal === idSucursal);
    if (!actual) return throwError(() => new Error('Sucursal no encontrada.'));
    const actualizada = { ...actual, activa };
    this.write(
      BRANCHES_KEY,
      sucursales.map((item) => (item.idSucursal === idSucursal ? actualizada : item))
    );
    this.audit(
      activa ? 'SUCURSAL_REACTIVADA' : 'SUCURSAL_DESACTIVADA',
      undefined,
      `Sucursal ${actual.nombre} ${activa ? 'reactivada' : 'desactivada'}.`,
      `${actual.activa ? 'activa' : 'inactiva'}`,
      `${activa ? 'activa' : 'inactiva'}`
    );
    return of(actualizada).pipe(delay(100));
  }

  private mapearDtoAMembresia(dto: any): Membresia {
    const planDto = dto.plan || {};
    const socioDto = dto.socio || {};
    const usuarioDto = socioDto.usuario || {};
    const estadoNombre = (dto.estado?.nombre || dto.estado || (dto.activa ? 'ACTIVA' : 'CANCELADA')).toUpperCase();

    return {
      idMembresia: dto.id ?? dto.idMembresia,
      idSocio: socioDto.id ?? dto.idSocio ?? 0,
      nombreSocio: `${usuarioDto.nombres ?? socioDto.nombres ?? ''} ${usuarioDto.apellidos ?? socioDto.apellidos ?? ''}`.trim() || 'Socio',
      plan: {
        idPlan: planDto.id ?? 1,
        tipo: planDto.nombre ?? 'Plan Estándar',
        duracionMeses: Math.max(1, Math.round((planDto.duracion || 30) / 30)),
        precio: Number(planDto.precio ?? 0),
        descripcion: planDto.descripcion ?? '',
        beneficios: planDto.beneficios && planDto.beneficios.length > 0 ? planDto.beneficios : ['Acceso general', 'Pesas y máquinas'],
        activo: true,
      },

      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaVencimiento ?? dto.fechaFin,
      precio: Number(planDto.precio ?? dto.precio ?? 0),
      estado: estadoNombre === 'ACTIVA' ? 'ACTIVA' : estadoNombre === 'CANCELADA' ? 'CANCELADA' : 'CONGELADA',
      descripcionEstado: dto.estado?.descripcion ?? '',
      motivoCancelacion: dto.motivoCancelacion,
      eliminado: false,
      creadoPor: 1,
      creadoEn: dto.fechaInicio,
    };
  }

  private auditarCambios(anterior: Membresia, actualizada: Membresia): void {
    if (anterior.plan.idPlan !== actualizada.plan.idPlan) {
      this.audit('PLAN_CAMBIADO', actualizada, 'Plan de membresía actualizado.', anterior.plan.tipo, actualizada.plan.tipo);
    }
    if (anterior.fechaInicio !== actualizada.fechaInicio || anterior.fechaFin !== actualizada.fechaFin) {
      this.audit(
        'FECHAS_CAMBIADAS',
        actualizada,
        'Fechas de membresía actualizadas.',
        `${anterior.fechaInicio} al ${anterior.fechaFin}`,
        `${actualizada.fechaInicio} al ${actualizada.fechaFin}`
      );
    }
    if (anterior.estado !== actualizada.estado) {
      this.audit(this.accionParaEstado(actualizada.estado), actualizada, 'Estado de membresía actualizado.', anterior.estado, actualizada.estado);
    }
  }

  prepararPayload(formulario: MembresiaFormulario, fechaFin = formulario.fechaFin): MembresiaBackendRequest {
    return {
      idSocio: formulario.idSocio,
      idPlan: formulario.idPlan,
      idEstado: formulario.idEstado,
      fechaInicio: formulario.fechaInicio,
      fechaFin,
    };
  }

  private estadoPorId(idEstado: number) {
    return ESTADOS_MEMBRESIA.find((estado) => estado.idEstado === Number(idEstado));
  }

  private accionParaEstado(estado: EstadoMembresia): AuditoriaMembresia['accion'] {
    if (estado === 'CANCELADA') return 'CANCELADA';
    if (estado === 'CONGELADA') return 'CONGELADA';
    if (estado === 'ACTIVA') return 'REACTIVADA';
    return 'ESTADO_CAMBIADO';
  }

  private calcularFechaFin(fechaInicio: string, duracionMeses: number): string {
    const fechaFin = new Date(`${fechaInicio}T00:00:00`);
    fechaFin.setMonth(fechaFin.getMonth() + duracionMeses);
    fechaFin.setDate(fechaFin.getDate() - 1);
    return fechaFin.toISOString().slice(0, 10);
  }

  private audit(
    accion: AuditoriaMembresia['accion'],
    membresia: Membresia | undefined,
    detalle: string,
    valorAnterior?: string,
    valorNuevo?: string
  ): void {
    const usuario = this.auth.usuario();
    const auditoria = this.read(AUDIT_KEY, MOCK_AUDITORIA_MEMBRESIAS);
    this.write(AUDIT_KEY, [
      ...auditoria,
      {
        idAuditoria: this.nextId(auditoria),
        accion,
        idMembresia: membresia?.idMembresia,
        idSocio: membresia?.idSocio,
        nombreSocio: membresia?.nombreSocio,
        idUsuario: usuario?.id ?? 0,
        nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Sistema',
        fecha: new Date().toISOString(),
        detalle,
        valorAnterior,
        valorNuevo,
      },
    ]);
  }

  private nextId(items: Array<{ idMembresia?: number; idAuditoria?: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.idMembresia ?? item.idAuditoria ?? 0), 0) + 1;
  }

  private read<T>(key: string, fallback: T): T {
    return this.storage.obtener<T>(key) ?? fallback;
  }

  private write<T>(key: string, value: T): void {
    this.storage.guardar(key, value);
  }
}