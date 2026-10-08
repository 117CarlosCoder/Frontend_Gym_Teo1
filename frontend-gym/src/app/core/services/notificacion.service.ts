import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'aviso' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

const DURACION_MS: Record<TipoNotificacion, number> = {
  exito: 4000,
  info: 5000,
  aviso: 6000,
  error: 7000,
};

/**
 * Avisos flotantes (toasts) de toda la aplicación.
 * Se muestran por encima de cualquier modal, así un error nunca queda oculto.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private siguienteId = 1;
  readonly notificaciones = signal<Notificacion[]>([]);

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje);
  }

  aviso(mensaje: string): void {
    this.mostrar('aviso', mensaje);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  cerrar(id: number): void {
    this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }

  private mostrar(tipo: TipoNotificacion, mensaje: string): void {
    const id = this.siguienteId++;
    this.notificaciones.update((lista) => [...lista, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), DURACION_MS[tipo]);
  }
}

/** Obtiene un mensaje legible de cualquier error (AppHttpError, Error o texto). */
export function mensajeDeError(error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (!error) return porDefecto;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  const posible = (error as { message?: unknown }).message;
  return typeof posible === 'string' && posible.trim() ? posible : porDefecto;
}
