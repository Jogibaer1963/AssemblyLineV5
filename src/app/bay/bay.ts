import {Component, Input, OnDestroy, OnInit,
  ChangeDetectorRef, ChangeDetectionStrategy, NgZone} from '@angular/core';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-bay',
  imports: [
    DecimalPipe
  ],
  templateUrl: './bay.html',
  styleUrl: './bay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export class Bay implements OnInit, OnDestroy{
   constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  progress = 0; // 0..100

  @Input() bay!: {id: number, name: string,
    status_a: string,
    status_b: string,
    leavingDateTime: string,
    active: boolean,
    install: string,
    startTime?: number
  };

private startTime = Date.now();
private readonly durationMinutes = 30 // duration in minutes
private readonly durationMs = this.durationMinutes * 60 * 1000;
  private timerId: any;

  ngOnInit() {
    if (this.bay.startTime) {
      this.startTime = this.bay.startTime;
    }
    this.updateProgress();
   // this.timerId = setInterval(() => this.updateProgress(), 1000); // jede Sekunde (oder 10s/60s)
    this.zone.runOutsideAngular(() => {
      this.timerId = setInterval(() => {
        this.updateProgress();
        this.cdr.detectChanges(); // updates only this component subtree
      }, 1000);
    });
  }

  ngOnDestroy() {
    clearInterval(this.timerId);
  }

  private updateProgress() {
    const elapsed = Date.now() - this.startTime;
    const raw = (elapsed / this.durationMs) * 100;
    this.progress = Math.max(0, Math.min(100, raw));

  //  this.cdr.markForCheck(); // <--- wichtig bei OnPush/zoneless
  }
}
