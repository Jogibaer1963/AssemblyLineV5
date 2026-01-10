import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

interface LineSchedule {
  _id: string;
  machine: string;
  bay_2: string;
  activeList?: string;
  activeInLine?: string;
  activeInBay?: any[];
}

@Component({
  selector: 'app-table',
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrl: './table.css',
})

export class Table implements OnInit, OnDestroy{
    schedules: LineSchedule[] = [];
    @Input() disabled: boolean = false;

    @Output() machineSelected = new EventEmitter<LineSchedule>();

    private socket: Socket;

  constructor(private http: HttpClient,
              private cdr: ChangeDetectorRef) {
    const backendUrl = this.getBackendUrl();
    this.socket = io(backendUrl);

    // Set up listeners immediately in constructor
    this.socket.on('schedule:init', (data: LineSchedule[]) => {
      console.log('Table: received socket data (init)', data);
      this.schedules = (data ?? []).slice(0, 7);
      this.cdr.detectChanges();
    });

    this.socket.on('schedule:update', (payload: { reason: string, data: LineSchedule[] }) => {
      console.log('Table: received socket data (update)', payload);
      this.schedules = (payload.data ?? []).slice(0, 7);
      this.cdr.detectChanges();
    });
  }

    ngOnInit(): void {
    this.loadSchedule();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private getBackendUrl(): string {
    const isDev = typeof window !== 'undefined'
      && (window.location?.port === '4200'
        || window.location?.port === '4500'
        || window.location?.hostname === 'localhost'
        || window.location?.hostname === '127.0.0.1');
    return isDev ? 'http://localhost:5000' : '';
  }

    private loadSchedule(): void {
    const apiBase = this.getBackendUrl() ? `${this.getBackendUrl()}/api` : '/api';
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

  onFirstRowClick(machine: LineSchedule) {
  //  console.log('clicked ', machineId);
    this.machineSelected.emit(machine);
  }
}
