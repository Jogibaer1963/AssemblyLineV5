import { Component, OnInit,
  OnDestroy, ChangeDetectorRef,
  inject } from '@angular/core';

@Component({
  selector: 'app-clock',
  imports: [],
  templateUrl: './clock.html',
  styleUrl: './clock.css',
})
export class Clock implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  // Digital clock state
  hours = '';
  minutes = '';
  seconds = '';
  ampm = '';
  dateDisplay = '';
  private timer: any;

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => {
      this.updateClock();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private updateClock(): void {
    const now = new Date();
    let hrs = now.getHours();
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    this.ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    this.hours = String(hrs).padStart(2, '0');
    this.minutes = String(mins).padStart(2, '0');
    this.seconds = String(secs).padStart(2, '0');

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = now.getDate();
    const day = days[now.getDay()];
    const mon = months[now.getMonth()];
    const yr = now.getFullYear();
    this.dateDisplay = `${day} | ${mon} ${d}, ${yr}`;
  }
}
