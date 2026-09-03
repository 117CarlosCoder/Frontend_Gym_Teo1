import { Component, computed, inject, signal } from '@angular/core';
import { SociosService } from '../../services/socios.service';
import { DatePipe, NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';

@Component({
  selector: 'app-lista-socios',
  imports: [NgClass, DatePipe],
  templateUrl: './lista-socios.component.html',
  styleUrl: './lista-socios.component.css',
})
export class ListaSocios {

  // Variables de estado de la tabla de socios
  protected errorCarga: boolean = false;

  // Signal que almacena el término de búsqueda actual.
  protected query = signal<string>('');

  private sociosService = inject(SociosService);

  // // Lista base que viene del servicio (Mock o HTTPS)
  protected sociosSignal = toSignal(
    this.sociosService.getSocios().pipe(
      catchError((error) => {
        console.error('Error en la carga de socios:', error);
        this.errorCarga = true;
        return of([]); // Retorna arreglo vacío en caso de fallo
      })
    )
  );

  // Se recalcula automáticamente si 'query' o 'sociosSignal' cambian.
  protected sociosFiltrados = computed(() => {
    const listaOriginal = this.sociosSignal() || [];
    const textoBusqueda = this.query().toLowerCase().trim();

    // Si no hay texto de búsqueda, devolvemos la lista completa
    if (!textoBusqueda) {
      return listaOriginal;
    }

    // Filtramos por nombres, apellidos o correo electrónico
    return listaOriginal.filter(socio =>
      socio.usuario.nombre.toLowerCase().includes(textoBusqueda) ||
      socio.usuario.apellido.toLowerCase().includes(textoBusqueda) ||
      socio.usuario.correo.toLowerCase().includes(textoBusqueda)
    );
  });

  // Helper para asignar colores dinámicos a los badges de Bootstrap
  protected obtenerEstiloBadge(estado: string): string {
    const normalizado = estado.toLowerCase().trim();
    if (normalizado.includes('activo')) return 'socios-lista__badge--activo';
    if (normalizado.includes('vencida')) return 'socios-lista__badge--vencida';
    return 'socios-lista__badge--inactivo';
  }

  // Método para actualizar el valor del buscador.
  protected alBuscar(evento: Event): void {
    const elemento = evento.target as HTMLInputElement;
    this.query.set(elemento.value); // Modifica el valor del signal
  }

}
