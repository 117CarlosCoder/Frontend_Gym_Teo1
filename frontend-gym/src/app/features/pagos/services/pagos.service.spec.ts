import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API } from '../../../core/constants/api.constants';
import { PagosService } from './pagos.service';

describe('PagosService', () => {
  let service: PagosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PagosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registra el pago con POST /pagos', () => {
    service.registrar({ idMembresia: 3, idMetodoPago: 1, monto: 250 }).subscribe((pago) => {
      expect(pago.idComprobante).toBe(10);
      expect(pago.montoPagado).toBe(250);
      expect(pago.nuevaFechaVencimiento).toBe('2026-11-07');
    });

    const req = http.expectOne(API.pagos);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idMembresia: 3, idMetodoPago: 1, monto: 250 });
    req.flush({ idComprobante: 10, montoPagado: '250.00', nuevaFechaVencimiento: '2026-11-07' });
  });

  it('pide el historial del socio ordenado del más reciente al más antiguo', () => {
    service.historialPorSocio(4, 1, 5).subscribe((pagina) => {
      expect(pagina.content.length).toBe(1);
      expect(pagina.totalPages).toBe(2);
    });

    const req = http.expectOne((r) => r.url === `${API.pagos}/socio/4`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.get('sort')).toBe('fechaPago,desc');
    req.flush({ content: [{ idComprobante: 1, montoPagado: 100 }], totalElements: 6, totalPages: 2, number: 1, size: 5 });
  });

  it('descarga el comprobante como PDF', () => {
    service.descargarComprobante(7).subscribe((pdf) => expect(pdf).toBeInstanceOf(Blob));

    const req = http.expectOne(`${API.pagos}/7/pdf`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['%PDF'], { type: 'application/pdf' }));
  });

  it('mapea las membresías del socio con duración y precio del plan', () => {
    service.membresiasDeSocio(4).subscribe((lista) => {
      expect(lista).toEqual([
        {
          id: 9,
          nombrePlan: 'Plan Trimestral',
          duracionDias: 90,
          precio: 650,
          fechaInicio: '2026-07-01',
          fechaVencimiento: '2026-09-29',
          estado: 'VENCIDA',
          activa: false,
        },
      ]);
    });

    http.expectOne(`${API.membresias}/socio/4`).flush([
      {
        id: 9,
        plan: { nombre: 'Plan Trimestral', duracion: 90, precio: '650.00' },
        estado: { nombre: 'vencida' },
        fechaInicio: '2026-07-01',
        fechaVencimiento: '2026-09-29',
        activa: false,
      },
    ]);
  });
});
