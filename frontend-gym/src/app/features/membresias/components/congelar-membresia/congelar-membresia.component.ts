import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { hoyIso, sumarDias } from '../../../../core/utils/fechas';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import {
  Congelamiento,
  EstadoCongelamiento,
  ReglasCongelamiento,
  diasDeCongelamiento,
} from '../../models/congelamiento.model';
import { CongelamientosService } from '../../services/congelamientos.service';

/** Datos mínimos de la membresía que se va a congelar. */
export interface MembresiaCongelable {
  id: number;
  nombrePlan: string;
  fechaVencimiento: string | null;
  estado: string;
}

const ESTILO_ESTADO: Record<EstadoCongelamiento, string> = {
  PROGRAMADO: 'bg-info text-dark',
  ACTIVO: 'bg-primary',
  FINALIZADO: 'bg-secondary',
  ANULADO: 'bg-light text-dark border',
};

/**
 * Ajuste del PO: congelar temporalmente una membresía.
 * Muestra las reglas del gimnasio, calcula el nuevo vencimiento y permite descongelar antes de tiempo.
 */
@Component({
  selector: 'app-congelar-membresia',
  imports: [ReactiveFormsModule, DatePipe, ModalComponent],
  templateUrl: './congelar-membresia.component.html',
})
export class CongelarMembresiaComponent implements OnInit {
  private readonly congelamientos = inject(CongelamientosService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  readonly membresia = input.required<MembresiaCongelable>();
  readonly nombreSocio = input<string>('');

  readonly cerrar = output<void>();
  /** Se emite al congelar o descongelar para que la página recargue la membresía. */
  readonly actualizado = output<void>();

  protected readonly estiloEstado = ESTILO_ESTADO;
  protected readonly hoy = hoyIso();

  protected readonly reglas = signal<ReglasCongelamiento | null>(null);
  protected readonly historial = signal<Congelamiento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly finalizandoId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fechaInicio: [this.hoy, Validators.required],
    fechaFin: ['', Validators.required],
    motivo: ['', Validators.maxLength(255)],
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly dias = computed(() => {
    const { fechaInicio, fechaFin } = this.valores();
    return diasDeCongelamiento(fechaInicio ?? '', fechaFin ?? '');
  });

  protected readonly nuevoVencimiento = computed(() => {
    const vence = this.membresia().fechaVencimiento;
    const dias = this.dias();
    return vence && dias > 0 ? sumarDias(vence, dias) : null;
  });

  protected readonly puedeCongelar = computed(() => {
    const m = this.membresia();
    return m.estado === 'ACTIVA' && !!m.fechaVencimiento && m.fechaVencimiento >= this.hoy;
  });

  /** Mensaje de la primera regla que no se cumple (las mismas que valida el backend). */
  protected readonly problema = computed<string | null>(() => {
    const reglas = this.reglas();
    const { fechaInicio, fechaFin } = this.valores();
    const vence = this.membresia().fechaVencimiento;
    if (!fechaInicio || !fechaFin) return null;
    if (fechaInicio < this.hoy) return 'El congelamiento no puede iniciar en una fecha pasada.';
    if (fechaFin < fechaInicio) return 'La fecha final no puede ser anterior a la de inicio.';
    if (vence && fechaInicio > vence) return 'Debe iniciar antes del vencimiento de la membresía.';
    if (reglas && (this.dias() < reglas.diasMinimo || this.dias() > reglas.diasMaximo)) {
      return `Debe durar entre ${reglas.diasMinimo} y ${reglas.diasMaximo} días.`;
    }
    return null;
  });

  protected readonly usadosEsteAnio = computed(() => {
    const anio = (this.valores().fechaInicio ?? this.hoy).slice(0, 4);
    return this.historial().filter((c) => c.estado !== 'ANULADO' && c.fechaInicio.startsWith(anio)).length;
  });

  ngOnInit(): void {
    this.congelamientos.obtenerReglas().subscribe({
      next: (reglas) => {
        this.reglas.set(reglas);
        this.form.controls.fechaFin.setValue(sumarDias(this.hoy, reglas.diasMinimo - 1));
      },
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudieron cargar las reglas de congelamiento.')),
    });
    this.cargarHistorial();
  }

  protected cargarHistorial(): void {
    this.cargando.set(true);
    this.congelamientos.listar(this.membresia().id).subscribe({
      next: (lista) => {
        this.historial.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo cargar el historial de congelamientos.'));
      },
    });
  }

  protected congelar(): void {
    if (this.form.invalid || this.problema()) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    this.error.set(null);
    this.guardando.set(true);
    this.congelamientos
      .congelar(this.membresia().id, {
        fechaInicio: valor.fechaInicio,
        fechaFin: valor.fechaFin,
        motivo: valor.motivo.trim() || undefined,
      })
      .subscribe({
        next: (c) => {
          this.guardando.set(false);
          this.notificacion.exito(
            `Membresía congelada ${c.dias} días. Nuevo vencimiento: ${this.formatear(c.fechaVencimientoMembresia)}.`,
          );
          this.actualizado.emit();
          this.cerrar.emit();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(mensajeDeError(err, 'No se pudo congelar la membresía.'));
        },
      });
  }

  protected finalizar(c: Congelamiento): void {
    this.error.set(null);
    this.finalizandoId.set(c.id);
    this.congelamientos.finalizar(c.id).subscribe({
      next: (r) => {
        this.finalizandoId.set(null);
        this.notificacion.exito(
          r.estado === 'ANULADO'
            ? `Congelamiento cancelado. Vencimiento: ${this.formatear(r.fechaVencimientoMembresia)}.`
            : `Membresía descongelada; se usaron ${r.dias} días. Vencimiento: ${this.formatear(r.fechaVencimientoMembresia)}.`,
        );
        this.actualizado.emit();
        this.cargarHistorial();
      },
      error: (err) => {
        this.finalizandoId.set(null);
        this.error.set(mensajeDeError(err, 'No se pudo descongelar la membresía.'));
      },
    });
  }

  private formatear(fecha: string | null): string {
    if (!fecha) return '-';
    const [anio, mes, dia] = fecha.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }
}
