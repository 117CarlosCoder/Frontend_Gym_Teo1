import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { PlanMembresia } from '../../../../core/models/plan-membresia.model';
import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PlanesService } from '../../../planes/services/planes.service';
import {
  GuardarPromocionRequest,
  Promocion,
  TipoDescuento,
  calcularDescuento,
  describirDescuento,
} from '../../models/promocion.model';
import { PromocionesService } from '../../services/promociones.service';

/** El porcentaje no puede pasar de 100 y la fecha fin no puede ser anterior al inicio (mismas reglas que el backend). */
function validarPromocion(grupo: AbstractControl): ValidationErrors | null {
  const { tipoDescuento, valorDescuento, fechaInicio, fechaFin } = grupo.value;
  const errores: ValidationErrors = {};
  if (tipoDescuento === 'PORCENTAJE' && Number(valorDescuento) > 100) {
    errores['porcentajeMayorA100'] = true;
  }
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
    errores['rangoFechas'] = true;
  }
  return Object.keys(errores).length ? errores : null;
}

function hoyIso(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/**
 * Administración de descuentos (solo ADMIN): promociones por porcentaje o monto fijo con su vigencia,
 * y el porcentaje de recargo por pago tardío. El backend los aplica al cotizar y registrar cada pago.
 */
@Component({
  selector: 'app-gestion-promociones',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, ModalComponent],
  templateUrl: './gestion-promociones.component.html',
  styleUrl: './gestion-promociones.component.css',
})
export class GestionPromocionesComponent implements OnInit {
  private readonly promocionesService = inject(PromocionesService);
  private readonly planesService = inject(PlanesService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  protected readonly describirDescuento = describirDescuento;

  protected readonly promociones = signal<Promocion[]>([]);
  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly filtro = signal<'TODAS' | 'VIGENTES' | 'INACTIVAS'>('TODAS');
  protected readonly procesandoId = signal<number | null>(null);

  protected readonly planes = toSignal(this.planesService.planes$, { initialValue: [] as PlanMembresia[] });

  // Modal crear / editar
  protected readonly modalAbierto = signal(false);
  protected readonly promocionEditando = signal<Promocion | null>(null);
  protected readonly errorModal = signal<string | null>(null);
  protected readonly guardando = signal(false);

  // Modal eliminar
  protected readonly promocionAEliminar = signal<Promocion | null>(null);
  protected readonly errorEliminar = signal<string | null>(null);
  protected readonly eliminando = signal(false);

  // Recargo por pago tardío
  protected readonly recargoActual = signal<number | null>(null);
  protected readonly recargoActualizado = signal<string | null>(null);
  protected readonly guardandoRecargo = signal(false);
  protected readonly errorRecargo = signal<string | null>(null);

  protected readonly formPromocion = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(255)]],
      tipoDescuento: ['PORCENTAJE' as TipoDescuento, Validators.required],
      valorDescuento: [10, [Validators.required, Validators.min(0.01)]],
      fechaInicio: [hoyIso(), Validators.required],
      fechaFin: [hoyIso(), Validators.required],
      activo: [true],
    },
    { validators: validarPromocion },
  );

  protected readonly formRecargo = this.fb.nonNullable.group({
    porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  private readonly valoresPromocion = toSignal(this.formPromocion.valueChanges, {
    initialValue: this.formPromocion.getRawValue(),
  });

  protected readonly promocionesFiltradas = computed(() => {
    const lista = this.promociones();
    switch (this.filtro()) {
      case 'VIGENTES':
        return lista.filter((p) => p.vigente);
      case 'INACTIVAS':
        return lista.filter((p) => !p.activo);
      default:
        return lista;
    }
  });

  protected readonly totalVigentes = computed(() => this.promociones().filter((p) => p.vigente).length);

  /** Cuánto descontaría la promoción del formulario en cada plan activo, para revisar antes de guardar. */
  protected readonly ejemploPlanes = computed(() => {
    const valores = this.valoresPromocion();
    const valor = Number(valores.valorDescuento);
    if (!valor || valor <= 0) return [];
    const promocion = { tipoDescuento: valores.tipoDescuento ?? 'PORCENTAJE', valorDescuento: valor };
    return this.planes()
      .filter((plan) => plan.activo !== false)
      .map((plan) => {
        const descuento = calcularDescuento(promocion, plan.precio);
        return { nombre: plan.nombre, precio: plan.precio, descuento, total: plan.precio - descuento };
      });
  });

  protected readonly esPorcentaje = computed(() => this.valoresPromocion().tipoDescuento === 'PORCENTAJE');

  ngOnInit(): void {
    this.cargarPromociones();
    this.cargarRecargo();
    this.planesService.getPlanes().subscribe({ error: () => {} });
  }

  protected cargarPromociones(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.promocionesService.listar().subscribe({
      next: (lista) => {
        this.promociones.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorCarga.set(mensajeDeError(err, 'No se pudieron cargar las promociones.'));
        this.cargando.set(false);
      },
    });
  }

  protected cargarRecargo(): void {
    this.promocionesService.obtenerRecargoTardio().subscribe({
      next: (recargo) => {
        this.recargoActual.set(recargo.porcentaje);
        this.recargoActualizado.set(recargo.fechaActualizacion);
        this.formRecargo.reset({ porcentaje: recargo.porcentaje });
      },
      error: (err) => this.errorRecargo.set(mensajeDeError(err, 'No se pudo cargar el recargo por pago tardío.')),
    });
  }

  protected guardarRecargo(): void {
    if (this.formRecargo.invalid) {
      this.formRecargo.markAllAsTouched();
      return;
    }
    const porcentaje = Number(this.formRecargo.getRawValue().porcentaje);
    this.guardandoRecargo.set(true);
    this.errorRecargo.set(null);
    this.promocionesService.actualizarRecargoTardio(porcentaje).subscribe({
      next: (recargo) => {
        this.recargoActual.set(recargo.porcentaje);
        this.recargoActualizado.set(recargo.fechaActualizacion);
        this.formRecargo.reset({ porcentaje: recargo.porcentaje });
        this.guardandoRecargo.set(false);
        this.notificacion.exito(`Recargo por pago tardío actualizado a ${recargo.porcentaje} %.`);
      },
      error: (err) => {
        this.guardandoRecargo.set(false);
        this.errorRecargo.set(mensajeDeError(err, 'No se pudo actualizar el recargo.'));
      },
    });
  }

  // --- Crear / editar ---
  protected abrirNueva(): void {
    this.promocionEditando.set(null);
    this.formPromocion.reset({
      nombre: '',
      descripcion: '',
      tipoDescuento: 'PORCENTAJE',
      valorDescuento: 10,
      fechaInicio: hoyIso(),
      fechaFin: hoyIso(),
      activo: true,
    });
    this.abrirModal();
  }

  protected abrirEdicion(promocion: Promocion): void {
    this.promocionEditando.set(promocion);
    this.formPromocion.reset({
      nombre: promocion.nombre,
      descripcion: promocion.descripcion ?? '',
      tipoDescuento: promocion.tipoDescuento,
      valorDescuento: promocion.valorDescuento,
      fechaInicio: promocion.fechaInicio,
      fechaFin: promocion.fechaFin,
      activo: promocion.activo,
    });
    this.abrirModal();
  }

  private abrirModal(): void {
    this.errorModal.set(null);
    this.guardando.set(false);
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.errorModal.set(null);
    this.guardando.set(false);
  }

  protected guardar(): void {
    if (this.formPromocion.invalid) {
      this.formPromocion.markAllAsTouched();
      return;
    }
    const valor = this.formPromocion.getRawValue();
    const request: GuardarPromocionRequest = {
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim() || undefined,
      tipoDescuento: valor.tipoDescuento,
      valorDescuento: Number(valor.valorDescuento),
      fechaInicio: valor.fechaInicio,
      fechaFin: valor.fechaFin,
      activo: valor.activo,
    };

    const editando = this.promocionEditando();
    const operacion = editando
      ? this.promocionesService.actualizar(editando.id, request)
      : this.promocionesService.crear(request);

    this.errorModal.set(null);
    this.guardando.set(true);
    operacion.subscribe({
      next: (guardada) => {
        this.cerrarModal();
        this.notificacion.exito(
          editando ? `Promoción "${guardada.nombre}" actualizada.` : `Promoción "${guardada.nombre}" creada.`,
        );
        this.cargarPromociones();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(mensajeDeError(err, 'No se pudo guardar la promoción.'));
      },
    });
  }

  protected cambiarEstado(promocion: Promocion): void {
    this.procesandoId.set(promocion.id);
    this.promocionesService.actualizar(promocion.id, { activo: !promocion.activo }).subscribe({
      next: (actualizada) => {
        this.procesandoId.set(null);
        this.promociones.update((lista) => lista.map((p) => (p.id === actualizada.id ? actualizada : p)));
        this.notificacion.exito(
          `Promoción "${actualizada.nombre}" ${actualizada.activo ? 'activada' : 'desactivada'}.`,
        );
      },
      error: (err) => {
        this.procesandoId.set(null);
        this.notificacion.error(mensajeDeError(err, 'No se pudo cambiar el estado de la promoción.'));
      },
    });
  }

  // --- Eliminar ---
  protected pedirEliminar(promocion: Promocion): void {
    this.errorEliminar.set(null);
    this.eliminando.set(false);
    this.promocionAEliminar.set(promocion);
  }

  protected cerrarEliminar(): void {
    this.promocionAEliminar.set(null);
    this.errorEliminar.set(null);
    this.eliminando.set(false);
  }

  protected confirmarEliminar(): void {
    const promocion = this.promocionAEliminar();
    if (!promocion) return;
    this.eliminando.set(true);
    this.errorEliminar.set(null);
    this.promocionesService.eliminar(promocion.id).subscribe({
      next: () => {
        this.cerrarEliminar();
        this.notificacion.exito(`Promoción "${promocion.nombre}" eliminada.`);
        this.cargarPromociones();
      },
      error: (err) => {
        this.eliminando.set(false);
        this.errorEliminar.set(mensajeDeError(err, 'No se pudo eliminar la promoción.'));
      },
    });
  }

  protected estadoPromocion(promocion: Promocion): { texto: string; clase: string } {
    if (!promocion.activo) return { texto: 'Inactiva', clase: 'bg-secondary' };
    if (promocion.vigente) return { texto: 'Vigente', clase: 'bg-success' };
    if (promocion.fechaInicio > hoyIso()) return { texto: 'Programada', clase: 'bg-info text-dark' };
    return { texto: 'Vencida', clase: 'bg-warning text-dark' };
  }
}
