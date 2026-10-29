import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import type { Options } from 'highcharts';

import { AsistenciaService } from '../../services/asistencia.service';
import { AsistenciaRegistro } from '../../models/asistencia.model';
import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { GraficoComponent } from '../../../../shared/components/grafico/grafico.component';
import { construirGraficoEntradasPorHora, formatearHora } from '../../utils/grafico-asistencias';

@Component({
  selector: 'app-registro-asistencia',
  imports: [NgClass, RouterLink, GraficoComponent],
  templateUrl: './registro-asistencia.component.html',
  styleUrl: './registro-asistencia.component.css',
})
export class RegistroAsistenciaComponent {
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly formatearHora = formatearHora;
  protected errorCarga = false;

  protected readonly query = signal<string>('');
  protected readonly idSucursal = signal<number>(1);
  protected readonly loadingAsistencias = signal<boolean>(false);
  protected readonly errorAsistencias = signal<string | null>(null);
  /** Asistencias de hoy de todas las sucursales, leídas del backend. */
  protected readonly asistenciasDelDia = signal<AsistenciaRegistro[] | undefined>(undefined);
  protected readonly procesandoSalida = signal<number | null>(null);

  protected readonly sucursalesSignal = toSignal(this.asistenciaService.getSucursales());

  protected readonly sociosSignal = toSignal(
    this.asistenciaService.getSociosParaAsistencia().pipe(
      catchError((error) => {
        this.errorCarga = true;
        this.notificacion.error(mensajeDeError(error, 'No se pudo cargar la lista de socios.'));
        return of([]);
      }),
    ),
  );

  protected readonly idSocioRapido = signal<string>('');
  protected readonly procesandoAcceso = signal<boolean>(false);
  protected readonly accesoBloqueado = signal<{ idSocio: number; socio: string; motivo: string } | null>(null);
  protected readonly accesoAutorizado = signal<{ idSocio: number; socio: string; hora: string; sucursal: string } | null>(null);

  /** Asistencias de la sucursal seleccionada (tabla, contadores y gráfico). */
  protected readonly asistencias = computed(() => {
    const lista = this.asistenciasDelDia();
    if (!lista) return undefined;
    return lista.filter((a) => a.idSucursal === this.idSucursal());
  });

  protected readonly totalEntradas = computed(() => (this.asistencias() || []).length);
  protected readonly sociosDentro = computed(() => (this.asistencias() || []).filter((a) => a.dentro).length);

  protected readonly graficoEntradas = computed<Options>(() => construirGraficoEntradasPorHora(this.asistencias() || []));

  protected readonly sociosFiltrados = computed(() => {
    const listaOriginal = this.sociosSignal() || [];
    const textoBusqueda = this.query().toLowerCase().trim();
    if (!textoBusqueda) return listaOriginal;
    return listaOriginal.filter(
      (socio) =>
        socio.nombre.toLowerCase().includes(textoBusqueda) ||
        socio.apellido.toLowerCase().includes(textoBusqueda) ||
        socio.idSocio.toString().includes(textoBusqueda),
    );
  });

  constructor() {
    this.cargarAsistencias();
  }

  protected cargarAsistencias(): void {
    this.loadingAsistencias.set(true);
    this.errorAsistencias.set(null);
    this.asistenciaService.getAsistenciasHoy().subscribe({
      next: (data) => {
        this.asistenciasDelDia.set(data);
        this.loadingAsistencias.set(false);
      },
      error: (err) => {
        this.asistenciasDelDia.set([]);
        this.errorAsistencias.set(mensajeDeError(err, 'No se pudieron cargar las asistencias de hoy.'));
        this.loadingAsistencias.set(false);
      },
    });
  }

  protected alBuscar(evento: Event): void {
    this.query.set((evento.target as HTMLInputElement).value);
  }

  protected alCambiarSucursal(evento: Event): void {
    this.idSucursal.set(Number((evento.target as HTMLSelectElement).value));
  }

  protected registrarEntradaRapida(): void {
    const id = Number(this.idSocioRapido().trim());
    if (!id || isNaN(id)) return;
    this.registrarEntrada(id);
  }

  protected registrarEntrada(idSocio: number): void {
    this.accesoBloqueado.set(null);
    this.accesoAutorizado.set(null);
    this.procesandoAcceso.set(true);

    this.asistenciaService.registrarEntrada({ idSocio, idSucursal: this.idSucursal() }).subscribe({
      next: (nueva) => {
        this.asistenciasDelDia.update((actual) => [nueva, ...(actual || [])]);
        this.accesoAutorizado.set({
          idSocio,
          socio: `${nueva.nombreSocio} ${nueva.apellidoSocio}`,
          hora: formatearHora(nueva.horaEntrada),
          sucursal: nueva.sucursal,
        });
        this.idSocioRapido.set('');
        this.procesandoAcceso.set(false);
      },
      error: (err) => {
        const socio = (this.sociosSignal() || []).find((s) => s.idSocio === idSocio);
        this.accesoBloqueado.set({
          idSocio,
          socio: socio ? `${socio.nombre} ${socio.apellido}` : `Socio #${idSocio}`,
          motivo: mensajeDeError(err, 'Membresía no activa o vencida.'),
        });
        this.procesandoAcceso.set(false);
      },
    });
  }

  protected obtenerEstiloBadge(estado: string): string {
    const normalizado = estado.toLowerCase().trim();
    if (normalizado.includes('activa')) return 'asistencia__badge--activo';
    if (normalizado.includes('vencida')) return 'asistencia__badge--vencida';
    return 'asistencia__badge--inactivo';
  }

  /** Entrada abierta del socio hoy (en cualquier sucursal); undefined si está fuera. */
  protected obtenerAsistenciaActiva(idSocio: number): AsistenciaRegistro | undefined {
    return (this.asistenciasDelDia() || []).find((a) => a.idSocio === idSocio && a.dentro);
  }

  protected registrarSalida(asistencia: AsistenciaRegistro | undefined): void {
    if (!asistencia) return;
    this.procesandoSalida.set(asistencia.idAsistencia);
    this.asistenciaService.registrarSalida(asistencia.idAsistencia).subscribe({
      next: (actualizada) => {
        this.asistenciasDelDia.update((lista) =>
          (lista || []).map((a) => (a.idAsistencia === actualizada.idAsistencia ? actualizada : a)),
        );
        this.procesandoSalida.set(null);
        this.notificacion.exito(
          `Salida registrada para ${actualizada.nombreSocio} ${actualizada.apellidoSocio} a las ${formatearHora(actualizada.horaSalida)}.`,
        );
      },
      error: (err) => {
        this.procesandoSalida.set(null);
        this.notificacion.error(mensajeDeError(err, 'No se pudo registrar la salida.'));
        this.cargarAsistencias();
      },
    });
  }
}
