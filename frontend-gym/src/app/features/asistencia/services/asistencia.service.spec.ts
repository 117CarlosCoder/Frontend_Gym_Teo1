import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, of } from 'rxjs';

import { AsistenciaService } from './asistencia.service';
import { SociosService } from '../../socios/services/socios.service';
import { API } from '../../../core/constants/api.constants';
import { errorInterceptor } from '../../../core/interceptors/error.interceptor';

describe('AsistenciaService (M6: control de acceso)', () => {
  let service: AsistenciaService;
  let httpMock: HttpTestingController;

  const mockSociosService = {
    getSocios: () =>
      of([
        {
          id_socio: 1,
          usuario: { nombre: 'Juan', apellido: 'Perez' },
          estadoMembresia: 'ACTIVA',
          tipoPlan: 'Plan Mensual',
        },
      ]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: SociosService, useValue: mockSociosService },
      ],
    });

    service = TestBed.inject(AsistenciaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('registra la entrada con POST /asistencias/registro', async () => {
    const promesa = firstValueFrom(service.registrarEntrada({ idSocio: 1, idSucursal: 1 }));

    const req = httpMock.expectOne(`${API.asistencias}/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id_socio: 1, sucursal_id: 1 });

    req.flush({
      idAsistencia: 55,
      socio: { usuario: { nombres: 'Juan', apellidos: 'Perez' } },
      sucursalId: 1,
      sucursalNombre: 'Sucursal Central (Zona 1)',
      fecha: '2026-10-21',
      horaEntrada: '08:30:00',
      recepcionistaNombre: 'María Castro',
    });

    const res = await promesa;
    expect(res.idAsistencia).toBe(55);
    expect(res.nombreSocio).toBe('Juan');
    expect(res.horaEntrada).toBe('08:30:00');
    expect(res.dentro).toBe(true);
  });

  it('bloquea el acceso con el mensaje del backend si la membresía está vencida o inactiva', async () => {
    const errorMsg = 'El socio ID 1 no cuenta con una membresía activa y vigente';
    const promesa = firstValueFrom(service.registrarEntrada({ idSocio: 1, idSucursal: 1 }));

    httpMock
      .expectOne(`${API.asistencias}/registro`)
      .flush({ error: 'Error en la solicitud', message: errorMsg }, { status: 400, statusText: 'Bad Request' });

    await expect(promesa).rejects.toThrow(errorMsg);
  });

  it('bloquea una segunda entrada si el socio sigue dentro', async () => {
    const errorMsg = 'El socio ya se encuentra dentro del gimnasio desde las 07:15. Registre su salida antes de una nueva entrada.';
    const promesa = firstValueFrom(service.registrarEntrada({ idSocio: 1, idSucursal: 1 }));

    httpMock
      .expectOne(`${API.asistencias}/registro`)
      .flush({ message: errorMsg }, { status: 400, statusText: 'Bad Request' });

    await expect(promesa).rejects.toThrow('ya se encuentra dentro del gimnasio');
  });

  it('lee las asistencias de hoy del backend (sin datos de prueba)', async () => {
    const promesa = firstValueFrom(service.getAsistenciasHoy(2));

    const req = httpMock.expectOne((r) => r.url === `${API.asistencias}/hoy`);
    expect(req.request.params.get('sucursalId')).toBe('2');
    req.flush([
      {
        idAsistencia: 10,
        idSocio: 8,
        nombresSocio: 'Lucía',
        apellidosSocio: 'Hernández',
        fecha: '2026-10-21',
        horaEntrada: '07:00:00',
        horaSalida: null,
        dentro: true,
        sucursalId: 2,
        sucursalNombre: 'Sucursal Norte (Zona 10)',
      },
    ]);

    const lista = await promesa;
    expect(lista.length).toBe(1);
    expect(lista[0].nombreSocio).toBe('Lucía');
    expect(lista[0].dentro).toBe(true);
  });

  it('registra la salida en el backend (persiste aunque se cierre la sesión)', async () => {
    const promesa = firstValueFrom(service.registrarSalida(10));

    const req = httpMock.expectOne(`${API.asistencias}/10/salida`);
    expect(req.request.method).toBe('POST');
    req.flush({
      idAsistencia: 10,
      idSocio: 8,
      nombresSocio: 'Lucía',
      apellidosSocio: 'Hernández',
      fecha: '2026-10-21',
      horaEntrada: '07:00:00',
      horaSalida: '08:20:00',
      dentro: false,
      minutosPermanencia: 80,
    });

    const res = await promesa;
    expect(res.horaSalida).toBe('08:20:00');
    expect(res.dentro).toBe(false);
    expect(res.minutosPermanencia).toBe(80);
  });

  it('obtiene el historial de entradas y salidas del socio con GET /asistencias/me', async () => {
    const promesa = firstValueFrom(service.getMisAsistencias(5));

    const req = httpMock.expectOne((r) => r.url === `${API.asistencias}/me`);
    expect(req.request.params.get('limite')).toBe('5');
    req.flush([{ idAsistencia: 3, horaEntrada: '18:00:00', horaSalida: '19:30:00', dentro: false }]);

    const lista = await promesa;
    expect(lista[0].horaSalida).toBe('19:30:00');
  });
});
