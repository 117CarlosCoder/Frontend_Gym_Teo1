import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { RUTAS } from '../../core/constants/rutas.constants';
import { ETIQUETA_ROL } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';

/** Envoltura de las páginas privadas (área de administración del gimnasio). */
@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly nombreCompleto = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
  });

  protected readonly etiquetaRol = computed(() => {
    const rol = this.auth.rol();
    return rol ? ETIQUETA_ROL[rol] : '';
  });

  protected readonly iniciales = computed(() => {
    const usuario = this.auth.usuario();
    if (!usuario) return '';
    return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
  });

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate([RUTAS.inicio]);
  }
}
