import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SociosService } from '../../services/socios.service';
import { PlanesService } from '../../../planes/services/planes.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EstadoSocio, SocioTablaDTO } from '../../models/socio-tabla-dto.model';
import { PlanMembresia } from '../../../../core/models/plan-membresia.model';
import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-lista-socios',
  standalone: true,
  imports: [CommonModule, NgClass, DatePipe, ReactiveFormsModule, ModalComponent],
  templateUrl: './lista-socios.component.html',
  styleUrl: './lista-socios.component.css',
})
export class ListaSocios implements OnInit {
  private readonly sociosService = inject(SociosService);
  private readonly planesService = inject(PlanesService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notificacion = inject(NotificacionService);

  // Permisos según Rol (M1)
  readonly esAdmin = computed(() => this.authService.tieneRol('ADMIN'));
  readonly esRecepcionista = computed(() =>
    this.authService.tieneRol('RECEPCIONISTA', 'RECEPCION')
  );

  // Estados de datos
  readonly sociosSignal = toSignal(this.sociosService.socios$, { initialValue: [] });
  readonly planesSignal = toSignal(this.planesService.planes$, { initialValue: [] });

  // Filtros y búsqueda (M2)
  readonly query = signal<string>('');
  readonly filtroEstado = signal<'TODOS' | EstadoSocio>('TODOS');

  // Modales
  readonly modalCrear = signal<boolean>(false);
  readonly modalEditar = signal<boolean>(false);
  readonly modalBaja = signal<boolean>(false);
  readonly modalAsignarPlan = signal<boolean>(false);

  readonly socioSeleccionado = signal<SocioTablaDTO | null>(null);

  // Estado de la operación del modal abierto (solo hay uno abierto a la vez)
  readonly errorModal = signal<string | null>(null);
  readonly guardando = signal<boolean>(false);

  // Formularios
  formSocio: FormGroup = this.fb.group({
    dpi: ['', [Validators.required, Validators.pattern(/^[0-9]{13}$/)]],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9+ -]{7,15}$/)]],
    estado: ['ACTIVO', [Validators.required]],
  });

  formAsignarPlan: FormGroup = this.fb.group({
    id_plan: ['', [Validators.required]],
    fecha_inicio: [new Date().toISOString().split('T')[0], [Validators.required]],
    fecha_vencimiento: [{ value: '', disabled: true }],
  });

  // Lista filtrada reactiva
  readonly sociosFiltrados = computed(() => {
    const lista = this.sociosSignal() || [];
    const busqueda = this.query().toLowerCase().trim();
    const estado = this.filtroEstado();

    return lista.filter((s) => {
      const coincideEstado = estado === 'TODOS' || s.estado === estado;
      const coincideTexto =
        !busqueda ||
        s.usuario.nombre.toLowerCase().includes(busqueda) ||
        s.usuario.apellido.toLowerCase().includes(busqueda) ||
        s.usuario.correo.toLowerCase().includes(busqueda) ||
        s.usuario.dpi.includes(busqueda);

      return coincideEstado && coincideTexto;
    });
  });

  // Conteo por estados para badges
  readonly conteoEstados = computed(() => {
    const todos = this.sociosSignal() || [];
    return {
      todos: todos.length,
      activos: todos.filter((s) => s.estado === 'ACTIVO').length,
      inactivos: todos.filter((s) => s.estado === 'INACTIVO').length,
      morosos: todos.filter((s) => s.estado === 'MOROSO').length,
    };
  });

  constructor() {
    // Recalcular vencimiento cuando cambia el plan o la fecha de inicio
    this.formAsignarPlan.get('id_plan')?.valueChanges.subscribe(() => this.actualizarFechaVencimiento());
    this.formAsignarPlan.get('fecha_inicio')?.valueChanges.subscribe(() => this.actualizarFechaVencimiento());
  }

  ngOnInit(): void {
    this.sociosService.getSocios().subscribe({
      error: (err) => this.notificacion.error(mensajeDeError(err, 'No se pudo cargar la lista de miembros.')),
    });
  }

  // Búsqueda y Filtros
  alBuscar(evento: Event): void {
    const elemento = evento.target as HTMLInputElement;
    this.query.set(elemento.value);
  }

  setFiltroEstado(estado: 'TODOS' | EstadoSocio): void {
    this.filtroEstado.set(estado);
  }

  // Modales de Socio (Alta, Edición, Baja)
  abrirModalCrear(): void {
    this.formSocio.reset({
      dpi: '',
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      estado: 'ACTIVO',
    });
    this.iniciarModal();
    this.modalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrear.set(false);
    this.iniciarModal();
  }

  guardarNuevoSocio(): void {
    if (this.formSocio.invalid) {
      this.formSocio.markAllAsTouched();
      return;
    }

    const val = this.formSocio.getRawValue();
    this.iniciarGuardado();
    this.sociosService.crearSocio(val).subscribe({
      next: (socio) => {
        this.guardando.set(false);
        this.mostrarExito(`Socio "${socio.usuario.nombre} ${socio.usuario.apellido}" registrado exitosamente.`);
        this.cerrarModalCrear();
      },
      error: (err) => this.mostrarErrorModal(err, 'Error al registrar el socio.'),
    });
  }

  abrirModalEditar(socio: SocioTablaDTO): void {
    this.socioSeleccionado.set(socio);
    this.formSocio.patchValue({
      dpi: socio.usuario.dpi,
      nombre: socio.usuario.nombre,
      apellido: socio.usuario.apellido,
      correo: socio.usuario.correo,
      telefono: socio.usuario.telefono || '',
      estado: socio.estado,
    });
    this.iniciarModal();
    this.modalEditar.set(true);
  }

  cerrarModalEditar(): void {
    this.modalEditar.set(false);
    this.socioSeleccionado.set(null);
    this.iniciarModal();
  }

  guardarEdicionSocio(): void {
    const socio = this.socioSeleccionado();
    if (!socio) return;

    if (this.formSocio.invalid) {
      this.formSocio.markAllAsTouched();
      return;
    }

    const val = this.formSocio.getRawValue();
    this.iniciarGuardado();
    this.sociosService.actualizarSocio(socio.id_socio, val).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.mostrarExito(`Datos de "${actualizado.usuario.nombre} ${actualizado.usuario.apellido}" actualizados.`);
        this.cerrarModalEditar();
      },
      error: (err) => this.mostrarErrorModal(err, 'Error al actualizar el socio.'),
    });
  }

  // Cambio rápido de estado
  cambiarEstadoDirecto(socio: SocioTablaDTO, nuevoEstado: EstadoSocio): void {
    this.sociosService.cambiarEstado(socio.id_socio, nuevoEstado).subscribe({
      next: () => {
        this.mostrarExito(`Estado de "${socio.usuario.nombre}" cambiado a ${nuevoEstado}.`);
      },
      error: (err) => this.notificacion.error(mensajeDeError(err, 'Error al cambiar el estado.')),
    });
  }

  abrirModalBaja(socio: SocioTablaDTO): void {
    this.socioSeleccionado.set(socio);
    this.iniciarModal();
    this.modalBaja.set(true);
  }

  cerrarModalBaja(): void {
    this.modalBaja.set(false);
    this.socioSeleccionado.set(null);
    this.iniciarModal();
  }

  confirmarBajaSocio(): void {
    const socio = this.socioSeleccionado();
    if (!socio) return;

    this.iniciarGuardado();
    if (this.esAdmin()) {
      // Si es Admin, puede eliminar definitivamente
      this.sociosService.eliminarSocio(socio.id_socio).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarExito(`Socio "${socio.usuario.nombre} ${socio.usuario.apellido}" eliminado permanentemente.`);
          this.cerrarModalBaja();
        },
        error: (err) => this.mostrarErrorModal(err, 'No se pudo eliminar el socio.'),
      });
    } else {
      // Si es Recepción, se da de baja cambiando estado a INACTIVO
      this.sociosService.cambiarEstado(socio.id_socio, 'INACTIVO').subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarExito(`Socio "${socio.usuario.nombre}" dado de baja (marcado como Inactivo).`);
          this.cerrarModalBaja();
        },
        error: (err) => this.mostrarErrorModal(err, 'No se pudo dar de baja el socio.'),
      });
    }
  }

  reactivarSocio(socio: SocioTablaDTO): void {
    this.sociosService.reactivarSocio(socio.id_socio).subscribe({
      next: () => {
        this.mostrarExito(`Socio "${socio.usuario.nombre} ${socio.usuario.apellido}" reactivado exitosamente.`);
      },
      error: (err) => this.notificacion.error(mensajeDeError(err, 'No se pudo reactivar el socio.')),
    });
  }


  readonly tieneMembresiaActiva = computed(() => {
    const s = this.socioSeleccionado();
    if (!s) return false;
    const esActiva = !!(s.estadoMembresia && s.estadoMembresia.toLowerCase().includes('activ'));
    const tienePlanValido = !!(s.tipoPlan && s.tipoPlan !== 'Sin Membresía' && s.tipoPlan !== 'Sin Plan Asignado');
    if (!esActiva || !tienePlanValido) return false;

    if (s.fechaVencimientoMembresia) {
      const hoy = new Date().toISOString().split('T')[0];
      return s.fechaVencimientoMembresia >= hoy;
    }
    return true;
  });

  // Asignación de Plan de Membresía (M3)
  abrirModalAsignarPlan(socio: SocioTablaDTO): void {
    this.socioSeleccionado.set(socio);
    this.iniciarModal();
    const primerPlan = this.planesSignal()[0];
    const hoy = new Date().toISOString().split('T')[0];

    this.formAsignarPlan.reset({
      id_plan: primerPlan ? primerPlan.id_plan : '',
      fecha_inicio: hoy,
    });
    this.actualizarFechaVencimiento();
    this.modalAsignarPlan.set(true);
  }

  cerrarModalAsignarPlan(): void {
    this.modalAsignarPlan.set(false);
    this.iniciarModal();
    this.socioSeleccionado.set(null);
  }

  actualizarFechaVencimiento(): void {
    const planId = Number(this.formAsignarPlan.get('id_plan')?.value);
    const fechaInicio = this.formAsignarPlan.get('fecha_inicio')?.value;
    const plan = this.planesSignal().find((p) => p.id_plan === planId);

    if (plan && fechaInicio) {
      const vencimiento = this.planesService.calcularFechaVencimiento(fechaInicio, plan.duracion);
      this.formAsignarPlan.get('fecha_vencimiento')?.setValue(vencimiento);
    }
  }

  confirmarAsignacionPlan(): void {
    const socio = this.socioSeleccionado();
    if (!socio) return;

    if (this.formAsignarPlan.invalid) {
      this.formAsignarPlan.markAllAsTouched();
      return;
    }

    const planId = Number(this.formAsignarPlan.get('id_plan')?.value);
    const plan = this.planesSignal().find((p) => p.id_plan === planId);
    if (!plan) return;

    const fechaInicio = this.formAsignarPlan.get('fecha_inicio')?.value;
    const fechaVencimiento = this.formAsignarPlan.get('fecha_vencimiento')?.value;
    this.iniciarGuardado();

    this.sociosService.asignarPlan(socio.id_socio, plan.nombre, plan.id_plan, fechaInicio, fechaVencimiento).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.mostrarExito(`Plan "${plan.nombre}" asignado exitosamente a ${actualizado.usuario.nombre}. Membresía activa hasta ${fechaVencimiento}.`);
        this.cerrarModalAsignarPlan();
      },
      error: (err) => this.mostrarErrorModal(err, 'Error al asignar el plan.'),
    });
  }

  // Estado del modal y notificaciones
  private iniciarModal(): void {
    this.errorModal.set(null);
    this.guardando.set(false);
  }

  private iniciarGuardado(): void {
    this.errorModal.set(null);
    this.guardando.set(true);
  }

  /** El modal queda abierto con el error visible y los botones habilitados para corregir o cancelar. */
  private mostrarErrorModal(err: unknown, porDefecto: string): void {
    this.guardando.set(false);
    this.errorModal.set(mensajeDeError(err, porDefecto));
  }

  private mostrarExito(mensaje: string): void {
    this.notificacion.exito(mensaje);
  }

  // Estilos de badges
  obtenerEstiloEstado(estado: EstadoSocio): string {
    switch (estado) {
      case 'ACTIVO':
        return 'badge-estado--activo';
      case 'MOROSO':
        return 'badge-estado--moroso';
      case 'INACTIVO':
        return 'badge-estado--inactivo';
      default:
        return '';
    }
  }

  obtenerEstiloMembresia(estado: string): string {
    const normalizado = (estado || '').toLowerCase();
    if (normalizado.includes('activa')) return 'badge-membresia--activa';
    if (normalizado.includes('vencida')) return 'badge-membresia--vencida';
    if (normalizado.includes('moroso')) return 'badge-membresia--moroso';
    return 'badge-membresia--inactiva';
  }
}
