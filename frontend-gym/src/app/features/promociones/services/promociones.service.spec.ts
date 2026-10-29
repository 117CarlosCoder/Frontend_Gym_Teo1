import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { API } from '../../../core/constants/api.constants';
import { calcularDescuento, describirDescuento } from '../models/promocion.model';
import { PromocionesService } from './promociones.service';

describe('PromocionesService', () => {
  let service: PromocionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PromocionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crea una promoción porcentual con POST /promociones', async () => {
    const promesa = firstValueFrom(
      service.crear({
        nombre: 'Estudiantes',
        tipoDescuento: 'PORCENTAJE',
        valorDescuento: 15,
        fechaInicio: '2026-11-01',
        fechaFin: '2026-12-31',
        activo: true,
      }),
    );

    const req = http.expectOne(API.promociones);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.valorDescuento).toBe(15);
    req.flush({ id: 4, nombre: 'Estudiantes', tipoDescuento: 'PORCENTAJE', valorDescuento: '15.00', activo: true, vigente: false });

    const creada = await promesa;
    expect(creada.id).toBe(4);
    expect(creada.valorDescuento).toBe(15);
  });

  it('edita solo los campos enviados con PUT /promociones/{id}', () => {
    service.actualizar(4, { valorDescuento: 20, activo: false }).subscribe();

    const req = http.expectOne(`${API.promociones}/4`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ valorDescuento: 20, activo: false });
    req.flush({ id: 4, valorDescuento: 20, activo: false });
  });

  it('consulta las promociones vigentes para elegir al cobrar', () => {
    service.listarVigentes().subscribe((lista) => expect(lista[0].vigente).toBe(true));
    http.expectOne(`${API.promociones}/vigentes`).flush([{ id: 1, nombre: 'Apertura', tipoDescuento: 'MONTO_FIJO', valorDescuento: 50, activo: true, vigente: true }]);
  });

  it('actualiza el porcentaje de recargo por pago tardío', async () => {
    const promesa = firstValueFrom(service.actualizarRecargoTardio(12.5));

    const req = http.expectOne(`${API.configuracion}/recargo-tardio`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ porcentaje: 12.5 });
    req.flush({ porcentaje: '12.50', fechaActualizacion: '2026-10-29T10:00:00' });

    expect((await promesa).porcentaje).toBe(12.5);
  });

  it('calcula el descuento igual que el backend (sin superar el precio)', () => {
    expect(calcularDescuento({ tipoDescuento: 'PORCENTAJE', valorDescuento: 15 }, 250)).toBe(37.5);
    expect(calcularDescuento({ tipoDescuento: 'MONTO_FIJO', valorDescuento: 50 }, 250)).toBe(50);
    expect(calcularDescuento({ tipoDescuento: 'MONTO_FIJO', valorDescuento: 400 }, 250)).toBe(250);
    expect(describirDescuento({ tipoDescuento: 'PORCENTAJE', valorDescuento: 15 })).toBe('15 %');
    expect(describirDescuento({ tipoDescuento: 'MONTO_FIJO', valorDescuento: 50 })).toBe('Q 50.00');
  });
});
