import { Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'app-socio-form',
  imports: [ReactiveFormsModule],
  templateUrl: './socio-form.component.html',
  styleUrl: './socio-form.component.css',
})
export class SocioFormComponent {

  // Entrada: modo del formulario ('self' = registro propio, 'receptionist' = registro por recepcionista)
  mode = input<'self' | 'receptionist'>('self');

  // Salida: emite los datos válidos del formulario
  formSubmit = output<any>();

  private fb = inject(FormBuilder);

  userForm!: FormGroup;

  protected readonly mostrarPassword = signal(false);

  constructor() {
    // Efecto reactivo: reconstruye el formulario cuando cambia el modo
    effect(() => {
      const currentMode = this.mode();
      this.buildForm(currentMode);
    });
  }

  private buildForm(mode: 'self' | 'receptionist'): void {
    // Campos base comunes a ambos modos
    const baseFields = {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,15}$/)]],
      dpi: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]]
    };

    if (mode === 'self') {
      // Añadir campos de username y contraseña con confirmación
      this.userForm = this.fb.nonNullable.group({
        ...baseFields,
        username: ['', [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9_]+$/)
        ]],
        password: ['', [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
        ]],
        confirmPassword: ['', Validators.required]
      }, {
        validators: this.passwordMatchValidator
      });
    } else {
      // Solo campos base para recepcionista
      this.userForm = this.fb.nonNullable.group(baseFields);
    }
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Getter para acceder a los controles en la plantilla
  protected get f() {
    return this.userForm.controls;
  }

  protected onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = { ...this.userForm.value };
    if (this.mode() === 'receptionist') {
      // Eliminar campos que no existen en modo recepcionista
      delete formValue.username;
      delete formValue.password;
      delete formValue.confirmPassword;
    } else {
      // Eliminar confirmPassword antes de enviar
      delete formValue.confirmPassword;
    }

    this.formSubmit.emit(formValue);
  }

  protected alternarPassword(): void {
    this.mostrarPassword.update((visible) => !visible);
  }

}
