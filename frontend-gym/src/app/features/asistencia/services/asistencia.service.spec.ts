import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, of } from 'rxjs';

import { AsistenciaService } from './asistencia.service';
import { SociosService } from '../../socios/services/socios.service';
import { StorageService } from '../../../core/services/storage.service';
import { API } from '../../../core/constants/api.constants';

describe('AsistenciaService', () => {
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

  const mockStorageService = {
    obtener: () => null,
    guardar: () => {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SociosService, useValue: mockSociosService },
        { provide: StorageService, useValue: mockStorageService },
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

  it('debe registrar entrada con POST /asistencias/registro', async () => {
    const promesa = firstValueFrom(service.registrarEntrada({ idSocio: 1, idSucursal: 1, tipo: 'ENTRADA' }));

    const req = httpMock.expectOne(`${API.asistencias}/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id_socio: 1, sucursal_id: 1 });

    req.flush({
      idAsistencia: 55,
      socio: {
        nombres: 'Juan',
        apellidos: 'Perez',
      },
      sucursalNombre: 'Central',
      fecha: '2026-10-15',
      horaEntrada: '08:30:00',
      registradoPorNombre: 'Recepción',
    });

    const res = await promesa;
    expect(res.idSocio).toBe(1);
    expect(res.nombreSocio).toBe('Juan');
    expect(res.horaEntrada).toBe('08:30:00');
  });

  it('debe rechazar acceso y propagar mensaje de error si membresía está inactiva o vencida (400)', async () => {
    const errorMsg = 'El socio ID 1 no cuenta con una membresía activa y vigente';
    const promesa = firstValueFrom(service.registrarEntrada({ idSocio: 1, idSucursal: 1, tipo: 'ENTRADA' }));

    const req = httpMock.expectOne(`${API.asistencias}/registro`);
    req.flush({ error: 'Error en la solicitud', message: errorMsg }, { status: 400, statusText: 'Bad Request' });

    await expect(promesa).rejects.toThrow(errorMsg);
  });

  it('debe obtener asistencias de un socio por GET /asistencias/socio/:id', async () => {
    const promesa = firstValueFrom(service.getAsistenciasPorSocio(1));

    const req = httpMock.expectOne(`${API.asistencias}/socio/1`);
    expect(req.request.method).toBe('GET');
    req.flush([{ idAsistencia: 10, fecha: '2026-10-14' }]);

    const lista = await promesa;
    expect(lista.length).toBe(1);
    expect(lista[0].idAsistencia).toBe(10);
  });
});
