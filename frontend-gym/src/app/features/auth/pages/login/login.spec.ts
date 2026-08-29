import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const escribir = (selector: string, valor: string) => {
    const input = elemento.querySelector<HTMLInputElement>(selector)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  };

  it('muestra el formulario con sus dos campos', () => {
    expect(elemento.querySelector('#correo')).not.toBeNull();
    expect(elemento.querySelector('#password')).not.toBeNull();
  });

  it('marca el correo inválido al enviar vacío', async () => {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(elemento.textContent).toContain('El correo es obligatorio.');
  });

  it('navega al panel con credenciales correctas', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    escribir('#correo', 'admin@claudelovers.com');
    escribir('#password', 'admin123');
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));

    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith('/dashboard'));
  });

  it('muestra el mensaje del servidor con credenciales incorrectas', async () => {
    escribir('#correo', 'admin@claudelovers.com');
    escribir('#password', 'clave-mala');
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(elemento.textContent).toContain('Correo o contraseña incorrectos.');
    });
  });
});
