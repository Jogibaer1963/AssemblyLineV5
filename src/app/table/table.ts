import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';


interface LineSchedule {
  _id: string;
  machine: string;
  bay_2: string;
  activeList?: string;
  activeInLine?: string;
}

@Component({
  selector: 'app-table',
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrl: './table.css',
})

export class Table implements OnInit{
    schedules: LineSchedule[] = [];

    @Output() machineSelected = new EventEmitter<string>();

  constructor(private http: HttpClient,
              private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
    this.loadSchedule();
  }

    private loadSchedule(): void {
    const isDev = typeof window !== 'undefined'
      && (window.location?.port === '4200'
        || window.location?.port === '4500' ||
        window.location?.hostname === 'localhost');
    const apiBase =
      isDev ? 'http://localhost:5000/api' : '/api';
    this.http
      .get<LineSchedule[]>(`${apiBase}/lineSchedule`,
        { params: { sort: 'asc' } })
      .subscribe({
        next: (data) => {
          console.log('Table: received data', data);
          this.schedules = (data ?? []).
          slice(0, 7);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Table: Failed to load line schedule', err);
          this.schedules = [];
          this.cdr.detectChanges();
        },
      });
  }

  onFirstRowClick(machineId: string) {
    console.log('clicked ', machineId);
    this.machineSelected.emit(machineId);
  }
}
