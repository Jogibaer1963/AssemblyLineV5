import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Arrow } from './arrow';

describe('Arrow', () => {
  let component: Arrow;
  let fixture: ComponentFixture<Arrow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Arrow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Arrow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
