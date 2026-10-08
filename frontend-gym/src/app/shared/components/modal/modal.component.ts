import { Component, ElementRef, OnDestroy, OnInit, effect, input, output, viewChild } from '@angular/core';

/**
 * Ventana emergente reutilizable.
 * - Muestra el error de la operación dentro del modal (siempre visible, fuera del área con scroll).
 * - Se cierra con la X o con Escape, salvo mientras se está guardando.
 *   (No se cierra con clic en el fondo para no perder lo escrito en un formulario).
 *
 * El contenido (formulario, cuerpo y pie) se proyecta con <ng-content>; las clases
 * modal-body-custom y modal-footer-custom están definidas globalmente.
 */
@Component({
  selector: 'app-modal',
  host: { '(document:keydown.escape)': 'intentarCerrar()' },
  template: `
    <div class="modal-fondo">
      <div
        class="modal-tarjeta modal-tarjeta--{{ tamano() }}"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="titulo()"
      >
        <div class="modal-tarjeta__cabecera">
          <div class="d-flex align-items-center gap-2">
            @if (icono()) {
              <i class="bi {{ icono() }} modal-tarjeta__icono" aria-hidden="true"></i>
            }
            <div>
              <h4 class="m-0 fw-bold fs-5">{{ titulo() }}</h4>
              @if (subtitulo()) {
                <small class="text-muted">{{ subtitulo() }}</small>
              }
            </div>
          </div>
          <button type="button" class="btn-close" aria-label="Cerrar" [disabled]="bloqueado()" (click)="intentarCerrar()"></button>
        </div>

        @if (error()) {
          <div #alertaError class="modal-tarjeta__error alert alert-danger d-flex align-items-start gap-2 m-0 rounded-0" role="alert" tabindex="-1">
            <i class="bi bi-exclamation-octagon-fill mt-1" aria-hidden="true"></i>
            <div class="flex-grow-1">
              <strong class="d-block">No se pudo completar la operación</strong>
              <span class="small">{{ error() }}</span>
            </div>
            <button type="button" class="btn-close btn-close-sm" aria-label="Ocultar error" (click)="cerrarError.emit()"></button>
          </div>
        }

        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .modal-fondo {
      position: fixed;
      inset: 0;
      background-color: rgba(10, 19, 48, 0.6);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1rem;
    }
    .modal-tarjeta {
      background: #ffffff;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 600px;
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: entradaModal 0.2s ease-out;
    }
    .modal-tarjeta--sm { max-width: 440px; }
    .modal-tarjeta--lg { max-width: 820px; }
    .modal-tarjeta__cabecera {
      padding: 1.1rem 1.5rem;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background-color: var(--color-surface);
      flex-shrink: 0;
    }
    .modal-tarjeta__icono { font-size: 1.4rem; color: var(--color-accent); }
    .modal-tarjeta__error {
      flex-shrink: 0;
      border-left: 0;
      border-right: 0;
      animation: entradaModal 0.2s ease-out;
    }
    @keyframes entradaModal {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class ModalComponent implements OnInit, OnDestroy {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>('');
  readonly icono = input<string>('');
  readonly tamano = input<'sm' | 'md' | 'lg'>('md');
  /** Mensaje de error a mostrar dentro del modal. */
  readonly error = input<string | null>(null);
  /** Mientras es true (por ejemplo, guardando) el modal no se puede cerrar. */
  readonly bloqueado = input<boolean>(false);

  readonly cerrar = output<void>();
  readonly cerrarError = output<void>();

  private readonly alertaError = viewChild<ElementRef<HTMLElement>>('alertaError');

  constructor() {
    // Al aparecer un error, se enfoca la alerta para que el usuario y los lectores de pantalla lo noten.
    effect(() => {
      this.alertaError()?.nativeElement.focus();
    });
  }

  ngOnInit(): void {
    document.body.classList.add('modal-abierto');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-abierto');
  }

  protected intentarCerrar(): void {
    if (!this.bloqueado()) {
      this.cerrar.emit();
    }
  }
}
