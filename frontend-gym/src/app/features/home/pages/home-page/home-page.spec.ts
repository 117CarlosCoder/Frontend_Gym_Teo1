import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home-page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar los planes reales de membresía', () => {
    const planes = (component as any).planes();
    expect(planes.length).toBeGreaterThan(0);
    const nombres = planes.map((p: any) => p.nombre);
    expect(nombres).toContain('Plan Mensual');
    expect(nombres).toContain('Plan Trimestral');
  });
});

