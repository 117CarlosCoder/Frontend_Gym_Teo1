import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocioFormComponent } from './socio-form.component';

describe('SocioFormComponent', () => {
  let component: SocioFormComponent;
  let fixture: ComponentFixture<SocioFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocioFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SocioFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
