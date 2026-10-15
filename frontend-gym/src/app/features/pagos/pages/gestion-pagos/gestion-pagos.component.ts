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
import {
  BENEFICIOS_MIEMBRO,
  BeneficioMiembro,
  MembresiaPagable,
  MetodoPago,
  Pago,
  RECARGOS_PAGO_TARDIO,
  RecargoPagoTardio,
} from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

/** Registro de pagos y estado de cuenta del socio (M4) con Curva PO: beneficios y recargo por mora. */
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

  // Catálogos Curva del PO (Sprint 5)
  readonly catalogoBeneficios: BeneficioMiembro[] = BENEFICIOS_MIEMBRO;
  readonly catalogoRecargos: RecargoPagoTardio[] = RECARGOS_PAGO_TARDIO;

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
    idBeneficio: ['REGULAR', [Validators.required]],
    idRecargo: ['NINGUNO', [Validators.required]],
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

  protected readonly beneficioEnFormulario = computed(() => {
    const id = this.valoresPago().idBeneficio || 'REGULAR';
    return this.catalogoBeneficios.find((b) => b.id === id) ?? this.catalogoBeneficios[0];
  });

  protected readonly recargoEnFormulario = computed(() => {
    const id = this.valoresPago().idRecargo || 'NINGUNO';
    return this.catalogoRecargos.find((r) => r.id === id) ?? this.catalogoRecargos[0];
  });

  protected readonly esFueraDePlazo = computed(() => {
    const m = this.membresiaEnFormulario();
    if (!m || !m.fechaVencimiento) return false;
    return diasHasta(m.fechaVencimiento) < 0;
  });

  protected readonly diasAtraso = computed(() => {
    const m = this.membresiaEnFormulario();
    if (!m || !m.fechaVencimiento) return 0;
    const d = diasHasta(m.fechaVencimiento);
    return d < 0 ? Math.abs(d) : 0;
  });

  protected readonly descuentoMonto = computed(() => {
    const m = this.membresiaEnFormulario();
    if (!m) return 0;
    const b = this.beneficioEnFormulario();
    if (b.tipo === 'PORCENTAJE') {
      return Number(((m.precio * b.valor) / 100).toFixed(2));
    }
    return Math.min(m.precio, b.valor);
  });

  protected readonly recargoMonto = computed(() => {
    const m = this.membresiaEnFormulario();
    if (!m) return 0;
    const r = this.recargoEnFormulario();
    if (r.tipo === 'PORCENTAJE') {
      return Number(((m.precio * r.valor) / 100).toFixed(2));
    }
    return r.valor;
  });

  protected readonly montoSugeridoFinal = computed(() => {
    const m = this.membresiaEnFormulario();
    if (!m) return 0;
    const final = m.precio - this.descuentoMonto() + this.recargoMonto();
    return Math.max(0.01, Number(final.toFixed(2)));
  });

  protected readonly esEfectivo = computed(
    () => (this.metodoEnFormulario()?.nombre ?? '').trim().toUpperCase() === 'EFECTIVO',
  );

  protected readonly montoInsuficiente = computed(() => {
    const membresia = this.membresiaEnFormulario();
    if (!membresia) return false;
    const montoIngresado = Number(this.valoresPago().monto);
    if (montoIngresado <= 0) return true;
    const minimo = this.esEfectivo()
      ? (this.descuentoMonto() > 0 ? this.montoSugeridoFinal() : membresia.precio)
      : 0.01;
    return montoIngresado < minimo;
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
    const estaVencida = elegida.fechaVencimiento ? diasHasta(elegida.fechaVencimiento) < 0 : false;
    const recargoInicial = estaVencida ? 'MORA_FIJA' : 'NINGUNO';
    const recargoObj = this.catalogoRecargos.find((r) => r.id === recargoInicial) ?? this.catalogoRecargos[0];
    const montoInicial = Math.max(0.01, elegida.precio + (recargoObj.tipo === 'MONTO_FIJO' ? recargoObj.valor : (elegida.precio * recargoObj.valor) / 100));

    this.formPago.reset({
      idMembresia: elegida.id,
      idMetodoPago: efectivo?.id ?? 0,
      idBeneficio: 'REGULAR',
      idRecargo: recargoInicial,
      monto: montoInicial,
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

  /** Al cambiar membresía, beneficio o recargo se recalcula el monto sugerido. */
  protected alCambiarMembresia(): void {
    const estaVencida = this.esFueraDePlazo();
    if (estaVencida && this.formPago.controls.idRecargo.value === 'NINGUNO') {
      this.formPago.controls.idRecargo.setValue('MORA_FIJA');
    }
    this.formPago.controls.monto.setValue(this.montoSugeridoFinal());
  }

  protected alCambiarBeneficio(): void {
    this.formPago.controls.monto.setValue(this.montoSugeridoFinal());
  }

  protected alCambiarRecargo(): void {
    this.formPago.controls.monto.setValue(this.montoSugeridoFinal());
  }

  protected registrarPago(): void {
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      return;
    }
    if (this.montoInsuficiente()) {
      this.errorModal.set(
        `El monto ingresado (Q ${Number(this.valoresPago().monto).toFixed(2)}) debe cubrir el total calculado del cobro (Q ${this.montoSugeridoFinal().toFixed(2)}).`,
      );
      return;
    }

    const valor = this.formPago.getRawValue();
    const membresia = this.membresiaEnFormulario();
    const beneficio = this.beneficioEnFormulario();
    const recargo = this.recargoEnFormulario();
    const descMonto = this.descuentoMonto();
    const recMonto = this.recargoMonto();

    let detallePO = `Plan: ${membresia?.nombrePlan || 'Plan'} (Q${membresia?.precio.toFixed(2) || '0.00'})`;
    if (beneficio.id !== 'REGULAR') {
      detallePO += ` | Beneficio: ${beneficio.nombre} (-Q${descMonto.toFixed(2)})`;
    }
    if (recargo.id !== 'NINGUNO') {
      detallePO += ` | Recargo tardío: ${recargo.nombre} (+Q${recMonto.toFixed(2)})`;
    }
    const notaUsuario = valor.observacion.trim();
    const observacionCompleta = notaUsuario ? `${detallePO} - Nota: ${notaUsuario}` : detallePO;

    this.errorModal.set(null);
    this.guardando.set(true);
    this.pagosService
      .registrar({
        idMembresia: Number(valor.idMembresia),
        idMetodoPago: Number(valor.idMetodoPago),
        monto: Number(valor.monto),
        referencia: valor.referencia.trim() || undefined,
        observacion: observacionCompleta,
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
