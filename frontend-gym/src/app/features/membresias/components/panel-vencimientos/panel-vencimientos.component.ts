import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RUTAS } from '../../../../core/constants/rutas.constants';
import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';
import { MembresiaPorVencer, VencimientosService } from '../../services/vencimientos.service';

/** Panel para recepción y administración con las membresías próximas a vencer (M5). */
@Component({
  selector: 'app-panel-vencimientos',
  imports: [DatePipe, NgClass, RouterLink],
  templateUrl: './panel-vencimientos.component.html',
  styleUrl: './panel-vencimientos.component.css',
})
export class PanelVencimientosComponent implements OnInit {
  private readonly vencimientosService = inject(VencimientosService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly RUTAS = RUTAS;
  protected readonly opcionesDias = [7, 15, 30];
  protected readonly dias = signal(7);
  protected readonly membresias = signal<MembresiaPorVencer[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal<number | null>(null);
  protected readonly enviados = signal<ReadonlySet<number>>(new Set());

  protected readonly urgentes = computed(() => this.membresias().filter((m) => m.diasRestantes <= 3).length);

  ngOnInit(): void {
    this.cargar();
  }

  protected cambiarDias(dias: number): void {
    this.dias.set(dias);
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.vencimientosService.proximasAVencer(this.dias()).subscribe({
      next: (lista) => {
        this.membresias.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.membresias.set([]);
        this.error.set(mensajeDeError(err, 'No se pudieron consultar las membresías por vencer.'));
        this.cargando.set(false);
      },
    });
  }

  protected enviarRecordatorio(membresia: MembresiaPorVencer): void {
    this.enviando.set(membresia.idMembresia);
    this.vencimientosService.enviarRecordatorio(membresia.idMembresia).subscribe({
      next: () => {
        this.enviando.set(null);
        this.enviados.update((set) => new Set(set).add(membresia.idMembresia));
        this.notificacion.exito(`Recordatorio enviado a ${membresia.nombreSocio} (${membresia.correo}).`);
      },
      error: (err) => {
        this.enviando.set(null);
        this.notificacion.error(mensajeDeError(err, `No se pudo enviar el recordatorio a ${membresia.nombreSocio}.`));
      },
    });
  }

  protected claseDias(dias: number): string {
    if (dias <= 0) return 'bg-danger';
    if (dias <= 3) return 'bg-warning text-dark';
    return 'bg-info text-dark';
  }

  protected textoDias(dias: number): string {
    if (dias <= 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `En ${dias} días`;
  }
}
