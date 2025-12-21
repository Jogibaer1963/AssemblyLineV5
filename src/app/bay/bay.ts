import {Component, Input, OnDestroy, OnInit, ChangeDetectorRef} from '@angular/core';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-bay',
  imports: [
    DecimalPipe
  ],
  templateUrl: './bay.html',
  styleUrl: './bay.css',
})
export class Bay implements OnInit, OnDestroy{
   constructor(private cdr: ChangeDetectorRef) {}

  progress = 0; // 0..100

  @Input() bay!: {id: number, name: string,
    status: string, leavingDateTime: string,
    active: boolean, install: string};

private startTime = Date.now();

private readonly durationMinutes = 30 // duration in minutes
private readonly durationMs = this.durationMinutes * 60 * 1000; // 4 Stunden
  private timerId: any;

  ngOnInit() {
    this.updateProgress();
    this.timerId = setInterval(() => this.updateProgress(), 1000); // jede Sekunde (oder 10s/60s)
  }

  ngOnDestroy() {
    clearInterval(this.timerId);
  }

  private updateProgress() {
    const elapsed = Date.now() - this.startTime;
    const raw = (elapsed / this.durationMs) * 100;
    this.progress = Math.max(0, Math.min(100, raw));

    this.cdr.markForCheck(); // <--- wichtig bei OnPush/zoneless
  }
}
