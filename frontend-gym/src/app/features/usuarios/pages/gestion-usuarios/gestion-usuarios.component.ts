import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import {
  CreateUserDto,
  ETIQUETA_ROL,
  RolDto,
  RolUsuario,
  UpdateUserAdminDto,
  UserResponseDto,
} from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css',
})
export class GestionUsuariosComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly fb = inject(FormBuilder);

  // Estados reactivos con Signals
  readonly usuarios = signal<UserResponseDto[]>([]);
  readonly roles = signal<RolDto[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly exitoMensaje = signal<string | null>(null);
  readonly credencialTemporal = signal<string | null>(null);

  // Filtros
  readonly filtroRol = signal<string>('TODOS');
  readonly terminoBusqueda = signal<string>('');

  // Modales
  readonly modalCrearAbierto = signal<boolean>(false);
  readonly modalEditarAbierto = signal<boolean>(false);
  readonly modalDesactivarAbierto = signal<boolean>(false);

  readonly usuarioSeleccionado = signal<UserResponseDto | null>(null);

  // Formularios reactivos
  formCrear!: FormGroup;
  formEditar!: FormGroup;

  // Lista filtrada
  readonly usuariosFiltrados = computed(() => {
    let lista = this.usuarios();
    const rol = this.filtroRol();
    const termino = this.terminoBusqueda().trim().toLowerCase();

    if (rol !== 'TODOS') {
      lista = lista.filter((u) => u.rol.toUpperCase() === rol.toUpperCase());
    }

    if (termino) {
      lista = lista.filter((u) => {
        const fullName = `${u.nombres} ${u.apellidos}`.toLowerCase();
        const dpi = (u.dpi || '').toLowerCase();
        const correo = (u.correo || '').toLowerCase();
        const telefono = (u.telefono || '').toLowerCase();
        return fullName.includes(termino) || dpi.includes(termino) || correo.includes(termino) || telefono.includes(termino);
      });
    }

    return lista;
  });

  // Estadísticas rápidas
  readonly totalUsuarios = computed(() => this.usuarios().length);
  readonly totalActivos = computed(() => this.usuarios().filter((u) => u.estado).length);
  readonly totalInactivos = computed(() => this.usuarios().filter((u) => !u.estado).length);

  ngOnInit(): void {
    this.initForms();
    this.cargarDatos();
  }

  private initForms(): void {
    this.formCrear = this.fb.group({
      dpi: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(20), Validators.pattern('^[0-9]+$')]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.pattern('^[0-9+ -]{8,15}$')]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['RECEPCIONISTA', [Validators.required]],
    });

    this.formEditar = this.fb.group({
      dpi: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(20), Validators.pattern('^[0-9]+$')]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.pattern('^[0-9+ -]{8,15}$')]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['RECEPCIONISTA', [Validators.required]],
      estado: [true, [Validators.required]],
      contrasenia: ['', [Validators.minLength(6)]],
    });
  }


  cargarDatos(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMensaje.set(err?.error?.message || 'No se pudo cargar la lista de usuarios.');
        this.cargando.set(false);
      },
    });

    this.usuariosService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => {
        // Roles fallback
        this.roles.set([
          { id: 1, nombre: 'ADMIN', descripcion: 'Administrador' },
          { id: 2, nombre: 'RECEPCIONISTA', descripcion: 'Recepción' },
          { id: 3, nombre: 'ENTRENADOR', descripcion: 'Entrenador' },
          { id: 4, nombre: 'CLIENTE', descripcion: 'Cliente / Socio' },
        ]);
      },
    });
  }

  cambiarFiltroRol(rol: string): void {
    this.filtroRol.set(rol);
  }

  onBuscar(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.terminoBusqueda.set(target.value);
  }

  // --- Modal Crear ---
  abrirModalCrear(): void {
    this.formCrear.reset({ rol: 'RECEPCIONISTA' });
    this.credencialTemporal.set(null);
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrearAbierto.set(false);
    this.formCrear.reset();
  }

  guardarNuevoUsuario(): void {
    if (this.formCrear.invalid) {
      this.formCrear.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.exitoMensaje.set(null);

    const val = this.formCrear.value;
    const dto: CreateUserDto = {
      dpi: (val.dpi || '').trim(),
      nombres: (val.nombres || '').trim(),
      apellidos: (val.apellidos || '').trim(),
      telefono: val.telefono ? val.telefono.trim() : undefined,
      correo: (val.correo || '').trim(),
      rol: val.rol,
    };

    this.usuariosService.crearUsuario(dto).subscribe({
      next: (creado) => {
        this.cargando.set(false);
        this.modalCrearAbierto.set(false);
        this.exitoMensaje.set(`Usuario "${creado.nombres} ${creado.apellidos}" creado con éxito.`);
        if (creado.contraseniaTemporal) {
          this.credencialTemporal.set(creado.contraseniaTemporal);
        }
        this.cargarDatos();
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err?.error?.message || 'Error al registrar el usuario.');
      },
    });
  }

  // --- Modal Editar ---
  abrirModalEditar(user: UserResponseDto): void {
    this.usuarioSeleccionado.set(user);
    this.formEditar.patchValue({
      dpi: user.dpi,
      nombres: user.nombres,
      apellidos: user.apellidos,
      telefono: user.telefono || '',
      correo: user.correo,
      rol: user.rol,
      estado: user.estado,
      contrasenia: '',
    });
    this.modalEditarAbierto.set(true);
  }

  cerrarModalEditar(): void {
    this.modalEditarAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  guardarEdicionUsuario(): void {
    const user = this.usuarioSeleccionado();
    if (!user || this.formEditar.invalid) {
      this.formEditar.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const formVal = this.formEditar.value;
    const dto: UpdateUserAdminDto = {
      dpi: formVal.dpi ? formVal.dpi.trim() : undefined,
      nombres: formVal.nombres.trim(),
      apellidos: formVal.apellidos.trim(),
      telefono: formVal.telefono ? formVal.telefono.trim() : undefined,
      correo: formVal.correo.trim(),
      rol: formVal.rol,
      estado: formVal.estado,
      contrasenia: formVal.contrasenia && formVal.contrasenia.trim().length >= 6 ? formVal.contrasenia.trim() : undefined,
    };


    this.usuariosService.actualizarUsuarioAdmin(user.id, dto).subscribe({
      next: () => {
        this.cargando.set(false);
        this.modalEditarAbierto.set(false);
        this.exitoMensaje.set(`Usuario actualizado correctamente.`);
        this.cargarDatos();
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err?.error?.message || 'Error al actualizar usuario.');
      },
    });
  }

  // --- Desactivar ---
  abrirModalDesactivar(user: UserResponseDto): void {
    this.usuarioSeleccionado.set(user);
    this.modalDesactivarAbierto.set(true);
  }

  cerrarModalDesactivar(): void {
    this.modalDesactivarAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  confirmarDesactivar(): void {
    const user = this.usuarioSeleccionado();
    if (!user) return;

    this.cargando.set(true);
    this.usuariosService.desactivarUsuario(user.id).subscribe({
      next: () => {
        this.cargando.set(false);
        this.modalDesactivarAbierto.set(false);
        this.exitoMensaje.set(`Usuario "${user.nombres} ${user.apellidos}" desactivado.`);
        this.cargarDatos();
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err?.error?.message || 'Error al desactivar el usuario.');
      },
    });
  }

  copiarContrasenia(texto: string): void {
    navigator.clipboard.writeText(texto);
    alert('Contraseña temporal copiada al portapapeles.');
  }

  getNombreRol(rolKey: string): string {
    return ETIQUETA_ROL[rolKey as RolUsuario] || rolKey;
  }
}

