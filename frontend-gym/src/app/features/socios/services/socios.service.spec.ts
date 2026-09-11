import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SociosService } from './socios.service';

describe('SociosService', () => {
  let service: SociosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SociosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debe retornar la lista de socios con getSocios', async () => {
    const socios = await firstValueFrom(service.getSocios());
    expect(socios).toBeDefined();
    expect(Array.isArray(socios)).toBe(true);
  });

  it('debe retornar los datos del socio para el portal con getSocio', async () => {
    const datos = await firstValueFrom(service.getSocio());
    expect(datos).toBeDefined();
    expect(datos.usuario).toBeDefined();
    expect(datos.membresia).toBeDefined();
  });
});
