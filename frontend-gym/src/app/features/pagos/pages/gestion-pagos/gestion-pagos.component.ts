import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { calcularNuevoVencimiento, diasHasta } from '../../../../core/utils/fechas';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SocioTablaDTO } from '../../../socios/models/socio-tabla-dto.model';
import { SociosService } from '../../../socios/services/socios.service';
import { HistorialPagosComponent } from '../../components/historial-pagos/historial-pagos.component';
import { MembresiaPagable, MetodoPago, Pago } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

/** Registro de pagos y estado de cuenta del socio (M4). */
@Component({
  selector: 'app-gestion-pagos',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, NgClass, ModalComponent, HistorialPagosComponent],
  templateUrl: './gestion-pagos.component.html',
  styleUrl: './gestion-pagos.component.css',
})
export class GestionPagosComponent implements OnInit {
  private readonly pagosService = inject(PagosService);
  private readonly sociosService = inject(SociosService);
  private readonly notificacion = inject(NotificacionService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly socios = toSignal(this.sociosService.socios$, { initialValue: [] as SocioTablaDTO[] });
  protected readonly busqueda = signal('');
  protected readonly idSocioSeleccionado = signal<number | null>(null);

  protected readonly metodosPago = signal<MetodoPago[]>([]);
  protected readonly membresias = signal<MembresiaPagable[]>([]);
  protected readonly cargandoMembresias = signal(false);
  protected readonly errorMembresias = signal<string | null>(null);

  /** Se incrementa para recargar el historial después de registrar un pago. */
  protected readonly recargaHistorial = signal(0);
  protected readonly ultimoPago = signal<Pago | null>(null);
  protected readonly descargandoUltimo = signal(false);

  // Modal de registro de pago
  protected readonly modalPago = signal(false);
  protected readonly errorModal = signal<string | null>(null);
  protected readonly guardando = signal(false);

  protected readonly formPago = this.fb.nonNullable.group({
    idMembresia: [0, [Validators.required, Validators.min(1)]],
    idMetodoPago: [0, [Validators.required, Validators.min(1)]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    referencia: ['', [Validators.maxLength(100)]],
    observacion: ['', [Validators.maxLength(255)]],
  });

  private readonly valoresPago = toSignal(this.formPago.valueChanges, { initialValue: this.formPago.getRawValue() });

  protected readonly sociosFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const lista = this.socios();
    if (!texto) return lista;
    return lista.filter((s) =>
      `${s.usuario.nombre} ${s.usuario.apellido} ${s.usuario.dpi} ${s.usuario.correo}`.toLowerCase().includes(texto),
    );
  });

  protected readonly socioSeleccionado = computed(
    () => this.socios().find((s) => s.id_socio === this.idSocioSeleccionado()) ?? null,
  );

  protected readonly membresiaEnFormulario = computed(() => {
    const id = Number(this.valoresPago().idMembresia);
    return this.membresias().find((m) => m.id === id) ?? null;
  });

  protected readonly metodoEnFormulario = computed(() => {
    const id = Number(this.valoresPago().idMetodoPago);
    return this.metodosPago().find((m) => m.id === id) ?? null;
  });

  protected readonly esEfectivo = computed(
    () => (this.metodoEnFormulario()?.nombre ?? '').trim().toUpperCase() === 'EFECTIVO',
  );

  /** En efectivo el backend exige pagar al menos el precio del plan. */
  protected readonly montoInsuficiente = computed(() => {
    const membresia = this.membresiaEnFormulario();
    return !!membresia && this.esEfectivo() && Number(this.valoresPago().monto) < membresia.precio;
  });

  protected readonly vistaPrevia = computed(() => {
    const membresia = this.membresiaEnFormulario();
    if (!membresia) return null;
    return {
      actual: membresia.fechaVencimiento,
      nueva: calcularNuevoVencimiento(membresia.fechaVencimiento, membresia.duracionDias),
      duracion: membresia.duracionDias,
    };
  });

  ngOnInit(): void {
    this.sociosService.getSocios().subscribe({
      error: (err) => this.notificacion.error(mensajeDeError(err, 'No se pudo cargar la lista de socios.')),
    });
    this.pagosService.listarMetodosPago().subscribe({
      next: (metodos) => this.metodosPago.set(metodos),
      error: (err) => this.notificacion.error(mensajeDeError(err, 'No se pudieron cargar los métodos de pago.')),
    });

    const socioEnUrl = Number(this.route.snapshot.queryParamMap.get('socio'));
    if (socioEnUrl > 0) {
      this.seleccionarSocio(socioEnUrl);
    }
  }

