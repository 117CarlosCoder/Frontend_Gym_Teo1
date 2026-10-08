import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';

import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { Pago } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

/** Historial de pagos de un socio con descarga del comprobante en PDF. */
@Component({
  selector: 'app-historial-pagos',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './historial-pagos.component.html',
  styleUrl: './historial-pagos.component.css',
})
export class HistorialPagosComponent {
  private readonly pagosService = inject(PagosService);
  private readonly notificacion = inject(NotificacionService);

  readonly idSocio = input.required<number>();
  readonly tamanoPagina = input<number>(10);
  /** Cambiar este valor fuerza recargar el historial (por ejemplo, después de registrar un pago). */
  readonly recarga = input<number>(0);

  protected readonly pagos = signal<Pago[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly totalPagos = signal(0);
  protected readonly descargando = signal<number | null>(null);

  constructor() {
    effect(() => {
      this.idSocio();
      this.recarga();
      untracked(() => this.cargar(0));
    });
  }

  protected cargar(pagina: number): void {
    const id = this.idSocio();
    if (!id) return;
    this.cargando.set(true);
    this.error.set(null);
    this.pagosService.historialPorSocio(id, pagina, this.tamanoPagina()).subscribe({
      next: (res) => {
        this.pagos.set(res.content);
        this.pagina.set(res.number ?? pagina);
        this.totalPaginas.set(res.totalPages ?? 1);
        this.totalPagos.set(res.totalElements ?? res.content.length);
        this.cargando.set(false);
      },
      error: (err) => {
        this.pagos.set([]);
        this.error.set(mensajeDeError(err, 'No se pudo cargar el historial de pagos.'));
        this.cargando.set(false);
      },
    });
  }

  protected descargar(pago: Pago): void {
    this.descargando.set(pago.idComprobante);
    this.pagosService.descargarComprobante(pago.idComprobante).subscribe({
      next: (pdf) => {
        this.pagosService.guardarPdf(pdf, pago.idComprobante);
        this.descargando.set(null);
      },
      error: (err) => {
        this.descargando.set(null);
        this.notificacion.error(mensajeDeError(err, 'No se pudo descargar el comprobante.'));
      },
    });
  }
}
