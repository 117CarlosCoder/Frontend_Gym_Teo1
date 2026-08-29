import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';

describe('AuthService (modo demo)', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient()],
    });
    auth = TestBed.inject(AuthService);
  });

  it('inicia sin sesión', () => {
    expect(auth.estaAutenticado()).toBe(false);
    expect(auth.usuario()).toBeNull();
  });

  it('autentica a un usuario válido y guarda la sesión', async () => {
    const respuesta = await firstValueFrom(
      auth.login({ correo: 'admin@claudelovers.com', password: 'admin123' }),
    );

    expect(respuesta.token).toBeTruthy();
    expect(auth.estaAutenticado()).toBe(true);
    expect(auth.rol()).toBe('ADMIN');
    expect(auth.tieneRol('ADMIN', 'RECEPCION')).toBe(true);
    expect(localStorage.getItem('gym.sesion')).not.toBeNull();
  });

  it('rechaza credenciales incorrectas', async () => {
    await expect(
      firstValueFrom(auth.login({ correo: 'admin@claudelovers.com', password: 'incorrecta' })),
    ).rejects.toThrow('Correo o contraseña incorrectos.');

    expect(auth.estaAutenticado()).toBe(false);
  });

  it('cierra sesión y limpia el almacenamiento', async () => {
    await firstValueFrom(auth.login({ correo: 'socio@claudelovers.com', password: 'socio123' }));
    auth.logout();

    expect(auth.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('gym.sesion')).toBeNull();
  });
});
