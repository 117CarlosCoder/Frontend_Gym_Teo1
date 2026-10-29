import { DatePipe, DecimalPipe } from '@angular/common';
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
import { PagosService } from '../../../pagos/services/pagos.service';
import { Pago } from '../../../pagos/models/pago.model';
import { AsistenciaService } from '../../../asistencia/services/asistencia.service';
import { AsistenciaRegistro } from '../../../asistencia/models/asistencia.model';
import { formatearHora, formatearPermanencia } from '../../../asistencia/utils/grafico-asistencias';
import { NotificacionService, mensajeDeError } from '../../../../core/services/notificacion.service';

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
  imports: [DatePipe, DecimalPipe, HistorialPagosComponent],
  templateUrl: './portal-socio.component.html',
  styleUrl: './portal-socio.component.css',
})
export class PortalSocioComponent implements OnInit {

  private readonly socioService = inject(SociosService);
  private readonly vencimientosService = inject(VencimientosService);
  private readonly auth = inject(AuthService);
  private readonly pagosService = inject(PagosService);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly formatearHora = formatearHora;
  protected readonly formatearPermanencia = formatearPermanencia;

  /** Último pago del socio con su desglose (precio, descuento, recargo y total). */
  protected readonly ultimoPago = signal<Pago | null>(null);
  protected readonly descargandoComprobante = signal(false);

  /** Entradas y salidas reales del socio (GET /asistencias/me). */
  protected readonly misAsistencias = signal<AsistenciaRegistro[]>([]);
  protected readonly cargandoAsistencias = signal(true);
  protected readonly errorAsistencias = signal<string | null>(null);

  protected readonly datosSocio = signal<SocioPortalDTO | null>(null);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  /** Membresía activa real del socio (M5); null si no tiene o no se pudo consultar. */
  protected readonly miMembresia = signal<MiMembresia | null>(null);
  protected readonly avisoCerrado = signal(false);
  protected readonly aviso = computed(() => construirAviso(this.miMembresia()));
  protected readonly idSocio = computed(() => this.auth.usuario()?.id ?? 0);
  readonly mostrarCarne = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarDatos();
    this.vencimientosService.miMembresiaActiva().subscribe({
      next: (membresia) => this.miMembresia.set(membresia),
      // Sin membresía activa el backend responde error; en ese caso simplemente no hay aviso.
      error: () => this.miMembresia.set(null),
    });
    this.cargarUltimoPago();
    this.cargarMisAsistencias();
  }

  protected cargarUltimoPago(): void {
    const id = this.idSocio();
    if (!id) return;
    this.pagosService.historialPorSocio(id, 0, 1).subscribe({
      next: (pagina) => this.ultimoPago.set(pagina.content[0] ?? null),
      error: () => this.ultimoPago.set(null),
    });
  }

  protected cargarMisAsistencias(): void {
    this.cargandoAsistencias.set(true);
    this.errorAsistencias.set(null);
    this.asistenciaService.getMisAsistencias(20).subscribe({
      next: (lista) => {
        this.misAsistencias.set(lista);
        this.cargandoAsistencias.set(false);
      },
      error: (err) => {
        this.misAsistencias.set([]);
        this.errorAsistencias.set(mensajeDeError(err, 'No se pudo cargar tu historial de asistencias.'));
        this.cargandoAsistencias.set(false);
      },
    });
  }

  protected descargarComprobante(pago: Pago): void {
    this.descargandoComprobante.set(true);
    this.pagosService.descargarComprobante(pago.idComprobante).subscribe({
      next: (pdf) => {
        this.pagosService.guardarPdf(pdf, pago.idComprobante);
        this.descargandoComprobante.set(false);
      },
      error: (err) => {
        this.descargandoComprobante.set(false);
        this.notificacion.error(mensajeDeError(err, 'No se pudo descargar el comprobante.'));
      },
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
}
