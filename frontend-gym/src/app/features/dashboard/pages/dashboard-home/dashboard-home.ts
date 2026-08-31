import { Component, computed, inject } from '@angular/core';

import { ETIQUETA_ROL } from '../../../../core/models/usuario.model';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Página de aterrizaje tras el login. Es el punto de partida del área
 * privada; los módulos de socios, membresías y clases se agregan en los
 * siguientes sprints.
 */
@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome {
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.usuario;

  protected readonly saludo = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return 'Hola';
    const rol = ETIQUETA_ROL[usuario.rol];
    return `Hola, ${usuario.nombre} · ${rol}`;
  });

  protected readonly indicadores = [
    { etiqueta: 'Socios activos', valor: '512', detalle: '+18 este mes' },
    { etiqueta: 'Membresías por vencer', valor: '37', detalle: 'Próximos 7 días' },
    { etiqueta: 'Asistencias de hoy', valor: '148', detalle: 'Hasta las 18:00' },
    { etiqueta: 'Clases programadas', valor: '25', detalle: 'Esta semana' },
  ];

  protected readonly pendientes = [
    'Módulo de socios (alta, baja y búsqueda)',
    'Gestión de membresías e inscripciones',
    'Registro de asistencia por carné',
    'Reportes y KPIs para administración',
  ];
}
