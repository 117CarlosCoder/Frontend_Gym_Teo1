import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

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
}
