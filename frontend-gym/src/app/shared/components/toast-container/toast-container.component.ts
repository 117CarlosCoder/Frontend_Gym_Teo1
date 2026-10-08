import { Component, inject } from '@angular/core';

import { NotificacionService, TipoNotificacion } from '../../../core/services/notificacion.service';

const ICONO: Record<TipoNotificacion, string> = {
  exito: 'bi-check-circle-fill',
  error: 'bi-x-octagon-fill',
  aviso: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (n of servicio.notificaciones(); track n.id) {
        <div class="toast-item toast-item--{{ n.tipo }}" [attr.role]="n.tipo === 'error' ? 'alert' : 'status'">
          <i class="bi {{ icono[n.tipo] }} toast-item__icono" aria-hidden="true"></i>
          <span class="toast-item__mensaje">{{ n.mensaje }}</span>
          <button type="button" class="btn-close btn-close-sm" aria-label="Cerrar" (click)="servicio.cerrar(n.id)"></button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: min(420px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      background: #ffffff;
      box-shadow: var(--shadow-lg);
      border-left: 5px solid var(--color-accent);
      animation: entrada 0.2s ease-out;
    }
    .toast-item__icono { font-size: 1.25rem; line-height: 1.2; }
    .toast-item__mensaje { flex: 1; font-size: var(--fs-sm); color: var(--color-text); white-space: pre-line; }
    .toast-item--exito { border-left-color: var(--color-success); }
    .toast-item--exito .toast-item__icono { color: var(--color-success); }
    .toast-item--error { border-left-color: var(--color-danger); background: var(--color-danger-bg); }
    .toast-item--error .toast-item__icono { color: var(--color-danger); }
    .toast-item--aviso { border-left-color: var(--color-warning); }
    .toast-item--aviso .toast-item__icono { color: var(--color-warning); }
    .toast-item--info .toast-item__icono { color: var(--color-accent); }
    @keyframes entrada {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class ToastContainerComponent {
  protected readonly servicio = inject(NotificacionService);
  protected readonly icono = ICONO;
}
