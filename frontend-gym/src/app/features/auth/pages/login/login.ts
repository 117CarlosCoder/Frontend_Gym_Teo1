import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../../../../environments/environment';
import { RUTAS } from '../../../../core/constants/rutas.constants';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly redirigir = input<string>();

  protected readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly cargando = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly mostrarPassword = signal(false);

  protected readonly modoDemo = environment.useMockAuth;
  protected readonly usuariosDemo = [
    { rol: 'Administrador', correo: 'admin@claudelovers.com', password: 'admin123' },
    { rol: 'Recepción', correo: 'recepcion@claudelovers.com', password: 'recepcion123' },
    { rol: 'Socio', correo: 'socio@claudelovers.com', password: 'socio123' },
  ];

  protected get correo() {
    return this.formulario.controls.correo;
  }

  protected get password() {
    return this.formulario.controls.password;
  }

  protected alternarPassword(): void {
    this.mostrarPassword.update((visible) => !visible);
  }

  protected enviar(): void {
    this.errorServidor.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.formulario.disable();

    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigateByUrl(this.redirigir() ?? this.rutaPorRol());
      },
      error: (error: Error) => {
        this.cargando.set(false);
        this.formulario.enable();
        this.errorServidor.set(error.message || 'No se pudo iniciar sesión.');
      },
    });
  }

  private rutaPorRol(): string {
    return this.auth.rol() === 'SOCIO' ? RUTAS.dashboard.portalSocio : RUTAS.dashboard.default;
  }

  /** Rellena el formulario con un usuario de prueba (solo modo demo). */
  protected usarDemo(correo: string, password: string): void {
    this.formulario.setValue({ correo, password });
  }
}
