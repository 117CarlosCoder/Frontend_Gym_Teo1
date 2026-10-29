import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { mensajeDeError, NotificacionService } from '../../../../core/services/notificacion.service';
import {
  DIAS_SEMANA,
  DiaSemana,
  GuardarRutinaRequest,
  ReporteEntrenador,
  RutinaSemanal,
  SocioAsignadoEntrenador,
  SocioDentroEntrenador,
} from '../../models/entrenador.model';
import { EntrenadorService } from '../../services/entrenador.service';

type SeccionEntrenador = 'resumen' | 'rutinas' | 'reportes';

@Component({
  selector: 'app-espacio-entrenador',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './espacio-entrenador.component.html',
  styleUrl: './espacio-entrenador.component.css',
})
export class EspacioEntrenadorComponent {
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly fb = inject(FormBuilder);
  private readonly notificacion = inject(NotificacionService);

  protected readonly diasSemana = DIAS_SEMANA;
  protected readonly seccion = signal<SeccionEntrenador>('resumen');
  protected readonly cargando = signal(true);
  protected readonly guardandoRutina = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly socios = signal<SocioAsignadoEntrenador[]>([]);
  protected readonly sociosDentro = signal<SocioDentroEntrenador[]>([]);
  protected readonly rutinas = signal<RutinaSemanal[]>([]);
  protected readonly reporte = signal<ReporteEntrenador | null>(null);
  protected readonly desde = signal(this.primerDiaDelMes());
  protected readonly hasta = signal(this.fechaLocal(new Date()));
  protected readonly rutinaEnEdicion = signal<number | null>(null);

  protected readonly sociosActivos = computed(() => this.socios().filter((socio) => socio.activo));
  protected readonly rutinasPorDia = computed(
    () =>
      new Map(
        this.diasSemana.map((dia) => [
          dia,
          this.rutinas().filter((rutina) => rutina.diaSemana === dia && rutina.activa),
        ]),
      ),
  );

  protected readonly rutinaForm = this.fb.group({
    diaSemana: this.fb.nonNullable.control<DiaSemana>('LUNES', Validators.required),
    grupoMuscular: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    descripcion: this.fb.nonNullable.control('', Validators.maxLength(500)),
    horaInicio: this.fb.nonNullable.control(''),
    horaFin: this.fb.nonNullable.control(''),
  });

  constructor() {
    this.cargarDatos();
  }

  protected cambiarSeccion(seccion: SeccionEntrenador): void {
    this.seccion.set(seccion);
  }

  protected cargarDatos(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      socios: this.entrenadorService.getSociosAsignados(),
      sociosDentro: this.entrenadorService.getSociosDentro(),
      rutinas: this.entrenadorService.getRutinas(),
      reporte: this.entrenadorService.getReporte(this.desde(), this.hasta()),
    }).subscribe({
      next: ({ socios, sociosDentro, rutinas, reporte }) => {
        this.socios.set(socios);
        this.sociosDentro.set(sociosDentro);
        this.rutinas.set(rutinas);
        this.reporte.set(reporte);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.errorCarga.set(
          mensajeDeError(error, 'No se pudo cargar la información del entrenador.'),
        );
        this.cargando.set(false);
      },
    });
  }

  protected editarRutina(rutina: RutinaSemanal): void {
    this.rutinaEnEdicion.set(rutina.idRutina);
    this.rutinaForm.setValue({
      diaSemana: rutina.diaSemana,
      grupoMuscular: rutina.grupoMuscular,
      descripcion: rutina.descripcion ?? '',
      horaInicio: rutina.horaInicio ?? '',
      horaFin: rutina.horaFin ?? '',
    });
    this.seccion.set('rutinas');
  }

  protected cancelarEdicion(): void {
    this.rutinaEnEdicion.set(null);
    this.rutinaForm.reset({
      diaSemana: 'LUNES',
      grupoMuscular: '',
      descripcion: '',
      horaInicio: '',
      horaFin: '',
    });
  }

  protected guardarRutina(): void {
    if (this.rutinaForm.invalid || this.guardandoRutina()) {
      this.rutinaForm.markAllAsTouched();
      return;
    }

    const valores = this.rutinaForm.getRawValue();
    const request: GuardarRutinaRequest = {
      ...valores,
      grupoMuscular: valores.grupoMuscular.trim(),
      descripcion: valores.descripcion.trim(),
      horaInicio: valores.horaInicio || null,
      horaFin: valores.horaFin || null,
      activa: true,
    };

    this.guardandoRutina.set(true);
    this.entrenadorService.guardarRutina(request, this.rutinaEnEdicion() ?? undefined).subscribe({
      next: (rutina) => {
        this.rutinas.update((actuales) => {
          const existe = actuales.some((actual) => actual.idRutina === rutina.idRutina);
          return existe
            ? actuales.map((actual) => (actual.idRutina === rutina.idRutina ? rutina : actual))
            : [...actuales, rutina];
        });
        this.guardandoRutina.set(false);
        this.cancelarEdicion();
        this.notificacion.exito('La rutina se guardó correctamente.');
      },
      error: (error: unknown) => {
        this.guardandoRutina.set(false);
        this.notificacion.error(mensajeDeError(error, 'No se pudo guardar la rutina.'));
      },
    });
  }

  protected eliminarRutina(rutina: RutinaSemanal): void {
    if (!window.confirm(`¿Eliminar la rutina "${rutina.grupoMuscular}" del ${rutina.diaSemana.toLowerCase()}?`)) {
      return;
    }

    this.entrenadorService.eliminarRutina(rutina.idRutina).subscribe({
      next: () => {
        this.rutinas.update((actuales) =>
          actuales.filter((actual) => actual.idRutina !== rutina.idRutina),
        );
        if (this.rutinaEnEdicion() === rutina.idRutina) this.cancelarEdicion();
        this.notificacion.exito('La rutina se eliminó correctamente.');
      },
      error: (error: unknown) =>
        this.notificacion.error(mensajeDeError(error, 'No se pudo eliminar la rutina.')),
    });
  }

  protected actualizarFecha(evento: Event, campo: 'desde' | 'hasta'): void {
    const valor = (evento.target as HTMLInputElement).value;
    if (campo === 'desde') this.desde.set(valor);
    else this.hasta.set(valor);
  }

  protected consultarReporte(): void {
    if (!this.desde() || !this.hasta() || this.desde() > this.hasta()) {
      this.notificacion.aviso('Selecciona un rango de fechas válido.');
      return;
    }

    this.entrenadorService.getReporte(this.desde(), this.hasta()).subscribe({
      next: (reporte) => this.reporte.set(reporte),
      error: (error: unknown) =>
        this.notificacion.error(mensajeDeError(error, 'No se pudo consultar el reporte.')),
    });
  }

  protected horaDeEntrada(idSocio: number): string | null {
    return this.sociosDentro().find((socio) => socio.idSocio === idSocio)?.horaEntrada ?? null;
  }

  protected nombreDia(dia: DiaSemana): string {
    return dia.charAt(0) + dia.slice(1).toLowerCase();
  }

  private primerDiaDelMes(): string {
    const hoy = new Date();
    return this.fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  }

  private fechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
