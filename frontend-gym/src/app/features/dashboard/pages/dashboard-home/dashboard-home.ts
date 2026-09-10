import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ETIQUETA_ROL } from '../../../../core/models/usuario.model';
import { AuthService } from '../../../../core/services/auth.service';
import { SociosService } from '../../../socios/services/socios.service';
import { PlanesService } from '../../../planes/services/planes.service';
import { AsistenciaService } from '../../../asistencia/services/asistencia.service';
import { AsistenciaRegistro } from '../../../asistencia/models/asistencia.model';
import { RUTAS } from '../../../../core/constants/rutas.constants';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
})
export class DashboardHome {
  private readonly auth = inject(AuthService);
  private readonly sociosService = inject(SociosService);
  private readonly planesService = inject(PlanesService);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly RUTAS = RUTAS;
  protected readonly usuario = this.auth.usuario;

  // Roles verificables (M1)
  readonly esAdmin = computed(() => this.auth.tieneRol('ADMIN'));
  readonly esRecepcionista = computed(() =>
    this.auth.tieneRol('RECEPCIONISTA', 'RECEPCION')
  );

  protected readonly saludo = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return 'Bienvenido';
    const rol = ETIQUETA_ROL[usuario.rol];
    return `Hola, ${usuario.nombre} · ${rol}`;
  });

  // Datos reactivos de servicios
  readonly socios = toSignal(this.sociosService.socios$, { initialValue: [] });
  readonly planes = toSignal(this.planesService.planes$, { initialValue: [] });

  // Asistencias en vivo para recepción
  readonly asistencias = signal<AsistenciaRegistro[]>([]);
  readonly mensajeAsistencia = signal<string | null>(null);
  readonly errorAsistencia = signal<string | null>(null);

  // Formulario rápido de recepción para marcar entrada
  formMarcaje: FormGroup = this.fb.group({
    idSocio: ['', [Validators.required]],
  });

  // Socio seleccionado en el marcaje para alertas (si es moroso o inactivo)
  readonly socioMarcajeSeleccionado = computed(() => {
    const id = Number(this.formMarcaje.get('idSocio')?.value);
    if (!id) return null;
    return this.socios().find((s) => s.id_socio === id) || null;
  });

  // Indicadores calculados en tiempo real
  readonly metricas = computed(() => {
    const lista = this.socios();
    const planesLista = this.planes();
    const activos = lista.filter((s) => s.estado === 'ACTIVO').length;
    const morosos = lista.filter((s) => s.estado === 'MOROSO').length;
    const inactivos = lista.filter((s) => s.estado === 'INACTIVO').length;

    return {
      totalSocios: lista.length,
      sociosActivos: activos,
      sociosMorosos: morosos,
      sociosInactivos: inactivos,
      totalPlanes: planesLista.length,
      asistenciasHoy: this.asistencias().length,
    };
  });

  constructor() {
    // Cargar asistencias de hoy (sucursal 1 por defecto)
    this.asistenciaService.getAsistenciasHoy(1).subscribe({
      next: (registros) => this.asistencias.set(registros),
    });
  }

  // --- Operaciones de Recepción en el Dashboard ---
  registrarMarcajeRapido(): void {
    if (this.formMarcaje.invalid) {
      this.formMarcaje.markAllAsTouched();
      return;
    }

    const socioId = Number(this.formMarcaje.get('idSocio')?.value);
    const socio = this.socios().find((s) => s.id_socio === socioId);
    if (!socio) return;

    if (socio.estado === 'MOROSO') {
      this.errorAsistencia.set(
        `⚠️ ADVERTENCIA: El socio ${socio.usuario.nombre} ${socio.usuario.apellido} está en estado MOROSO. Favor regularizar su suscripción en recepción.`
      );
    } else if (socio.estado === 'INACTIVO') {
      this.errorAsistencia.set(
        `⚠️ ADVERTENCIA: El socio ${socio.usuario.nombre} está INACTIVO (sin membresía vigente).`
      );
    } else {
      this.errorAsistencia.set(null);
    }

    this.asistenciaService
      .registrarEntrada({
        idSocio: socioId,
        idSucursal: 1,
        tipo: 'ENTRADA',
      })
      .subscribe({
        next: (registro) => {
          this.asistencias.update((prev) => [registro, ...prev]);
          this.mensajeAsistencia.set(
            `✓ Entrada registrada para ${registro.nombreSocio} ${registro.apellidoSocio} a las ${registro.horaEntrada}.`
          );
          this.formMarcaje.reset({ idSocio: '' });
          setTimeout(() => this.mensajeAsistencia.set(null), 4000);
        },
      });
  }

  registrarSalidaRapida(idAsistencia: number): void {
    this.asistenciaService.registrarSalida(idAsistencia).subscribe({
      next: (actualizada) => {
        this.asistencias.update((prev) =>
          prev.map((a) => (a.idAsistencia === idAsistencia ? actualizada : a))
        );
        this.mensajeAsistencia.set(
          `✓ Salida registrada para ${actualizada.nombreSocio} a las ${actualizada.horaSalida}.`
        );
        setTimeout(() => this.mensajeAsistencia.set(null), 4000);
      },
    });
  }

  navegarA(ruta: string): void {
    this.router.navigateByUrl(ruta);
  }
}
