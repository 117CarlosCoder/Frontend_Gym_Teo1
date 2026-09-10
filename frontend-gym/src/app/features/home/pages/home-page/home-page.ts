import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { CLASES, ENTRENADORES, ESTADISTICAS, PLANES, PlanMembresia, SERVICIOS } from '../../data/home-content';
import { PlanesService } from '../../../planes/services/planes.service';

/**
 * Página pública de inicio: presenta el gimnasio, sus servicios, planes de
 * membresía, entrenadores y horarios de clases.
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly planesService = inject(PlanesService);
  private readonly planesDb = toSignal(this.planesService.planes$, { initialValue: [] });

  protected readonly estadisticas = ESTADISTICAS;
  protected readonly servicios = SERVICIOS;
  protected readonly entrenadores = ENTRENADORES;
  protected readonly clases = CLASES;

  protected readonly planes = computed<PlanMembresia[]>(() => {
    const lista = this.planesDb();
    if (lista && lista.length > 0) {
      return lista.map((p, idx) => {
        let periodo = 'mensual';
        if (p.duracion >= 365) periodo = 'anual (365 días)';
        else if (p.duracion >= 180) periodo = 'semestral (180 días)';
        else if (p.duracion >= 90) periodo = 'trimestral (90 días)';
        else periodo = `mensual (${p.duracion} días)`;

        return {
          nombre: p.nombre,
          precio: p.precio,
          periodo,
          descripcion: p.descripcion || `Acceso completo a las instalaciones por ${p.duracion} días.`,
          beneficios:
            p.beneficios && p.beneficios.length > 0
              ? p.beneficios
              : ['Acceso a musculación y peso libre', 'Cardio libre', 'Control de asistencia digital'],
          destacado: idx === 1 || p.nombre.toLowerCase().includes('trimestral'),
        };
      });
    }
    return PLANES;
  });

  protected readonly ventajas = [
    'Instalaciones de 900 m² con equipo de última generación',
    'Control de acceso y asistencia con carné digital',
    'Entrenadores certificados asignados a cada socio',
    'Reportes de progreso disponibles desde tu cuenta',
  ];
}
