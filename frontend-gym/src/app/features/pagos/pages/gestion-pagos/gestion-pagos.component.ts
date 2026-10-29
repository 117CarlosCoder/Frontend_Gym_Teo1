import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { calcularNuevoVencimiento, diasHasta, hoyIso, sumarDias } from '../../../../core/utils/fechas';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import {
  CongelarMembresiaComponent,
  MembresiaCongelable,
} from '../../../membresias/components/congelar-membresia/congelar-membresia.component';
import { Promocion, describirDescuento } from '../../../promociones/models/promocion.model';
import { PromocionesService } from '../../../promociones/services/promociones.service';
import { SocioTablaDTO } from '../../../socios/models/socio-tabla-dto.model';
import { SociosService } from '../../../socios/services/socios.service';
import { HistorialPagosComponent } from '../../components/historial-pagos/historial-pagos.component';
import {
  CotizacionPago,
  EstadoCuenta,
  FacturaCuenta,
  MembresiaPagable,
  MetodoPago,
  Pago,
  ReglasAbono,
} from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

/**
 * Registro de pagos y estado de cuenta del socio (M4).
 * Curva del PO: el descuento (promoción vigente) y el recargo por pago tardío los calcula el backend
 * en la cotización; aquí solo se muestran, así pantalla, historial y comprobante PDF coinciden.
 * Ajustes finales del PO: pago en cuotas/abonos con saldo pendiente y congelamiento de la membresía.
 */
