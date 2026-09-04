import { Component, inject, OnInit, signal } from '@angular/core';
import { SociosService } from '../../services/socios.service';
import { SocioPortalDTO } from '../../models/socio-portal-dto.model';

@Component({
  selector: 'app-portal-socio',
  imports: [],
  templateUrl: './portal-socio.component.html',
  styleUrl: './portal-socio.component.css',
})
export class PortalSocioComponent implements OnInit {

  private readonly socioService = inject(SociosService);

  protected readonly datosSocio = signal<SocioPortalDTO | null>(null);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDatos();
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
