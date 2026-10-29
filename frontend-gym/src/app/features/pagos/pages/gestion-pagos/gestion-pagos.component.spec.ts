import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { GestionPagosComponent } from './gestion-pagos.component';
import { PagosService } from '../../services/pagos.service';
import { PromocionesService } from '../../../promociones/services/promociones.service';
import { SociosService } from '../../../socios/services/socios.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { CotizacionPago, MembresiaPagable, MetodoPago } from '../../models/pago.model';

describe('GestionPagosComponent - Curva del PO (descuento y recargo calculados por el backend)', () => {
  let component: GestionPagosComponent;
  let fixture: ComponentFixture<GestionPagosComponent>;
  let mockPagosService: any;
  let mockPromocionesService: any;
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

  const cotizacionConDescuento: CotizacionPago = {
    idMembresia: 10,
    montoBase: 200,
    idPromocion: 3,
    nombrePromocion: 'Promo Estudiantes',
    descuento: 30,
    pagoTardio: false,
    diasAtraso: 0,
    porcentajeRecargo: 10,
    recargo: 0,
    total: 170,
    fechaCalculo: '2026-10-21',
  };

  const cotizacionConMora: CotizacionPago = {
    idMembresia: 11,
    montoBase: 500,
    idPromocion: null,
    nombrePromocion: null,
    descuento: 0,
    pagoTardio: true,
    diasAtraso: 81,
    porcentajeRecargo: 10,
    recargo: 50,
    total: 550,
    fechaCalculo: '2026-10-21',
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
      cotizar: vi.fn((id: number) => of(id === 11 ? cotizacionConMora : cotizacionConDescuento)),
      descargarComprobante: vi.fn().mockReturnValue(of(new Blob())),
      guardarPdf: vi.fn(),
    };

    mockPromocionesService = {
      listarVigentes: vi.fn().mockReturnValue(
        of([
          { id: 3, nombre: 'Promo Estudiantes', tipoDescuento: 'PORCENTAJE', valorDescuento: 15, activo: true, vigente: true },
          { id: 4, nombre: 'Promo Familiar', tipoDescuento: 'MONTO_FIJO', valorDescuento: 50, activo: true, vigente: true },
        ]),
      ),
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
        { provide: PromocionesService, useValue: mockPromocionesService },
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

  it('muestra el descuento por promoción que calcula el backend y sugiere el total', () => {
    (component as any).membresias.set([mockMembresiaActiva]);
    (component as any).abrirModalPago(mockMembresiaActiva);

    expect(mockPagosService.cotizar).toHaveBeenCalledWith(10, null);
    expect((component as any).cotizacion().descuento).toBe(30);
    expect((component as any).cotizacion().nombrePromocion).toBe('Promo Estudiantes');
    expect((component as any).formPago.controls.monto.value).toBe(170);
  });

  it('aplica el recargo por mora cuando la membresía está vencida', () => {
    (component as any).membresias.set([mockMembresiaVencida]);
    (component as any).abrirModalPago(mockMembresiaVencida);

    expect((component as any).cotizacion().pagoTardio).toBe(true);
    expect((component as any).cotizacion().recargo).toBe(50);
    expect((component as any).formPago.controls.monto.value).toBe(550);
  });

  it('vuelve a cotizar al cambiar de membresía', () => {
    (component as any).membresias.set([mockMembresiaActiva, mockMembresiaVencida]);
    (component as any).abrirModalPago(mockMembresiaActiva);

    (component as any).formPago.controls.idMembresia.setValue(11);
    (component as any).alCambiarMembresia();

    expect(mockPagosService.cotizar).toHaveBeenLastCalledWith(11, null);
    expect((component as any).formPago.controls.monto.value).toBe(550);
  });

  it('rechaza un monto menor al total y no llama al backend', () => {
    (component as any).membresias.set([mockMembresiaVencida]);
    (component as any).metodosPago.set(mockMetodos);
    (component as any).abrirModalPago(mockMembresiaVencida);

    (component as any).formPago.controls.monto.setValue(500);
    expect((component as any).montoInsuficiente()).toBe(true);

    (component as any).registrarPago();

    expect(mockPagosService.registrar).not.toHaveBeenCalled();
    expect((component as any).errorModal()).toContain('Q 550.00');
  });

  it('registra el pago con el total cotizado y solo la nota del usuario como observación', () => {
    (component as any).membresias.set([mockMembresiaVencida]);
    (component as any).metodosPago.set(mockMetodos);
    (component as any).abrirModalPago(mockMembresiaVencida);
    (component as any).formPago.controls.observacion.setValue('Pagó en caja 2');

    (component as any).registrarPago();

    const payload = mockPagosService.registrar.mock.calls.at(-1)[0];
    expect(payload.idMembresia).toBe(11);
    expect(payload.monto).toBe(550);
    expect(payload.observacion).toBe('Pagó en caja 2');
  });

  it('carga las promociones vigentes y cotiza con la promoción elegida', () => {
    (component as any).membresias.set([mockMembresiaActiva]);
    (component as any).metodosPago.set(mockMetodos);
    (component as any).abrirModalPago(mockMembresiaActiva);
    expect((component as any).promocionesVigentes().length).toBe(2);

    (component as any).formPago.controls.idPromocion.setValue(4);
    (component as any).alCambiarMembresia();
    expect(mockPagosService.cotizar).toHaveBeenLastCalledWith(10, 4);

    (component as any).registrarPago();
    const payload = mockPagosService.registrar.mock.calls.at(-1)[0];
    expect(payload.idPromocion).toBe(4);
  });

  it('no envía idPromocion cuando la promoción es automática', () => {
    (component as any).membresias.set([mockMembresiaActiva]);
    (component as any).metodosPago.set(mockMetodos);
    (component as any).abrirModalPago(mockMembresiaActiva);

    (component as any).registrarPago();
    const payload = mockPagosService.registrar.mock.calls.at(-1)[0];
    expect(payload.idPromocion).toBeUndefined();
  });
});
