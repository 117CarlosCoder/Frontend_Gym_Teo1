import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { RegistroAsistenciaComponent } from './registro-asistencia.component';
import { AsistenciaService } from '../../services/asistencia.service';

describe('RegistroAsistenciaComponent', () => {
  let component: RegistroAsistenciaComponent;
  let fixture: ComponentFixture<RegistroAsistenciaComponent>;
  let mockAsistenciaService: any;

  beforeEach(async () => {
    mockAsistenciaService = {
      getSucursales: () => of([{ idSucursal: 1, nombre: 'Central', direccion: 'Zona 1' }]),
      getSociosParaAsistencia: () =>
        of([
          {
            idSocio: 1,
            nombre: 'Carlos',
            apellido: 'Gomez',
            estadoMembresia: 'ACTIVA',
            tipoPlan: 'Plan Mensual',
          },
          {
            idSocio: 2,
            nombre: 'Maria',
            apellido: 'Lopez',
            estadoMembresia: 'VENCIDA',
            tipoPlan: 'Plan Anual',
          },
        ]),
      getAsistenciasHoy: () => of([]),
      registrarEntrada: vi.fn().mockReturnValue(
        of({
          idAsistencia: 101,
          idSocio: 1,
          nombreSocio: 'Carlos',
          apellidoSocio: 'Gomez',
          sucursal: 'Central',
          fecha: '2026-10-15',
          horaEntrada: '09:00:00',
          horaSalida: null,
          registradoPor: 'Recepción',
        })
      ),
      registrarSalida: vi.fn().mockReturnValue(
        of({
          idAsistencia: 101,
          idSocio: 1,
          nombreSocio: 'Carlos',
          apellidoSocio: 'Gomez',
          sucursal: 'Central',
          fecha: '2026-10-15',
          horaEntrada: '09:00:00',
          horaSalida: '10:30:00',
          registradoPor: 'Recepción',
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [RegistroAsistenciaComponent],
      providers: [
        provideRouter([]),
        { provide: AsistenciaService, useValue: mockAsistenciaService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroAsistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe permitir registrar acceso rápido de un socio activo y mostrar banner de acceso autorizado', () => {
    (component as any).idSocioRapido.set('1');
    (component as any).registrarEntradaRapida();

    expect(mockAsistenciaService.registrarEntrada).toHaveBeenCalledWith({
      idSocio: 1,
      idSucursal: 1,
      tipo: 'ENTRADA',
    });

    const autorizado = (component as any).accesoAutorizado();
    expect(autorizado).toBeTruthy();
    expect(autorizado?.idSocio).toBe(1);
    expect(autorizado?.socio).toBe('Carlos Gomez');
    expect((component as any).accesoBloqueado()).toBeNull();
  });

  it('debe bloquear el acceso y mostrar alerta roja si la membresía está inactiva o vencida', () => {
    mockAsistenciaService.registrarEntrada.mockReturnValue(
      throwError(() => new Error('El socio ID 2 no cuenta con una membresía activa y vigente'))
    );

    (component as any).registrarEntrada(2);

    const bloqueado = (component as any).accesoBloqueado();
    expect(bloqueado).toBeTruthy();
    expect(bloqueado?.idSocio).toBe(2);
    expect(bloqueado?.socio).toBe('Maria Lopez');
    expect(bloqueado?.motivo).toContain('El socio ID 2 no cuenta con una membresía activa y vigente');
    expect((component as any).accesoAutorizado()).toBeNull();
  });

  it('debe filtrar socios por nombre o ID', () => {
    (component as any).query.set('Maria');
    expect((component as any).sociosFiltrados().length).toBe(1);
    expect((component as any).sociosFiltrados()[0].nombre).toBe('Maria');

    (component as any).query.set('1');
    expect((component as any).sociosFiltrados().length).toBe(1);
    expect((component as any).sociosFiltrados()[0].idSocio).toBe(1);
  });
});

