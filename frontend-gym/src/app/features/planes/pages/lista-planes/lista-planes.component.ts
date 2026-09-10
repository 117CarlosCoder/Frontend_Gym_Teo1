import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { PlanesService } from '../../services/planes.service';
import { SociosService } from '../../../socios/services/socios.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PlanMembresia } from '../../../../core/models/plan-membresia.model';
import { SocioTablaDTO } from '../../../socios/models/socio-tabla-dto.model';

@Component({
  selector: 'app-lista-planes',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './lista-planes.component.html',
  styleUrl: './lista-planes.component.css',
})
export class ListaPlanes implements OnInit {
  private readonly planesService = inject(PlanesService);
  private readonly sociosService = inject(SociosService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Verificación de roles (M1)
  readonly esAdmin = computed(() => this.authService.tieneRol('ADMIN'));
  readonly esRecepcionista = computed(() =>
    this.authService.tieneRol('RECEPCIONISTA', 'RECEPCION')
  );

  // Datos reactivos
  readonly planes = toSignal(this.planesService.planes$, { initialValue: [] });
  readonly socios = toSignal(this.sociosService.socios$, { initialValue: [] });

  // Modales
  readonly modalCrear = signal<boolean>(false);
  readonly modalEditar = signal<boolean>(false);
  readonly modalEliminar = signal<boolean>(false);
  readonly modalAsignar = signal<boolean>(false);

  readonly planSeleccionado = signal<PlanMembresia | null>(null);
  readonly errorModalAsignar = signal<string | null>(null);
  readonly guardandoAsignacion = signal<boolean>(false);
  readonly socioSeleccionadoId = signal<number | null>(null);

  readonly socioSeleccionadoEnModal = computed(() => {
    const id = this.socioSeleccionadoId();
    if (!id) return null;
    return this.socios().find((s) => s.id_socio === id) || null;
  });

  readonly socioTieneMembresiaActiva = computed(() => {
    const s = this.socioSeleccionadoEnModal();
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

  // Feedback
  readonly mensajeExito = signal<string | null>(null);
  readonly mensajeError = signal<string | null>(null);

  // Formularios
  formPlan: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    duracion: [30, [Validators.required, Validators.min(1)]],
    precio: [250, [Validators.required, Validators.min(0.01)]],
    descripcion: ['', [Validators.required]],
    beneficiosTexto: [''],
  });

  formAsignar: FormGroup = this.fb.group({
    id_socio: ['', [Validators.required]],
    id_plan: ['', [Validators.required]],
    fecha_inicio: [new Date().toISOString().split('T')[0], [Validators.required]],
    fecha_vencimiento: [{ value: '', disabled: true }],
  });

  constructor() {
    this.formAsignar.get('id_socio')?.valueChanges.subscribe((val) => {
      this.socioSeleccionadoId.set(val ? Number(val) : null);
      this.errorModalAsignar.set(null);
    });
    this.formAsignar.get('id_plan')?.valueChanges.subscribe(() => this.recalcularVencimiento());
    this.formAsignar.get('fecha_inicio')?.valueChanges.subscribe(() => this.recalcularVencimiento());
  }

  ngOnInit(): void {
    this.sociosService.getSocios().subscribe({ error: () => {} });
  }

  // --- CRUD PLANES (M3) ---
  abrirModalCrear(): void {
    if (!this.esAdmin()) return;
    this.formPlan.reset({
      nombre: '',
      duracion: 30,
      precio: 250,
      descripcion: '',
      beneficiosTexto: 'Pesas y máquinas, Cardio libre',
    });
    this.mensajeError.set(null);
    this.modalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrear.set(false);
  }

  guardarNuevoPlan(): void {
    if (this.formPlan.invalid) {
      this.formPlan.markAllAsTouched();
      return;
    }

    const val = this.formPlan.getRawValue();
    const beneficios = (val.beneficiosTexto || '')
      .split(',')
      .map((b: string) => b.trim())
      .filter((b: string) => b.length > 0);

    this.planesService
      .crearPlan({
        nombre: val.nombre,
        duracion: Number(val.duracion),
        precio: Number(val.precio),
        descripcion: val.descripcion,
        beneficios,
      })
      .subscribe({
        next: (nuevo) => {
          this.mostrarExito(`Plan "${nuevo.nombre}" creado exitosamente.`);
          this.cerrarModalCrear();
        },
        error: (err) => {
          this.mensajeError.set(err.message || 'Error al crear el plan.');
        },
      });
  }

  abrirModalEditar(plan: PlanMembresia): void {
    if (!this.esAdmin()) return;
    this.planSeleccionado.set(plan);
    this.formPlan.patchValue({
      nombre: plan.nombre,
      duracion: plan.duracion,
      precio: plan.precio,
      descripcion: plan.descripcion || '',
      beneficiosTexto: (plan.beneficios || []).join(', '),
    });
    this.mensajeError.set(null);
    this.modalEditar.set(true);
  }

  cerrarModalEditar(): void {
    this.modalEditar.set(false);
    this.planSeleccionado.set(null);
  }

  guardarEdicionPlan(): void {
    const plan = this.planSeleccionado();
    if (!plan) return;

    if (this.formPlan.invalid) {
      this.formPlan.markAllAsTouched();
      return;
    }

    const val = this.formPlan.getRawValue();
    const beneficios = (val.beneficiosTexto || '')
      .split(',')
      .map((b: string) => b.trim())
      .filter((b: string) => b.length > 0);

    this.planesService
      .actualizarPlan(plan.id_plan, {
        nombre: val.nombre,
        duracion: Number(val.duracion),
        precio: Number(val.precio),
        descripcion: val.descripcion,
        beneficios,
      })
      .subscribe({
        next: (actualizado) => {
          this.mostrarExito(`Plan "${actualizado.nombre}" actualizado.`);
          this.cerrarModalEditar();
        },
        error: (err) => {
          this.mensajeError.set(err.message || 'Error al actualizar el plan.');
        },
      });
  }

  abrirModalEliminar(plan: PlanMembresia): void {
    if (!this.esAdmin()) return;
    this.planSeleccionado.set(plan);
    this.modalEliminar.set(true);
  }

  cerrarModalEliminar(): void {
    this.modalEliminar.set(false);
    this.planSeleccionado.set(null);
  }

  confirmarEliminarPlan(): void {
    const plan = this.planSeleccionado();
    if (!plan) return;

    this.planesService.eliminarPlan(plan.id_plan).subscribe({
      next: () => {
        this.mostrarExito(`Plan "${plan.nombre}" eliminado del catálogo.`);
        this.cerrarModalEliminar();
      },
      error: (err) => {
        this.mensajeError.set(err.message || 'Error al eliminar el plan.');
      },
    });
  }

  // --- ASIGNACIÓN DE PLAN A MIEMBRO (M3) ---
  abrirModalAsignar(plan?: PlanMembresia): void {
    const primerSocio = this.socios()[0];
    const targetPlanId = plan ? plan.id_plan : this.planes()[0]?.id_plan || '';
    const hoy = new Date().toISOString().split('T')[0];

    this.errorModalAsignar.set(null);
    this.guardandoAsignacion.set(false);
    this.socioSeleccionadoId.set(primerSocio ? primerSocio.id_socio : null);

    this.formAsignar.reset({
      id_socio: primerSocio ? primerSocio.id_socio : '',
      id_plan: targetPlanId,
      fecha_inicio: hoy,
    });
    this.recalcularVencimiento();
    this.modalAsignar.set(true);
  }

  cerrarModalAsignar(): void {
    this.modalAsignar.set(false);
    this.errorModalAsignar.set(null);
    this.guardandoAsignacion.set(false);
  }

  recalcularVencimiento(): void {
    const planId = Number(this.formAsignar.get('id_plan')?.value);
    const fechaInicio = this.formAsignar.get('fecha_inicio')?.value;
    const plan = this.planes().find((p) => p.id_plan === planId);

    if (plan && fechaInicio) {
      const vencimiento = this.planesService.calcularFechaVencimiento(fechaInicio, plan.duracion);
      this.formAsignar.get('fecha_vencimiento')?.setValue(vencimiento);
    }
  }

  confirmarAsignacion(): void {
    if (this.formAsignar.invalid) {
      this.formAsignar.markAllAsTouched();
      return;
    }

    const socioId = Number(this.formAsignar.get('id_socio')?.value);
    const planId = Number(this.formAsignar.get('id_plan')?.value);
    const plan = this.planes().find((p) => p.id_plan === planId);
    const socio = this.socios().find((s) => s.id_socio === socioId);

    if (!plan || !socio) return;

    const fechaInicio = this.formAsignar.get('fecha_inicio')?.value;
    const fechaVencimiento = this.formAsignar.get('fecha_vencimiento')?.value;
    this.errorModalAsignar.set(null);
    this.guardandoAsignacion.set(true);

    this.sociosService.asignarPlan(socioId, plan.nombre, plan.id_plan, fechaInicio, fechaVencimiento).subscribe({
      next: () => {
        this.guardandoAsignacion.set(false);
        this.mostrarExito(
          `¡Plan "${plan.nombre}" asignado a ${socio.usuario.nombre} ${socio.usuario.apellido}! Vigencia hasta: ${fechaVencimiento}`
        );
        this.cerrarModalAsignar();
      },
      error: (err) => {
        this.guardandoAsignacion.set(false);
        this.errorModalAsignar.set(err.message || 'Error al asignar el plan.');
      },
    });
  }

  // Helper para contar miembros con cada plan
  obtenerCantidadMiembrosConPlan(plan: PlanMembresia | string): number {
    const planNombre = typeof plan === 'string' ? plan : plan.nombre;
    const planId = typeof plan === 'object' ? plan.id_plan : undefined;
    const nombreNormalizado = (planNombre || '').trim().toLowerCase();

    return this.socios().filter((s) => {
      const coincideId = planId !== undefined && s.id_plan === planId;
      const socioPlan = (s.tipoPlan || '').trim().toLowerCase();
      const coincidePlan =
        coincideId ||
        (socioPlan !== '' &&
          socioPlan !== 'sin membresía' &&
          socioPlan !== 'sin plan asignado' &&
          (socioPlan === nombreNormalizado ||
            socioPlan.includes(nombreNormalizado) ||
            nombreNormalizado.includes(socioPlan)));

      const esActivo =
        s.estado === 'ACTIVO' ||
        (s.estadoMembresia && s.estadoMembresia.toUpperCase().includes('ACTIV'));

      return coincidePlan && esActivo;
    }).length;
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    setTimeout(() => this.mensajeExito.set(null), 4000);
  }
}

