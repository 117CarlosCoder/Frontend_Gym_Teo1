import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { API } from '../constants/api.constants';

describe('AuthService', () => {
  let auth: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('inicia sin sesión', () => {
    expect(auth.estaAutenticado()).toBe(false);
    expect(auth.usuario()).toBeNull();
  });

  it('autentica a un usuario válido y guarda la sesión', async () => {
    const promesa = firstValueFrom(
      auth.login({ correo: 'clp64413@gmail.com', password: 'Admin123*' }),
    );

    const reqLogin = httpMock.expectOne(API.auth.login);
    expect(reqLogin.request.method).toBe('POST');
    reqLogin.flush({
      token: 'jwt-real-admin.xyz',
      correo: 'clp64413@gmail.com',
      rol: 'ADMIN',
    });

    const reqPerfil = httpMock.expectOne(API.auth.perfil);
    expect(reqPerfil.request.method).toBe('GET');
    reqPerfil.flush({
      id: 1,
      dpi: '1000000000001',
      nombres: 'Carlos Raúl',
      apellidos: 'López',
      correo: 'clp64413@gmail.com',
      rol: 'ADMIN',
      estado: true,
    });

    const respuesta = await promesa;
    expect(respuesta.token).toBe('jwt-real-admin.xyz');
    expect(auth.estaAutenticado()).toBe(true);
    expect(auth.rol()).toBe('ADMIN');
    expect(auth.tieneRol('ADMIN', 'RECEPCIONISTA')).toBe(true);
    expect(localStorage.getItem('gym.sesion')).not.toBeNull();
  });

  it('rechaza credenciales incorrectas', async () => {
    const promesa = firstValueFrom(
      auth.login({ correo: 'admin@gym.com', password: 'bad' }),
    );

    const reqLogin = httpMock.expectOne(API.auth.login);
    reqLogin.flush(
      { message: 'Correo o contraseña incorrectos.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(promesa).rejects.toThrow('Correo o contraseña incorrectos.');
    expect(auth.estaAutenticado()).toBe(false);
  });

  it('cierra sesión y limpia el almacenamiento', async () => {
    const promesa = firstValueFrom(
      auth.login({ correo: 'lucia.hernandez@gymdemo.com', password: 'Admin123*' }),
    );

    const reqLogin = httpMock.expectOne(API.auth.login);
    reqLogin.flush({
      token: 'jwt-socio.xyz',
      correo: 'lucia.hernandez@gymdemo.com',
      rol: 'CLIENTE',
    });

    const reqPerfil = httpMock.expectOne(API.auth.perfil);
    reqPerfil.flush({
      id: 8,
      nombres: 'Lucía Elena',
      apellidos: 'Hernández',
      correo: 'lucia.hernandez@gymdemo.com',
      rol: 'CLIENTE',
    });

    await promesa;
    expect(auth.estaAutenticado()).toBe(true);

    auth.logout();
    const reqLogout = httpMock.expectOne(API.auth.logout);
    reqLogout.flush({});

    expect(auth.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('gym.sesion')).toBeNull();
  });
});
