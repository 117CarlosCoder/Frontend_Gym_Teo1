import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import { diasHasta } from '../../../core/utils/fechas';

/** Días de anticipación con los que se avisa al socio que su membresía vence. */
export const DIAS_AVISO_VENCIMIENTO = 7;

export interface MembresiaPorVencer {
  idMembresia: number;
  idSocio: number;
  nombreSocio: string;
  correo: string;
  telefono: string;
  plan: string;
  precio: number;
  fechaVencimiento: string;
  diasRestantes: number;
}

export interface MiMembresia {
  idMembresia: number;
  plan: string;
  fechaVencimiento: string;
  diasRestantes: number;
  activa: boolean;
}

/** Detección de membresías próximas a vencer y recordatorios (M5). */
@Injectable({ providedIn: 'root' })
export class VencimientosService {
  private readonly http = inject(HttpClient);

  /** Membresías activas que vencen dentro de los próximos `dias` días (personal del gimnasio). */
  proximasAVencer(dias: number): Observable<MembresiaPorVencer[]> {
    const params = new HttpParams().set('dias', dias).set('size', 100).set('sort', 'fechaVencimiento,asc');
    return this.http.get<any>(`${API.membresias}/proximas-a-vencer`, { params }).pipe(
      map((res) => (Array.isArray(res) ? res : res?.content ?? []) as any[]),
      map((lista) =>
        lista.map((dto) => {
          const usuario = dto.socio?.usuario ?? {};
          return {
            idMembresia: dto.id,
            idSocio: dto.socio?.id ?? usuario.id ?? 0,
            nombreSocio: `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim() || 'Socio',
            correo: usuario.correo ?? '',
            telefono: usuario.telefono ?? '',
            plan: dto.plan?.nombre ?? 'Plan',
            precio: Number(dto.plan?.precio ?? 0),
            fechaVencimiento: dto.fechaVencimiento,
            diasRestantes: dto.diasRestantes ?? diasHasta(dto.fechaVencimiento),
          };
        }),
      ),
    );
  }

  /** Envía al socio el correo de recordatorio de vencimiento. */
  enviarRecordatorio(idMembresia: number): Observable<string> {
    return this.http
      .post<{ mensaje?: string }>(`${API.membresias}/${idMembresia}/enviar-recordatorio`, {})
      .pipe(map((res) => res?.mensaje ?? 'Recordatorio enviado.'));
  }

  /** Membresía activa del socio que inició sesión. */
  miMembresiaActiva(): Observable<MiMembresia | null> {
    return this.http.get<any>(`${API.membresias}/me/activa`).pipe(
      map((dto) => {
        if (!dto?.fechaVencimiento) return null;
        return {
          idMembresia: dto.id,
          plan: dto.plan?.nombre ?? 'Plan',
          fechaVencimiento: dto.fechaVencimiento,
          diasRestantes: diasHasta(dto.fechaVencimiento),
          activa: !!dto.activa,
        };
      }),
    );
  }
}
