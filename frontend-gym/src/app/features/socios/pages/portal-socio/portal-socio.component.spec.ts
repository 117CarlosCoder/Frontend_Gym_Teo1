import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortalSocioComponent } from './portal-socio.component';

describe('PortalSocioComponent', () => {
  let component: PortalSocioComponent;
  let fixture: ComponentFixture<PortalSocioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalSocioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PortalSocioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