  protected alBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected seleccionarSocio(idSocio: number): void {
    this.idSocioSeleccionado.set(idSocio);
    this.ultimoPago.set(null);
    this.cargarMembresias();
  }

  protected cargarMembresias(): void {
    const id = this.idSocioSeleccionado();
    if (!id) return;
    this.cargandoMembresias.set(true);
    this.errorMembresias.set(null);
    this.pagosService.membresiasDeSocio(id).subscribe({
      next: (lista) => {
        this.membresias.set(lista);
        this.cargandoMembresias.set(false);
      },
      error: (err) => {
        this.membresias.set([]);
        this.errorMembresias.set(mensajeDeError(err, 'No se pudieron cargar las membresías del socio.'));
        this.cargandoMembresias.set(false);
      },
    });
  }

  protected diasRestantes(fecha: string | null): number | null {
    return fecha ? diasHasta(fecha) : null;
  }

  protected claseDias(dias: number | null): string {
    if (dias === null) return 'bg-secondary';
    if (dias < 0) return 'bg-danger';
    if (dias <= 7) return 'bg-warning text-dark';
    return 'bg-success';
  }

  // --- Modal de registro de pago ---
  protected abrirModalPago(membresia?: MembresiaPagable): void {
    const elegida = membresia ?? this.membresias().find((m) => m.activa) ?? this.membresias()[0];
    if (!elegida) {
      this.notificacion.aviso('El socio no tiene una membresía asignada. Asígnale un plan antes de registrar el pago.');
      return;
    }
    const efectivo = this.metodosPago().find((m) => m.nombre.toUpperCase() === 'EFECTIVO') ?? this.metodosPago()[0];
    this.formPago.reset({
      idMembresia: elegida.id,
      idMetodoPago: efectivo?.id ?? 0,
      monto: elegida.precio,
      referencia: '',
      observacion: '',
    });
    this.errorModal.set(null);
    this.guardando.set(false);
    this.modalPago.set(true);
  }

  protected cerrarModalPago(): void {
    this.modalPago.set(false);
    this.errorModal.set(null);
    this.guardando.set(false);
  }

  /** Al cambiar la membresía se sugiere como monto el precio de su plan. */
  protected alCambiarMembresia(): void {
    const membresia = this.membresiaEnFormulario();
    if (membresia) this.formPago.controls.monto.setValue(membresia.precio);
  }

  protected registrarPago(): void {
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      return;
    }
    if (this.montoInsuficiente()) {
      this.errorModal.set(
        `En efectivo el monto debe cubrir el precio del plan (Q ${this.membresiaEnFormulario()!.precio.toFixed(2)}).`,
      );
      return;
    }

    const valor = this.formPago.getRawValue();
    this.errorModal.set(null);
    this.guardando.set(true);
    this.pagosService
      .registrar({
        idMembresia: Number(valor.idMembresia),
        idMetodoPago: Number(valor.idMetodoPago),
        monto: Number(valor.monto),
        referencia: valor.referencia.trim() || undefined,
        observacion: valor.observacion.trim() || undefined,
      })
      .subscribe({
        next: (pago) => {
          this.cerrarModalPago();
          this.ultimoPago.set(pago);
          this.notificacion.exito(
            `Pago #${pago.idComprobante} registrado. Membresía vigente hasta el ${this.formatearFecha(pago.nuevaFechaVencimiento)}.`,
          );
          this.cargarMembresias();
          this.recargaHistorial.update((n) => n + 1);
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorModal.set(mensajeDeError(err, 'No se pudo registrar el pago.'));
        },
      });
  }

  protected descargarUltimoComprobante(): void {
    const pago = this.ultimoPago();
    if (!pago) return;
    this.descargandoUltimo.set(true);
    this.pagosService.descargarComprobante(pago.idComprobante).subscribe({
      next: (pdf) => {
        this.pagosService.guardarPdf(pdf, pago.idComprobante);
        this.descargandoUltimo.set(false);
      },
      error: (err) => {
        this.descargandoUltimo.set(false);
        this.notificacion.error(mensajeDeError(err, 'No se pudo descargar el comprobante.'));
      },
    });
  }

  private formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }
}
