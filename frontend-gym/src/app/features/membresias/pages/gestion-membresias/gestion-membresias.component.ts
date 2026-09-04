import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { SociosService } from '../../../socios/services/socios.service';
import { MembresiasService } from '../../services/membresias.service';
import { AuditoriaMembresia, EstadoMembresia, Membresia, MembresiaFormulario, PlanMembresia } from '../../models/membresia.model';
import { Sucursal } from '../../../../core/models/sucursal.model';

@Component({
  selector: 'app-gestion-membresias',
  imports: [FormsModule, NgClass, DatePipe, DecimalPipe],
  templateUrl: './gestion-membresias.component.html',
  styleUrl: './gestion-membresias.component.css',
})
export class GestionMembresiasComponent implements OnInit {
  private readonly membresiasService = inject(MembresiasService);
  private readonly sociosService = inject(SociosService);
  protected readonly auth = inject(AuthService);

  protected readonly membresias = signal<Membresia[]>([]);
  protected readonly socios = signal<Array<{ id_socio: number; usuario: { nombre: string; apellido: string } }>>([]);
  protected readonly planes = signal<PlanMembresia[]>([]);
  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly auditoria = signal<AuditoriaMembresia[]>([]);
  protected readonly busqueda = signal('');
  protected readonly vista = signal<'membresias' | 'auditoria' | 'sucursales'>('membresias');
  protected readonly formularioAbierto = signal(false);
  protected readonly editando = signal<Membresia | null>(null);
  protected readonly mensaje = signal('');
  protected readonly error = signal('');

  protected formulario: MembresiaFormulario = this.formularioVacio();

  protected readonly filtradas = computed(() => {
    const query = this.busqueda().toLowerCase().trim();
    return this.membresias().filter((item) => !item.eliminado && (!query || `${item.nombreSocio} ${item.idSocio} ${item.plan.tipo}`.toLowerCase().includes(query)));
  });

  protected readonly activas = computed(() => this.membresias().filter((item) => item.estado === 'ACTIVA' && !item.eliminado).length);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.membresiasService.getMembresias().subscribe((items) => this.membresias.set(items));
    this.membresiasService.getPlanes().subscribe((items) => this.planes.set(items));
    this.membresiasService.getSucursales().subscribe((items) => this.sucursales.set(items));
    this.membresiasService.getAuditoria().subscribe((items) => this.auditoria.set(items));
    this.sociosService.getSocios().subscribe((items) => this.socios.set(items.map((item) => ({ id_socio: item.id_socio, usuario: item.usuario }))));
  }

  protected nueva(): void {
    this.editando.set(null);
    this.formulario = this.formularioVacio();
    this.error.set('');
    this.formularioAbierto.set(true);
  }

  protected editar(membresia: Membresia): void {
    this.editando.set(membresia);
    this.formulario = {
      idSocio: membresia.idSocio, nombreSocio: membresia.nombreSocio, idPlan: membresia.plan.idPlan,
      fechaInicio: membresia.fechaInicio, fechaFin: membresia.fechaFin, precio: membresia.precio,
      estado: membresia.estado, descripcionEstado: membresia.descripcionEstado,
      idsSucursales: membresia.sucursales.map((item) => item.idSucursal), motivoCancelacion: membresia.motivoCancelacion ?? '',
    };
    this.error.set('');
    this.formularioAbierto.set(true);
  }

  protected guardar(): void {
    this.error.set('');
    try {
      const operacion = this.editando()
        ? this.membresiasService.actualizar(this.editando()!.idMembresia, this.formulario, this.planes(), this.sucursales())
        : this.membresiasService.crear(this.formulario, this.planes(), this.sucursales());
      operacion.subscribe({ next: () => { this.formularioAbierto.set(false); this.mensaje.set('Cambios guardados y auditados.'); this.cargar(); } });
    } catch (exception) {
      this.error.set(exception instanceof Error ? exception.message : 'No fue posible guardar la membresía.');
    }
  }

  protected cancelarFormulario(): void { this.formularioAbierto.set(false); }

  protected cambiarSocio(idSocio: number): void {
    const socio = this.socios().find((item) => item.id_socio === Number(idSocio));
    this.formulario.idSocio = Number(idSocio);
    this.formulario.nombreSocio = socio ? `${socio.usuario.nombre} ${socio.usuario.apellido}` : '';
  }

  protected alternarSucursal(idSucursal: number): void {
    const ids = this.formulario.idsSucursales;
    this.formulario.idsSucursales = ids.includes(idSucursal) ? ids.filter((id) => id !== idSucursal) : [...ids, idSucursal];
  }

  protected desactivarSucursal(sucursal: Sucursal): void {
    if (!this.auth.tieneRol('ADMIN')) return;
    this.membresiasService.desactivarSucursal(sucursal.idSucursal).subscribe(() => { this.mensaje.set('Sucursal desactivada.'); this.cargar(); });
  }

  protected estiloEstado(estado: EstadoMembresia): string { return `estado--${estado.toLowerCase()}`; }
  protected nombrePlan(idPlan: number): string { return this.planes().find((item) => item.idPlan === idPlan)?.tipo ?? ''; }
  protected actualizarBusqueda(event: Event): void { this.busqueda.set((event.target as HTMLInputElement).value); }
  protected seleccionarVista(vista: 'membresias' | 'auditoria' | 'sucursales'): void { this.vista.set(vista); this.mensaje.set(''); }

  private formularioVacio(): MembresiaFormulario {
    const inicio = new Date().toISOString().slice(0, 10);
    return { idSocio: 0, nombreSocio: '', idPlan: 0, fechaInicio: inicio, fechaFin: inicio, precio: 0, estado: 'ACTIVA', descripcionEstado: 'Membresía vigente', idsSucursales: [], motivoCancelacion: '' };
  }
}