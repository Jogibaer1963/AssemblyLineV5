import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Clock } from './clock';

describe('Clock', () => {
  let component: Clock;
  let fixture: ComponentFixture<Clock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Clock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update time every second', async () => {
    // Clear initial state or wait for a bit
    fixture.detectChanges();
    const initialSeconds = component.seconds;

    // Wait for 1.1 seconds to be sure the interval fired
    await new Promise(resolve => setTimeout(resolve, 1100));
    // In zoneless, detectChanges is called inside the component interval
    // but we might still need it here to sync the test view if needed.
    // However, detectChanges() might throw if it's already running.

    const nextSeconds = component.seconds;
    expect(nextSeconds).not.toBe(initialSeconds);
  });
});