@Component({
  selector: 'app-gestion-pagos',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, NgClass, ModalComponent, HistorialPagosComponent, CongelarMembresiaComponent],
  templateUrl: './gestion-pagos.component.html',
  styleUrl: './gestion-pagos.component.css',
})
export class GestionPagosComponent implements OnInit {
  private readonly pagosService = inject(PagosService);
  private readonly sociosService = inject(SociosService);
  private readonly promocionesService = inject(PromocionesService);
  private readonly notificacion = inject(NotificacionService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly socios = toSignal(this.sociosService.socios$, { initialValue: [] as SocioTablaDTO[] });
  protected readonly busqueda = signal('');
  protected readonly idSocioSeleccionado = signal<number | null>(null);

  protected readonly metodosPago = signal<MetodoPago[]>([]);
  /** Promociones vigentes que el administrador configuró; recepción puede elegir cuál aplicar. */
  protected readonly promocionesVigentes = signal<Promocion[]>([]);
  protected readonly describirDescuento = describirDescuento;
  protected readonly membresias = signal<MembresiaPagable[]>([]);
  protected readonly cargandoMembresias = signal(false);
  protected readonly errorMembresias = signal<string | null>(null);

  // Cotización del cobro calculada por el backend (precio, descuento, recargo y total)
  protected readonly cotizacion = signal<CotizacionPago | null>(null);
  protected readonly cargandoCotizacion = signal(false);
  protected readonly errorCotizacion = signal<string | null>(null);

  // Estado de cuenta (pagos en abonos)
  protected readonly estadoCuenta = signal<EstadoCuenta | null>(null);
  protected readonly cargandoCuenta = signal(false);
  protected readonly errorCuenta = signal<string | null>(null);
  protected readonly reglasAbono = signal<ReglasAbono | null>(null);

  // Modal de abono
  protected readonly facturaAAbonar = signal<FacturaCuenta | null>(null);
  protected readonly errorAbono = signal<string | null>(null);
  protected readonly guardandoAbono = signal(false);
  protected readonly formAbono = this.fb.nonNullable.group({
    idMetodoPago: [0, [Validators.required, Validators.min(1)]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    referencia: ['', [Validators.maxLength(100)]],
  });
  private readonly valoresAbono = toSignal(this.formAbono.valueChanges, { initialValue: this.formAbono.getRawValue() });

  // Modal de congelamiento
  protected readonly membresiaACongelar = signal<MembresiaCongelable | null>(null);

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
    /** 0 = automática (la vigente con mayor descuento). */
    idPromocion: [0],
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

  /** Primer abono mínimo según las reglas del gimnasio; sin abonos permitidos es el total. */
  protected readonly montoMinimo = computed(() => {
    const c = this.cotizacion();
    if (!c) return 0;
    const porcentaje = this.reglasAbono()?.porcentajeMinimoInicial ?? 100;
    if (porcentaje >= 100) return c.total;
    return Math.ceil(c.total * porcentaje) / 100;
  });

  /** El backend rechaza montos menores al primer abono mínimo. */
  protected readonly montoInsuficiente = computed(() => {
    if (!this.cotizacion()) return false;
    return Number(this.valoresPago().monto) < this.montoMinimo();
  });

  /** Pago en cuotas: el monto cubre el mínimo pero no el total; la factura queda con saldo. */
  protected readonly pagoParcial = computed(() => {
    const c = this.cotizacion();
    if (!c || this.montoInsuficiente()) return null;
    const monto = Number(this.valoresPago().monto);
    if (monto >= c.total) return null;
    const plazo = this.reglasAbono()?.plazoDias ?? 0;
    return { saldo: Math.round((c.total - monto) * 100) / 100, fechaLimite: sumarDias(hoyIso(), plazo) };
  });

  /** Factura con saldo de cada membresía: no se cobra otro periodo hasta liquidarla. */
  protected readonly saldoPorMembresia = computed(() => {
    const mapa = new Map<number, FacturaCuenta>();
    for (const f of this.estadoCuenta()?.facturas ?? []) {
      if (f.saldo > 0 && !mapa.has(f.idMembresia)) mapa.set(f.idMembresia, f);
    }
    return mapa;
  });

  protected readonly facturasConSaldo = computed(() => (this.estadoCuenta()?.facturas ?? []).filter((f) => f.saldo > 0));

  protected readonly abonoExcedeSaldo = computed(() => {
    const factura = this.facturaAAbonar();
    return !!factura && Number(this.valoresAbono().monto) > factura.saldo;
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
    this.cargarPromocionesVigentes();
    this.pagosService.obtenerReglasAbono().subscribe({
      next: (reglas) => this.reglasAbono.set(reglas),
      // Sin reglas se exige el pago completo
      error: () => this.reglasAbono.set(null),
    });

    const socioEnUrl = Number(this.route.snapshot.queryParamMap.get('socio'));
    if (socioEnUrl > 0) {
      this.seleccionarSocio(socioEnUrl);
    }
  }

  private cargarPromocionesVigentes(): void {
    this.promocionesService.listarVigentes().subscribe({
      next: (lista) => this.promocionesVigentes.set(lista),
      // Sin la lista se cobra con la promoción automática del backend
      error: () => this.promocionesVigentes.set([]),
    });
  }

  protected alBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected seleccionarSocio(idSocio: number): void {
    this.idSocioSeleccionado.set(idSocio);
    this.ultimoPago.set(null);
    this.cargarMembresias();
    this.cargarEstadoCuenta();
  }

  protected cargarEstadoCuenta(): void {
    const id = this.idSocioSeleccionado();
    if (!id) return;
    this.cargandoCuenta.set(true);
    this.errorCuenta.set(null);
    this.pagosService.estadoCuenta(id).subscribe({
      next: (cuenta) => {
        this.estadoCuenta.set(cuenta);
        this.cargandoCuenta.set(false);
      },
      error: (err) => {
        this.estadoCuenta.set(null);
        this.errorCuenta.set(mensajeDeError(err, 'No se pudo cargar el estado de cuenta.'));
        this.cargandoCuenta.set(false);
      },
    });
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
    const conSaldo = this.saldoPorMembresia().get(elegida.id);
    if (conSaldo) {
      this.notificacion.aviso(
        `La membresía tiene un saldo pendiente de Q ${conSaldo.saldo.toFixed(2)}. Registra el abono antes de cobrar otro periodo.`,
      );
      this.abrirModalAbono(conSaldo);
      return;
    }
    const efectivo = this.metodosPago().find((m) => m.nombre.toUpperCase() === 'EFECTIVO') ?? this.metodosPago()[0];

    this.formPago.reset({
      idMembresia: elegida.id,
      idMetodoPago: efectivo?.id ?? 0,
      idPromocion: 0,
      monto: elegida.precio,
      referencia: '',
      observacion: '',
    });
    this.cargarPromocionesVigentes();
    this.cargarCotizacion(elegida.id);
    this.errorModal.set(null);
    this.guardando.set(false);
    this.modalPago.set(true);
  }

  protected cerrarModalPago(): void {
    this.modalPago.set(false);
    this.errorModal.set(null);
    this.guardando.set(false);
    this.cotizacion.set(null);
  }

  /** Al cambiar de membresía o de promoción se vuelve a cotizar el cobro. */
  protected alCambiarMembresia(): void {
    const id = Number(this.formPago.controls.idMembresia.value);
    if (id) this.cargarCotizacion(id);
  }

  /** Pide al backend el precio, descuento, recargo y total; sugiere el total como monto a cobrar. */
  protected cargarCotizacion(idMembresia: number): void {
    this.cotizacion.set(null);
    this.errorCotizacion.set(null);
    this.cargandoCotizacion.set(true);
    const idPromocion = Number(this.formPago.controls.idPromocion.value) || null;
    this.pagosService.cotizar(idMembresia, idPromocion).subscribe({
      next: (c) => {
        this.cotizacion.set(c);
        this.formPago.controls.monto.setValue(c.total);
        this.cargandoCotizacion.set(false);
      },
      error: (err) => {
        this.errorCotizacion.set(mensajeDeError(err, 'No se pudo calcular el total a cobrar.'));
        this.cargandoCotizacion.set(false);
      },
    });
  }

  protected registrarPago(): void {
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      return;
    }
    const total = this.cotizacion()?.total;
    if (total === undefined) {
      this.errorModal.set('Espera a que se calcule el total del cobro antes de registrar el pago.');
      return;
    }
    if (this.montoInsuficiente()) {
      this.errorModal.set(
        this.montoMinimo() < total
          ? `El monto ingresado (Q ${Number(this.valoresPago().monto).toFixed(2)}) debe ser al menos el primer abono mínimo (Q ${this.montoMinimo().toFixed(2)}) de un total de Q ${total.toFixed(2)}.`
          : `El monto ingresado (Q ${Number(this.valoresPago().monto).toFixed(2)}) debe cubrir el total del cobro (Q ${total.toFixed(2)}).`,
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
        idPromocion: Number(valor.idPromocion) || undefined,
        referencia: valor.referencia.trim() || undefined,
        observacion: valor.observacion.trim() || undefined,
      })
      .subscribe({
        next: (pago) => {
          this.cerrarModalPago();
          this.ultimoPago.set(pago);
          this.notificacion.exito(
            pago.saldoPendiente > 0
              ? `Abono #${pago.idComprobante} registrado. Saldo pendiente: Q ${pago.saldoPendiente.toFixed(2)} hasta el ${this.formatearFecha(pago.fechaLimiteSaldo ?? '')}.`
              : `Pago #${pago.idComprobante} registrado. Membresía vigente hasta el ${this.formatearFecha(pago.nuevaFechaVencimiento)}.`,
          );
          this.recargarSocio();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorModal.set(mensajeDeError(err, 'No se pudo registrar el pago.'));
        },
      });
  }

  // --- Abonos al saldo ---
  protected abrirModalAbono(factura: FacturaCuenta): void {
    const efectivo = this.metodosPago().find((m) => m.nombre.toUpperCase() === 'EFECTIVO') ?? this.metodosPago()[0];
    this.formAbono.reset({ idMetodoPago: efectivo?.id ?? 0, monto: factura.saldo, referencia: '' });
    this.errorAbono.set(null);
    this.guardandoAbono.set(false);
    this.facturaAAbonar.set(factura);
  }

  protected cerrarModalAbono(): void {
    this.facturaAAbonar.set(null);
    this.errorAbono.set(null);
    this.guardandoAbono.set(false);
  }

  protected registrarAbono(): void {
    const factura = this.facturaAAbonar();
    if (!factura) return;
    if (this.formAbono.invalid) {
      this.formAbono.markAllAsTouched();
      return;
    }
    if (this.abonoExcedeSaldo()) {
      this.errorAbono.set(`El abono no puede superar el saldo pendiente (Q ${factura.saldo.toFixed(2)}).`);
      return;
    }
    const valor = this.formAbono.getRawValue();
    this.errorAbono.set(null);
    this.guardandoAbono.set(true);
    this.pagosService
      .registrarAbono({
        idFactura: factura.idFactura,
        idMetodoPago: Number(valor.idMetodoPago),
        monto: Number(valor.monto),
        referencia: valor.referencia.trim() || undefined,
      })
      .subscribe({
        next: (pago) => {
          this.cerrarModalAbono();
          this.ultimoPago.set(pago);
          this.notificacion.exito(
            pago.saldoPendiente > 0
              ? `Abono registrado. Saldo pendiente de la factura #${factura.idFactura}: Q ${pago.saldoPendiente.toFixed(2)}.`
              : `Abono registrado. La factura #${factura.idFactura} quedó liquidada.`,
          );
          this.recargarSocio();
        },
        error: (err) => {
          this.guardandoAbono.set(false);
          this.errorAbono.set(mensajeDeError(err, 'No se pudo registrar el abono.'));
        },
      });
  }

  // --- Congelamiento ---
  protected abrirCongelamiento(m: MembresiaPagable): void {
    this.membresiaACongelar.set({
      id: m.id,
      nombrePlan: m.nombrePlan,
      fechaVencimiento: m.fechaVencimiento,
      estado: m.estado,
    });
  }

  protected recargarSocio(): void {
    this.cargarMembresias();
    this.cargarEstadoCuenta();
    this.recargaHistorial.update((n) => n + 1);
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
