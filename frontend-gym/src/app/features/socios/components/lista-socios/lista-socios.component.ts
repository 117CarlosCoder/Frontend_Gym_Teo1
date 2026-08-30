import { Component, inject } from '@angular/core';
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
  public errorCarga: boolean = false;

  private sociosService = inject(SociosService);

  public sociosSignal = toSignal(
    this.sociosService.getSocios().pipe(
      catchError((error) => {
        console.error('Error en la carga de socios:', error);
        this.errorCarga = true;
        return of([]); // Retorna arreglo vacío en caso de fallo
      })
    )
  );

  // Helper para asignar colores dinámicos a los badges de Bootstrap
  public obtenerEstiloBadge(estado: string): string {
    const normalizado = estado.toLowerCase().trim();
    if (normalizado.includes('activo')) return 'bg-success';
    if (normalizado.includes('pendiente')) return 'bg-warning text-dark';
    return 'bg-danger';
  }

}
