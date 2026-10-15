import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { GestionPagosComponent } from './gestion-pagos.component';
import { PagosService } from '../../services/pagos.service';
import { SociosService } from '../../../socios/services/socios.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { MembresiaPagable, MetodoPago } from '../../models/pago.model';

describe('GestionPagosComponent - Curva del PO (Beneficios y Mora)', () => {
  let component: GestionPagosComponent;
  let fixture: ComponentFixture<GestionPagosComponent>;
  let mockPagosService: any;
  let mockSociosService: any;
  let mockNotificacionService: any;

  const mockMetodos: MetodoPago[] = [
    { id: 1, nombre: 'EFECTIVO' },
    { id: 2, nombre: 'TARJETA' },
  ];

  const mockMembresiaActiva: MembresiaPagable = {
    id: 10,
    nombrePlan: 'Plan Mensual',
    duracionDias: 30,
    precio: 200,
    fechaInicio: '2026-09-01',
    fechaVencimiento: '2026-12-01',
    estado: 'ACTIVA',
    activa: true,
  };

  const mockMembresiaVencida: MembresiaPagable = {
    id: 11,
    nombrePlan: 'Plan Trimestral',
    duracionDias: 90,
    precio: 500,
    fechaInicio: '2026-05-01',
    fechaVencimiento: '2026-08-01', // Vencida en el pasado
    estado: 'VENCIDA',
    activa: false,
  };

  beforeEach(async () => {
    mockPagosService = {
      listarMetodosPago: vi.fn().mockReturnValue(of(mockMetodos)),
      membresiasDeSocio: vi.fn().mockReturnValue(of([mockMembresiaActiva, mockMembresiaVencida])),
      registrar: vi.fn().mockReturnValue(
        of({
          idComprobante: 99,
          montoPagado: 195,
          nuevaFechaVencimiento: '2026-11-01',
          observacion: 'Plan: Plan Trimestral',
        })
      ),
      descargarComprobante: vi.fn().mockReturnValue(of(new Blob())),
      guardarPdf: vi.fn(),
    };

    mockSociosService = {
      socios$: of([
        {
          id_socio: 1,
          usuario: { nombre: 'Mario', apellido: 'Bros', dpi: '1234567890101', correo: 'mario@gym.gt' },
        },
      ]),
      getSocios: vi.fn().mockReturnValue(of([])),
    };

    mockNotificacionService = {
      exito: vi.fn(),
      error: vi.fn(),
      aviso: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GestionPagosComponent],
      providers: [
        { provide: PagosService, useValue: mockPagosService },
        { provide: SociosService, useValue: mockSociosService },
        { provide: NotificacionService, useValue: mockNotificacionService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionPagosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe calcular descuento correctamente según el beneficio de miembro seleccionado', () => {
    (component as any).membresias.set([mockMembresiaActiva]);
    (component as any).abrirModalPago(mockMembresiaActiva);

    // Sin beneficio (REGULAR): descuento 0, monto 200
    expect((component as any).descuentoMonto()).toBe(0);
    expect((component as any).montoSugeridoFinal()).toBe(200);

    // Cambiar a beneficio ESTUDIANTE (-15%)
    (component as any).formPago.controls.idBeneficio.setValue('ESTUDIANTE');
    expect((component as any).descuentoMonto()).toBe(30); // 15% de 200 = 30
    expect((component as any).montoSugeridoFinal()).toBe(170); // 200 - 30 = 170

    // Cambiar a beneficio TERCERA_EDAD (-20%)
    (component as any).formPago.controls.idBeneficio.setValue('TERCERA_EDAD');
    expect((component as any).descuentoMonto()).toBe(40); // 20% de 200 = 40
    expect((component as any).montoSugeridoFinal()).toBe(160); // 200 - 40 = 160
  });

  it('debe detectar membresía vencida y pre-seleccionar recargo por mora automáticamente', () => {
    (component as any).membresias.set([mockMembresiaVencida]);
    (component as any).abrirModalPago(mockMembresiaVencida);

    // La membresía vencida debe activar MORA_FIJA (+Q25) por defecto
    expect((component as any).formPago.controls.idRecargo.value).toBe('MORA_FIJA');
    expect((component as any).recargoMonto()).toBe(25);
    // Base 500 + Recargo 25 = 525
    expect((component as any).montoSugeridoFinal()).toBe(525);
  });

  it('debe calcular recargo porcentual por pago tardío (MORA_10)', () => {
    (component as any).membresias.set([mockMembresiaVencida]);
    (component as any).abrirModalPago(mockMembresiaVencida);

    (component as any).formPago.controls.idRecargo.setValue('MORA_10');
    expect((component as any).recargoMonto()).toBe(50); // 10% de 500 = 50
    expect((component as any).montoSugeridoFinal()).toBe(550); // 500 + 50 = 550
  });

  it('debe registrar pago incluyendo el desglose de beneficio y recargo en la observación', () => {
    (component as any).membresias.set([mockMembresiaVencida]);
    (component as any).metodosPago.set(mockMetodos);
    (component as any).abrirModalPago(mockMembresiaVencida);

    // Aplicar descuento estudiante (-15% de 500 = 75) y mora fija (+25)
    (component as any).formPago.controls.idBeneficio.setValue('ESTUDIANTE');
    (component as any).formPago.controls.idRecargo.setValue('MORA_FIJA');
    // Total esperado: 500 - 75 + 25 = 450
    (component as any).formPago.controls.monto.setValue(450);

    (component as any).registrarPago();

    expect(mockPagosService.registrar).toHaveBeenCalled();
    const calls = mockPagosService.registrar.mock.calls;
    const payload = calls[calls.length - 1][0];
    expect(payload.idMembresia).toBe(11);
    expect(payload.monto).toBe(450);
    expect(payload.observacion).toContain('Beneficio: Estudiante / Universitario (-15%)');
    expect(payload.observacion).toContain('Recargo tardío: Recargo por mora (+Q25.00)');
  });
});
