import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaSocios } from './lista-socios.component';

describe('ListaSocios', () => {
  let component: ListaSocios;
  let fixture: ComponentFixture<ListaSocios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSocios],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaSocios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
