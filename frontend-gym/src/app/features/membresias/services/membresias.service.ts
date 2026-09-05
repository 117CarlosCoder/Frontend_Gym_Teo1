import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuditoriaMembresia, EstadoMembresia, ESTADOS_MEMBRESIA, Membresia, MembresiaBackendRequest, MembresiaFormulario, PlanMembresia } from '../models/membresia.model';
import { MOCK_AUDITORIA_MEMBRESIAS, MOCK_MEMBRESIAS, MOCK_PLANES, MOCK_SUCURSALES_MEMBRESIA } from '../mocks/membresias.mock';
import { Sucursal } from '../../../core/models/sucursal.model';

const MEMBERSHIPS_KEY = 'gym.membresias';
const AUDIT_KEY = 'gym.auditoria.membresias';
const BRANCHES_KEY = 'gym.sucursales';

@Injectable({ providedIn: 'root' })
export class MembresiasService {
  private readonly storage = inject(StorageService);
  private readonly auth = inject(AuthService);

  getMembresias(): Observable<Membresia[]> {
    return of(this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS)).pipe(delay(250));
  }

  getPlanes(): Observable<PlanMembresia[]> {
    return of(MOCK_PLANES.filter((plan) => plan.activo)).pipe(delay(150));
  }

  getEstados(): Observable<typeof ESTADOS_MEMBRESIA> {
    return of(ESTADOS_MEMBRESIA.filter((estado) => estado.nombre !== 'VENCIDA')).pipe(delay(150));
  }

  getSucursales(): Observable<Sucursal[]> {
    return of(this.read(BRANCHES_KEY, MOCK_SUCURSALES_MEMBRESIA)).pipe(delay(150));
  }

  getAuditoria(): Observable<AuditoriaMembresia[]> {
    return of(this.read(AUDIT_KEY, MOCK_AUDITORIA_MEMBRESIAS)).pipe(delay(150));
  }

  crear(formulario: MembresiaFormulario, planes: PlanMembresia[]): Observable<Membresia> {
    const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
    const plan = planes.find((item) => item.idPlan === formulario.idPlan);
    const estado = this.estadoPorId(formulario.idEstado);
    if (!plan || !formulario.idSocio || !estado || !['ACTIVA', 'CONGELADA'].includes(estado.nombre)) {
      throw new Error('Socio, plan y un estado válido para una nueva membresía son obligatorios.');
    }

    const ahora = new Date().toISOString();
    const usuario = this.auth.usuario();
    const fechaFin = this.calcularFechaFin(formulario.fechaInicio, plan.duracionMeses);
    const payload = this.prepararPayload(formulario, fechaFin);
    const nueva: Membresia = {
      idMembresia: this.nextId(membresias), idSocio: formulario.idSocio, nombreSocio: formulario.nombreSocio,
      plan, fechaInicio: payload.fechaInicio, fechaFin: payload.fechaFin, precio: plan.precio,
      estado: estado.nombre, descripcionEstado: estado.descripcion,
      motivoCancelacion: formulario.motivoCancelacion || undefined, eliminado: false,
      creadoPor: usuario?.id ?? 0, creadoEn: ahora,
    };
    this.write(MEMBERSHIPS_KEY, [...membresias, nueva]);
    this.audit('CREADA', nueva, `Membresía ${nueva.plan.tipo} creada.`);
    return of(nueva).pipe(delay(250));
  }

  actualizar(id: number, formulario: MembresiaFormulario, planes: PlanMembresia[]): Observable<Membresia> {
    const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
    const actual = membresias.find((item) => item.idMembresia === id && !item.eliminado);
    const plan = planes.find((item) => item.idPlan === formulario.idPlan);
    const estado = this.estadoPorId(formulario.idEstado);
    if (!actual || !plan || !estado || estado.nombre === 'VENCIDA') throw new Error('Membresía o datos de actualización inválidos.');
    const usuario = this.auth.usuario();
    const fechaFin = this.calcularFechaFin(formulario.fechaInicio, plan.duracionMeses);
    const payload = this.prepararPayload(formulario, fechaFin);
    const actualizado: Membresia = {
      ...actual, plan, fechaInicio: payload.fechaInicio, fechaFin: payload.fechaFin, precio: plan.precio,
      estado: estado.nombre, descripcionEstado: estado.descripcion,
      motivoCancelacion: formulario.motivoCancelacion || undefined, actualizadoPor: usuario?.id ?? 0, actualizadoEn: new Date().toISOString(),
    };
    this.write(MEMBERSHIPS_KEY, membresias.map((item) => item.idMembresia === id ? actualizado : item));
    this.auditarCambios(actual, actualizado);
    return of(actualizado).pipe(delay(250));
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
    if (!actual) throw new Error('Sucursal no encontrada.');
    const actualizada = { ...actual, activa };
    this.write(BRANCHES_KEY, sucursales.map((item) => item.idSucursal === idSucursal ? actualizada : item));
    this.audit(activa ? 'SUCURSAL_REACTIVADA' : 'SUCURSAL_DESACTIVADA', undefined,
      `Sucursal ${actual.nombre} ${activa ? 'reactivada' : 'desactivada'}.`, `${actual.activa ? 'activa' : 'inactiva'}`, `${activa ? 'activa' : 'inactiva'}`);
    return of(actualizada).pipe(delay(200));
  }

  private auditarCambios(anterior: Membresia, actualizada: Membresia): void {
    if (anterior.plan.idPlan !== actualizada.plan.idPlan) {
      this.audit('PLAN_CAMBIADO', actualizada, 'Plan de membresía actualizado.', anterior.plan.tipo, actualizada.plan.tipo);
    }
    if (anterior.fechaInicio !== actualizada.fechaInicio || anterior.fechaFin !== actualizada.fechaFin) {
      this.audit('FECHAS_CAMBIADAS', actualizada, 'Fechas de membresía actualizadas.',
        `${anterior.fechaInicio} al ${anterior.fechaFin}`, `${actualizada.fechaInicio} al ${actualizada.fechaFin}`);
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

  private audit(accion: AuditoriaMembresia['accion'], membresia: Membresia | undefined, detalle: string, valorAnterior?: string, valorNuevo?: string): void {
    const usuario = this.auth.usuario();
    const auditoria = this.read(AUDIT_KEY, MOCK_AUDITORIA_MEMBRESIAS);
    this.write(AUDIT_KEY, [...auditoria, {
      idAuditoria: this.nextId(auditoria), accion, idMembresia: membresia?.idMembresia, idSocio: membresia?.idSocio,
      nombreSocio: membresia?.nombreSocio, idUsuario: usuario?.id ?? 0,
      nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Sistema', fecha: new Date().toISOString(), detalle,
      valorAnterior, valorNuevo,
    }]);
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