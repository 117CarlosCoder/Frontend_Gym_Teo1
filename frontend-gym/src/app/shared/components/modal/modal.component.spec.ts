import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('titulo', 'Registrar pago');
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('muestra el error dentro del modal cuando la operación falla', () => {
    expect(elemento.querySelector('[role="alert"]')).toBeNull();

    fixture.componentRef.setInput('error', 'El socio ya tiene una membresía activa.');
    fixture.detectChanges();

    const alerta = elemento.querySelector('[role="alert"]');
    expect(alerta?.textContent).toContain('El socio ya tiene una membresía activa.');
  });

  it('se cierra con Escape', () => {
    let cerrado = false;
    fixture.componentInstance.cerrar.subscribe(() => (cerrado = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cerrado).toBe(true);
  });

  it('no se puede cerrar mientras está guardando', () => {
    let cerrado = false;
    fixture.componentInstance.cerrar.subscribe(() => (cerrado = true));
    fixture.componentRef.setInput('bloqueado', true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    (elemento.querySelector('.btn-close') as HTMLButtonElement).click();

    expect(cerrado).toBe(false);
  });
});
