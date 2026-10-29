import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { NotificacionService } from '../../../../core/services/notificacion.service';
import { PlanesService } from '../../../planes/services/planes.service';
import { Promocion } from '../../models/promocion.model';
import { PromocionesService } from '../../services/promociones.service';
import { GestionPromocionesComponent } from './gestion-promociones.component';

describe('GestionPromocionesComponent', () => {
  let component: GestionPromocionesComponent;
  let fixture: ComponentFixture<GestionPromocionesComponent>;
  let mockPromociones: any;
  let mockNotificacion: any;

  const vigente: Promocion = {
    id: 1,
    nombre: 'Promo Estudiantes',
    descripcion: null,
    tipoDescuento: 'PORCENTAJE',
    valorDescuento: 15,
    fechaInicio: '2026-01-01',
    fechaFin: '2026-12-31',
    activo: true,
    vigente: true,
  };
  const inactiva: Promocion = { ...vigente, id: 2, nombre: 'Promo Verano', activo: false, vigente: false };

  beforeEach(async () => {
    mockPromociones = {
      listar: vi.fn().mockReturnValue(of([vigente, inactiva])),
      obtenerRecargoTardio: vi.fn().mockReturnValue(of({ porcentaje: 10, fechaActualizacion: null })),
      actualizarRecargoTardio: vi.fn((porcentaje: number) => of({ porcentaje, fechaActualizacion: null })),
      crear: vi.fn((req: any) => of({ ...vigente, ...req, id: 5 })),
      actualizar: vi.fn((id: number, cambios: any) => of({ ...vigente, ...cambios, id })),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
    };
    mockNotificacion = { exito: vi.fn(), error: vi.fn(), aviso: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GestionPromocionesComponent],
      providers: [
        { provide: PromocionesService, useValue: mockPromociones },
        { provide: NotificacionService, useValue: mockNotificacion },
        {
          provide: PlanesService,
          useValue: {
            planes$: of([{ id_plan: 1, nombre: 'Plan Mensual', duracion: 30, precio: 250, activo: true }]),
            getPlanes: vi.fn().mockReturnValue(of([])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionPromocionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga las promociones y el recargo actual', () => {
    expect((component as any).promociones().length).toBe(2);
    expect((component as any).totalVigentes()).toBe(1);
    expect((component as any).recargoActual()).toBe(10);
  });

  it('filtra las promociones inactivas', () => {
    (component as any).filtro.set('INACTIVAS');
    expect((component as any).promocionesFiltradas().map((p: Promocion) => p.id)).toEqual([2]);
  });

  it('crea una promoción de monto fijo y muestra el ejemplo por plan', () => {
    (component as any).abrirNueva();
    (component as any).formPromocion.patchValue({
      nombre: 'Promo Familiar',
      tipoDescuento: 'MONTO_FIJO',
      valorDescuento: 50,
      fechaInicio: '2026-11-01',
      fechaFin: '2026-11-30',
    });

    expect((component as any).ejemploPlanes()[0]).toEqual({ nombre: 'Plan Mensual', precio: 250, descuento: 50, total: 200 });

    (component as any).guardar();

    expect(mockPromociones.crear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Promo Familiar', tipoDescuento: 'MONTO_FIJO', valorDescuento: 50 }),
    );
    expect((component as any).modalAbierto()).toBe(false);
  });

  it('no permite porcentajes mayores a 100 ni fechas invertidas', () => {
    (component as any).abrirNueva();
    (component as any).formPromocion.patchValue({
      nombre: 'Promo',
      valorDescuento: 120,
      fechaInicio: '2026-12-01',
      fechaFin: '2026-11-01',
    });

    (component as any).guardar();

    expect((component as any).formPromocion.hasError('porcentajeMayorA100')).toBe(true);
    expect((component as any).formPromocion.hasError('rangoFechas')).toBe(true);
    expect(mockPromociones.crear).not.toHaveBeenCalled();
  });

  it('edita una promoción existente con PUT', () => {
    (component as any).abrirEdicion(vigente);
    (component as any).formPromocion.controls.valorDescuento.setValue(20);

    (component as any).guardar();

    expect(mockPromociones.actualizar).toHaveBeenCalledWith(1, expect.objectContaining({ valorDescuento: 20 }));
  });

  it('activa o desactiva sin abrir el formulario', () => {
    (component as any).cambiarEstado(vigente);

    expect(mockPromociones.actualizar).toHaveBeenCalledWith(1, { activo: false });
    expect((component as any).promociones().find((p: Promocion) => p.id === 1).activo).toBe(false);
  });

  it('muestra dentro del modal el error del backend al eliminar una promoción usada', () => {
    mockPromociones.eliminar.mockReturnValue(
      throwError(() => ({ message: 'No se puede eliminar la promoción porque ya fue aplicada en facturas.' })),
    );
    (component as any).pedirEliminar(vigente);

    (component as any).confirmarEliminar();

    expect((component as any).promocionAEliminar()).toBe(vigente);
    expect((component as any).errorEliminar()).toContain('ya fue aplicada');
  });

  it('actualiza el porcentaje de recargo por pago tardío', () => {
    (component as any).formRecargo.controls.porcentaje.setValue(12.5);

    (component as any).guardarRecargo();

    expect(mockPromociones.actualizarRecargoTardio).toHaveBeenCalledWith(12.5);
    expect((component as any).recargoActual()).toBe(12.5);
  });
});
