import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuditoriaMembresia, EstadoMembresia, Membresia, MembresiaFormulario, PlanMembresia } from '../models/membresia.model';
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

  getSucursales(): Observable<Sucursal[]> {
    return of(this.read(BRANCHES_KEY, MOCK_SUCURSALES_MEMBRESIA)).pipe(delay(150));
  }

  getAuditoria(): Observable<AuditoriaMembresia[]> {
    return of(this.read(AUDIT_KEY, MOCK_AUDITORIA_MEMBRESIAS)).pipe(delay(150));
  }

  crear(formulario: MembresiaFormulario, planes: PlanMembresia[], sucursales: Sucursal[]): Observable<Membresia> {
    const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
    const plan = planes.find((item) => item.idPlan === formulario.idPlan);
    const sucursalesAsignadas = sucursales.filter((item) => formulario.idsSucursales.includes(item.idSucursal) && item.activa);
    if (!plan || !formulario.idSocio || !sucursalesAsignadas.length) throw new Error('Socio, plan y al menos una sucursal son obligatorios.');

    const ahora = new Date().toISOString();
    const usuario = this.auth.usuario();
    const nueva: Membresia = {
      idMembresia: this.nextId(membresias), idSocio: formulario.idSocio, nombreSocio: formulario.nombreSocio,
      plan, fechaInicio: formulario.fechaInicio, fechaFin: formulario.fechaFin, precio: formulario.precio,
      estado: formulario.estado, descripcionEstado: formulario.descripcionEstado, sucursales: sucursalesAsignadas,
      motivoCancelacion: formulario.motivoCancelacion || undefined, eliminado: false,
      creadoPor: usuario?.id ?? 0, creadoEn: ahora,
    };
    this.write(MEMBERSHIPS_KEY, [...membresias, nueva]);
    this.audit('CREADA', nueva, `Membresía ${nueva.plan.tipo} creada.`);
    return of(nueva).pipe(delay(250));
  }

  actualizar(id: number, formulario: MembresiaFormulario, planes: PlanMembresia[], sucursales: Sucursal[]): Observable<Membresia> {
    const membresias = this.read(MEMBERSHIPS_KEY, MOCK_MEMBRESIAS);
    const actual = membresias.find((item) => item.idMembresia === id && !item.eliminado);
    const plan = planes.find((item) => item.idPlan === formulario.idPlan);
    const asignadas = sucursales.filter((item) => formulario.idsSucursales.includes(item.idSucursal) && item.activa);
    if (!actual || !plan || !asignadas.length) throw new Error('Membresía o datos de actualización inválidos.');
    const usuario = this.auth.usuario();
    const actualizado: Membresia = {
      ...actual, plan, fechaInicio: formulario.fechaInicio, fechaFin: formulario.fechaFin, precio: formulario.precio,
      estado: formulario.estado, descripcionEstado: formulario.descripcionEstado, sucursales: asignadas,
      motivoCancelacion: formulario.motivoCancelacion || undefined, actualizadoPor: usuario?.id ?? 0, actualizadoEn: new Date().toISOString(),
    };
    this.write(MEMBERSHIPS_KEY, membresias.map((item) => item.idMembresia === id ? actualizado : item));
    this.audit(this.accionParaEstado(formulario.estado), actualizado, `Membresía actualizada a ${formulario.estado}.`);
    return of(actualizado).pipe(delay(250));
  }

  desactivarSucursal(idSucursal: number): Observable<Sucursal> {
    const sucursales = this.read(BRANCHES_KEY, MOCK_SUCURSALES_MEMBRESIA);
    const actual = sucursales.find((item) => item.idSucursal === idSucursal);
    if (!actual) throw new Error('Sucursal no encontrada.');
    const actualizada = { ...actual, activa: false };
    this.write(BRANCHES_KEY, sucursales.map((item) => item.idSucursal === idSucursal ? actualizada : item));
    this.audit('SUCURSAL_DESACTIVADA', undefined, `Sucursal ${actual.nombre} desactivada.`);
    return of(actualizada).pipe(delay(200));
  }

  private accionParaEstado(estado: EstadoMembresia): AuditoriaMembresia['accion'] {
    if (estado === 'CANCELADA') return 'CANCELADA';
    if (estado === 'CONGELADA') return 'CONGELADA';
    return estado === 'ACTIVA' ? 'REACTIVADA' : 'EDITADA';
  }

  private audit(accion: AuditoriaMembresia['accion'], membresia: Membresia | undefined, detalle: string): void {
    const usuario = this.auth.usuario();
    const auditoria = this.read(AUDIT_KEY, MOCK_AUDITORIA_MEMBRESIAS);
    this.write(AUDIT_KEY, [...auditoria, {
      idAuditoria: this.nextId(auditoria), accion, idMembresia: membresia?.idMembresia, idSocio: membresia?.idSocio,
      nombreSocio: membresia?.nombreSocio, idUsuario: usuario?.id ?? 0,
      nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Sistema', fecha: new Date().toISOString(), detalle,
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