import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PlanesService } from './planes.service';

describe('PlanesService', () => {
  let service: PlanesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlanesService],
    });
    service = TestBed.inject(PlanesService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe inicializarse y cargar los 4 planes del backend (Mensual, Trimestral, Semestral, Anual)', async () => {
    const planes = await firstValueFrom(service.getPlanes());
    expect(planes.length).toBeGreaterThanOrEqual(4);
    const nombres = planes.map((p) => p.nombre.toLowerCase());
    expect(nombres.some((n) => n.includes('mensual'))).toBe(true);
    expect(nombres.some((n) => n.includes('trimestral'))).toBe(true);
    expect(nombres.some((n) => n.includes('semestral'))).toBe(true);
    expect(nombres.some((n) => n.includes('anual'))).toBe(true);
  });

  it('debe calcular la fecha de vencimiento sumando la duración en días', () => {
    const fechaInicio = '2026-01-01';
    const duracion = 30;
    const vencimiento = service.calcularFechaVencimiento(fechaInicio, duracion);
    expect(vencimiento).toBe('2026-01-31');
  });

  it('debe crear un nuevo plan correctamente', async () => {
    const nuevo = await firstValueFrom(
      service.crearPlan({
        nombre: 'Plan Semestral Especial',
        duracion: 180,
        precio: 1200,
        descripcion: 'Plan de 6 meses de prueba',
      })
    );
    expect(nuevo.id_plan).toBeDefined();
    expect(nuevo.nombre).toBe('Plan Semestral Especial');
    expect(nuevo.duracion).toBe(180);
    expect(nuevo.precio).toBe(1200);
  });
});

