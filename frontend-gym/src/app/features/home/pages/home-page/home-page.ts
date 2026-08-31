import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CLASES, ENTRENADORES, ESTADISTICAS, PLANES, SERVICIOS } from '../../data/home-content';

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
  protected readonly estadisticas = ESTADISTICAS;
  protected readonly servicios = SERVICIOS;
  protected readonly planes = PLANES;
  protected readonly entrenadores = ENTRENADORES;
  protected readonly clases = CLASES;

  protected readonly ventajas = [
    'Instalaciones de 900 m² con equipo de última generación',
    'Control de acceso y asistencia con carné digital',
    'Entrenadores certificados asignados a cada socio',
    'Reportes de progreso disponibles desde tu cuenta',
  ];
}
