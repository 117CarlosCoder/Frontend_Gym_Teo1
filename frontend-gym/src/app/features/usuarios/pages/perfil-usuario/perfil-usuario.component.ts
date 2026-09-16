import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { UpdateProfileDto, UserResponseDto } from '../../../../core/models/usuario.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil-usuario.component.html',
  styleUrl: './perfil-usuario.component.css',
})
export class PerfilUsuarioComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly usuario = signal<UserResponseDto | null>(null);
  readonly cargando = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);
  readonly exitoMensaje = signal<string | null>(null);
  readonly errorMensaje = signal<string | null>(null);

  formDatos!: FormGroup;
  formPassword!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.cargarPerfil();
  }

  private initForms(): void {
    this.formDatos = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern('^[0-9+ -]{8,15}$')]],
    });

    this.formPassword = this.fb.group({
      contraseniaActual: ['', [Validators.required]],
      nuevaContrasenia: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasenia: ['', [Validators.required]],
    });
  }

  cargarPerfil(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.usuariosService.getMiPerfil().subscribe({
      next: (dto) => {
        this.usuario.set(dto);
        this.formDatos.patchValue({
          nombres: dto.nombres,
          apellidos: dto.apellidos,
          correo: dto.correo,
          telefono: dto.telefono || '',
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMensaje.set(err?.error?.message || 'No se pudo cargar el perfil del usuario.');
        this.cargando.set(false);
      },
    });
  }

  guardarDatosPersonales(): void {
    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.exitoMensaje.set(null);
    this.errorMensaje.set(null);

    const formVal = this.formDatos.value;
    const dto: UpdateProfileDto = {
      nombres: formVal.nombres?.trim(),
      apellidos: formVal.apellidos?.trim(),
      correo: formVal.correo?.trim().toLowerCase(),
      telefono: formVal.telefono?.trim() || undefined,
    };

    this.usuariosService.actualizarMiPerfil(dto).subscribe({
      next: (actualizado) => {
        this.usuario.set(actualizado);
        this.guardando.set(false);
        this.exitoMensaje.set('Tus datos personales se han actualizado correctamente.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || 'Error al actualizar tus datos.');
      },
    });
  }

  cambiarContrasenia(): void {
    if (this.formPassword.invalid) {
      this.formPassword.markAllAsTouched();
      return;
    }

    const { contraseniaActual, nuevaContrasenia, confirmarContrasenia } = this.formPassword.value;

    if (nuevaContrasenia !== confirmarContrasenia) {
      this.errorMensaje.set('Las contraseñas nuevas no coinciden.');
      return;
    }

    this.guardando.set(true);
    this.exitoMensaje.set(null);
    this.errorMensaje.set(null);

    const dto: UpdateProfileDto = {
      contraseniaActual,
      nuevaContrasenia,
    };

    this.usuariosService.actualizarMiPerfil(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.formPassword.reset();
        this.exitoMensaje.set('¡Tu contraseña ha sido cambiada exitosamente!');
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err?.error?.message || 'Error al cambiar la contraseña. Verifica tu clave actual.');
      },
    });
  }
}

