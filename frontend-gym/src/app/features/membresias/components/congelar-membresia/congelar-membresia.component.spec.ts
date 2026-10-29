import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { NotificacionService } from '../../../../core/services/notificacion.service';
import { hoyIso, sumarDias } from '../../../../core/utils/fechas';
import { CongelamientosService } from '../../services/congelamientos.service';
import { CongelarMembresiaComponent } from './congelar-membresia.component';

describe('CongelarMembresiaComponent', () => {
  let fixture: ComponentFixture<CongelarMembresiaComponent>;
  let component: any;
  let mockCongelamientos: any;
  let mockNotificacion: any;
  const hoy = hoyIso();
  const vence = sumarDias(hoy, 20);

  async function crear(estado = 'ACTIVA', historial: any[] = []) {
    mockCongelamientos = {
      obtenerReglas: vi.fn().mockReturnValue(of({ diasMinimo: 7, diasMaximo: 30, maximoPorAnio: 2, fechaActualizacion: null })),
      listar: vi.fn().mockReturnValue(of(historial)),
      congelar: vi.fn((id: number, req: any) =>
        of({ id: 9, idMembresia: id, ...req, dias: 10, estado: 'ACTIVO', fechaVencimientoMembresia: sumarDias(vence, 10) }),
      ),
      finalizar: vi.fn().mockReturnValue(of({ id: 5, dias: 3, estado: 'FINALIZADO', fechaVencimientoMembresia: vence })),
    };
    mockNotificacion = { exito: vi.fn(), error: vi.fn(), aviso: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CongelarMembresiaComponent],
      providers: [
        { provide: CongelamientosService, useValue: mockCongelamientos },
        { provide: NotificacionService, useValue: mockNotificacion },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CongelarMembresiaComponent);
    fixture.componentRef.setInput('membresia', { id: 10, nombrePlan: 'Plan Mensual', fechaVencimiento: vence, estado });
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('propone el congelamiento mínimo y calcula el nuevo vencimiento', async () => {
    await crear();

    expect(component.form.controls.fechaFin.value).toBe(sumarDias(hoy, 6));
    expect(component.dias()).toBe(7);
    expect(component.nuevoVencimiento()).toBe(sumarDias(vence, 7));
    expect(component.problema()).toBeNull();
  });

  it('valida las reglas antes de enviar', async () => {
    await crear();
    component.form.controls.fechaFin.setValue(sumarDias(hoy, 2));

    expect(component.problema()).toContain('entre 7 y 30');
    component.congelar();
    expect(mockCongelamientos.congelar).not.toHaveBeenCalled();
  });

  it('congela, avisa y cierra', async () => {
    await crear();
    const actualizado = vi.fn();
    const cerrar = vi.fn();
    component.actualizado.subscribe(actualizado);
    component.cerrar.subscribe(cerrar);
    component.form.controls.fechaFin.setValue(sumarDias(hoy, 9));

    component.congelar();

    expect(mockCongelamientos.congelar).toHaveBeenCalledWith(10, expect.objectContaining({ fechaInicio: hoy, fechaFin: sumarDias(hoy, 9) }));
    expect(mockNotificacion.exito).toHaveBeenCalled();
    expect(actualizado).toHaveBeenCalled();
    expect(cerrar).toHaveBeenCalled();
  });

  it('muestra el error del backend dentro del modal', async () => {
    await crear();
    mockCongelamientos.congelar.mockReturnValue(
      throwError(() => ({ message: 'La membresía ya alcanzó el máximo de 2 congelamiento(s) permitidos en 2026' })),
    );

    component.congelar();

    expect(component.error()).toContain('máximo de 2');
    expect(component.guardando()).toBe(false);
  });

  it('una membresía congelada no se vuelve a congelar pero se puede descongelar', async () => {
    await crear('CONGELADA', [
      { id: 5, idMembresia: 10, fechaInicio: sumarDias(hoy, -2), fechaFin: sumarDias(hoy, 7), dias: 10, estado: 'ACTIVO', motivo: null },
    ]);

    expect(component.puedeCongelar()).toBe(false);
    component.finalizar(component.historial()[0]);

    expect(mockCongelamientos.finalizar).toHaveBeenCalledWith(5);
    expect(mockCongelamientos.listar).toHaveBeenCalledTimes(2);
  });
});
