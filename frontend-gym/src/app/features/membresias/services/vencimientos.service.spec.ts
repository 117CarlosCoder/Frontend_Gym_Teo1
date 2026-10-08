import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API } from '../../../core/constants/api.constants';
import { VencimientosService } from './vencimientos.service';

describe('VencimientosService', () => {
  let service: VencimientosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VencimientosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta las membresías que vencen en los próximos días', () => {
    service.proximasAVencer(7).subscribe((lista) => {
      expect(lista[0]).toEqual(
        expect.objectContaining({
          idMembresia: 5,
          idSocio: 4,
          nombreSocio: 'Ana López',
          correo: 'ana@gym.com',
          plan: 'Plan Mensual',
          diasRestantes: 3,
        }),
      );
    });

    const req = http.expectOne((r) => r.url === `${API.membresias}/proximas-a-vencer`);
    expect(req.request.params.get('dias')).toBe('7');
    req.flush({
      content: [
        {
          id: 5,
          socio: { id: 4, usuario: { nombres: 'Ana', apellidos: 'López', correo: 'ana@gym.com' } },
          plan: { nombre: 'Plan Mensual', precio: 250 },
          fechaVencimiento: '2026-10-11',
          diasRestantes: 3,
        },
      ],
    });
  });

  it('envía el recordatorio por correo', () => {
    service.enviarRecordatorio(5).subscribe((mensaje) => expect(mensaje).toContain('enviado'));

    const req = http.expectOne(`${API.membresias}/5/enviar-recordatorio`);
    expect(req.request.method).toBe('POST');
    req.flush({ mensaje: 'Correo de recordatorio de vencimiento enviado exitosamente' });
  });
});
