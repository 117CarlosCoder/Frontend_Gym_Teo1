import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { RUTAS } from '../../../core/constants/rutas.constants';

interface EnlaceNav {
  etiqueta: string;
  ancla: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuAbierto = signal(false);

  protected readonly enlaces: EnlaceNav[] = [
    { etiqueta: 'Inicio', ancla: 'inicio' },
    { etiqueta: 'Nosotros', ancla: 'nosotros' },
    { etiqueta: 'Servicios', ancla: 'servicios' },
    { etiqueta: 'Planes', ancla: 'planes' },
    { etiqueta: 'Entrenadores', ancla: 'entrenadores' },
    { etiqueta: 'Contacto', ancla: 'contacto' },
  ];

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  private rutaPorRol(): string {
    return this.auth.rol() === 'SOCIO' ? RUTAS.dashboard.portalSocio : RUTAS.dashboard.default;
  }

  protected ingresarPortal(): void {
    this.cerrarMenu();
    this.router.navigateByUrl(this.rutaPorRol());
  }
}
