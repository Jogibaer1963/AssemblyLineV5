import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';


interface LineSchedule {
  _id: string;
  machine: string;
  bay_2: string;
  activeList?: string;
  activeInLine?: string;
  sequenz: number;
}

@Component({
  selector: 'app-table',
  imports: [],
  templateUrl: './table.html',
  styleUrl: './table.css',
})


export class Table implements OnInit{
    schedules: LineSchedule[] = [];


  constructor(private http: HttpClient) {}

    ngOnInit(): void {
    this.loadSchedule();

  }


   private loadSchedule(): void {
     const isDev = typeof window !== 'undefined' && window.location?.port === '4200';
    const apiBase = isDev ? 'http://localhost:5000/api' : '/api';

    this.http
      .get<LineSchedule[]>(`${apiBase}/lineSchedule`, { params: { sort: 'asc' } })
      .subscribe({
        next: (data) => {
          this.schedules = (data ?? []).slice(0, 7);
        },
        error: (err) => {
          console.error('App: Failed to load line schedule', err);
          this.schedules = [];
        },
      });
  }
}
