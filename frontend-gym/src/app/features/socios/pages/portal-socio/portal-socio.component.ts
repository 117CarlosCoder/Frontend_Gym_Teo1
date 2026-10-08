import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { SociosService } from '../../services/socios.service';
import { SocioPortalDTO } from '../../models/socio-portal-dto.model';
import { AuthService } from '../../../../core/services/auth.service';
import {
  DIAS_AVISO_VENCIMIENTO,
  MiMembresia,
  VencimientosService,
} from '../../../membresias/services/vencimientos.service';
import { HistorialPagosComponent } from '../../../pagos/components/historial-pagos/historial-pagos.component';

export interface AvisoVencimiento {
  nivel: 'peligro' | 'aviso';
  titulo: string;
  detalle: string;
}

/** Arma el aviso de vencimiento que ve el socio al entrar al portal (M5). */
export function construirAviso(membresia: MiMembresia | null, diasAviso = DIAS_AVISO_VENCIMIENTO): AvisoVencimiento | null {
  if (!membresia) return null;
  const dias = membresia.diasRestantes;
  if (dias < 0) {
    return {
      nivel: 'peligro',
      titulo: 'Tu membresía está vencida',
      detalle: `Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}. Acércate a recepción para renovarla y seguir entrenando.`,
    };
  }
  if (dias === 0) {
    return {
      nivel: 'peligro',
      titulo: 'Tu membresía vence hoy',
      detalle: 'Renueva hoy en recepción para no perder el acceso al gimnasio.',
    };
  }
  if (dias <= diasAviso) {
    return {
      nivel: 'aviso',
      titulo: `Tu membresía vence en ${dias} ${dias === 1 ? 'día' : 'días'}`,
      detalle: 'Renueva antes de la fecha de vencimiento para no perder el acceso.',
    };
  }
  return null;
}

@Component({
  selector: 'app-portal-socio',
  imports: [DatePipe, HistorialPagosComponent],
  templateUrl: './portal-socio.component.html',
  styleUrl: './portal-socio.component.css',
})
export class PortalSocioComponent implements OnInit {

  private readonly socioService = inject(SociosService);
  private readonly vencimientosService = inject(VencimientosService);
  private readonly auth = inject(AuthService);

  protected readonly datosSocio = signal<SocioPortalDTO | null>(null);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  /** Membresía activa real del socio (M5); null si no tiene o no se pudo consultar. */
  protected readonly miMembresia = signal<MiMembresia | null>(null);
  protected readonly avisoCerrado = signal(false);
  protected readonly aviso = computed(() => construirAviso(this.miMembresia()));
  protected readonly idSocio = computed(() => this.auth.usuario()?.id ?? 0);

  ngOnInit(): void {
    this.cargarDatos();
    this.vencimientosService.miMembresiaActiva().subscribe({
      next: (membresia) => this.miMembresia.set(membresia),
      // Sin membresía activa el backend responde error; en ese caso simplemente no hay aviso.
      error: () => this.miMembresia.set(null),
    });
  }

  protected cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.socioService.getSocio().subscribe({
      next: (datos) => {
        this.datosSocio.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los datos. Intente nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  protected calcularDuracion(entrada: string, salida: string): string {
    const [hEntrada, mEntrada] = entrada.split(':').map(Number);
    const [hSalida, mSalida] = salida.split(':').map(Number);
    let minutos = (hSalida * 60 + mSalida) - (hEntrada * 60 + mEntrada);
    if (minutos < 0) {
      minutos += 24 * 60; // por si cruza medianoche
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  }

}
