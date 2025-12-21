import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bay } from './bay';

describe('Bay', () => {
  let component: Bay;
  let fixture: ComponentFixture<Bay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
