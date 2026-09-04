import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';
import { AsistenciaService } from '../../services/asistencia.service';

@Component({
  selector: 'app-registro-asistencia',
  imports: [NgClass],
  templateUrl: './registro-asistencia.component.html',
  styleUrl: './registro-asistencia.component.css'
})
export class RegistroAsistenciaComponent {
  
  protected errorCarga: boolean = false;
  
  protected query = signal<string>('');
  protected idSucursal = signal<number>(1);
  protected loadingAsistencias = signal<boolean>(false);
  
  private asistenciaService = inject(AsistenciaService);

  protected sucursalesSignal = toSignal(
    this.asistenciaService.getSucursales().pipe(
      catchError((error) => {
        console.error('Error cargando sucursales:', error);
        return of([]);
      })
    )
  );

  protected sociosSignal = toSignal(
    this.asistenciaService.getSociosParaAsistencia().pipe(
      catchError((error) => {
        console.error('Error cargando socios:', error);
        this.errorCarga = true;
        return of([]);
      })
    )
  );

  protected asistencias = signal<any[] | undefined>(undefined);

  constructor() {
    this.cargarAsistencias(this.idSucursal());
  }

  private cargarAsistencias(idSuc: number) {
    this.loadingAsistencias.set(true);
    this.asistencias.set(undefined);
    this.asistenciaService.getAsistenciasHoy(idSuc).subscribe({
      next: (data) => {
        this.asistencias.set(data);
        this.loadingAsistencias.set(false);
      },
      error: (err) => {
        console.error('Error', err);
        this.asistencias.set([]);
        this.loadingAsistencias.set(false);
      }
    });
  }

  protected sociosFiltrados = computed(() => {
    const listaOriginal = this.sociosSignal() || [];
    const textoBusqueda = this.query().toLowerCase().trim();

    if (!textoBusqueda) {
      return listaOriginal;
    }

    return listaOriginal.filter(socio =>
      socio.nombre.toLowerCase().includes(textoBusqueda) ||
      socio.apellido.toLowerCase().includes(textoBusqueda)
    );
  });

  protected totalEntradas = computed(() => {
    return (this.asistencias() || []).length;
  });

  protected sociosDentro = computed(() => {
    return (this.asistencias() || []).filter(a => a.horaSalida === null).length;
  });

  protected alBuscar(evento: Event): void {
    const elemento = evento.target as HTMLInputElement;
    this.query.set(elemento.value);
  }

  protected alCambiarSucursal(evento: Event): void {
    const select = evento.target as HTMLSelectElement;
    const val = Number(select.value);
    this.idSucursal.set(val);
    this.cargarAsistencias(val);
  }

  protected obtenerEstiloBadge(estado: string): string {
    const normalizado = estado.toLowerCase().trim();
    if (normalizado.includes('activa')) return 'asistencia__badge--activo';
    if (normalizado.includes('vencida')) return 'asistencia__badge--vencida';
    return 'asistencia__badge--inactivo';
  }

  protected esSocioDentro(idSocio: number): boolean {
    return !!this.obtenerAsistenciaActiva(idSocio);
  }

  protected obtenerAsistenciaActiva(idSocio: number): any {
    const asis = this.asistencias() || [];
    return asis.find(a => a.idSocio === idSocio && a.horaSalida === null);
  }

  protected registrarEntrada(idSocio: number): void {
    this.asistenciaService.registrarEntrada({
      idSocio,
      idSucursal: this.idSucursal(),
      tipo: 'ENTRADA'
    }).subscribe(nueva => {
      const current = this.asistencias() || [];
      this.asistencias.set([...current, nueva]);
    });
  }

  protected registrarSalida(idAsistencia: number): void {
    this.asistenciaService.registrarSalida(idAsistencia).subscribe(actualizada => {
      const current = this.asistencias() || [];
      const index = current.findIndex(a => a.idAsistencia === idAsistencia);
      if (index !== -1) {
        const nextList = [...current];
        nextList[index] = actualizada;
        this.asistencias.set(nextList);
      }
    });
  }
}
