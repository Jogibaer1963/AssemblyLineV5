import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Clock } from './clock/clock';
import { Bay } from './bay/bay';
import {Table} from './table/table';
import { Arrow } from './arrow/arrow';


  type BayModel = {
  id: number;
  name: string;
  status_a: string;
  status_b: string;
  leavingDateTime: string;
  active: boolean;
  install: string;
  startTime?: number;
};


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Clock, Bay, Table, Arrow],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  title = 'Assembly Line Viewer';

  private baseTime = this.getPersistentBaseTime();

  private getPersistentBaseTime(): number {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('assembly-line-base-time');
      if (stored) return parseInt(stored, 10);
      const now = Date.now();
      localStorage.setItem('assembly-line-base-time', now.toString());
      return now;
    }
    return Date.now();
  }

  bays: BayModel[] = [
        {id: 1, name: 'FCB 1', status_a: '', status_b: '',
      leavingDateTime: '', active: true, install: 'Fan Guard', startTime: this.baseTime},
    {id: 2, name: 'FCB 2', status_a: '', status_b: '',
      leavingDateTime: '', active: false, install: 'Rotor Drive', startTime: this.baseTime},
    {id: 3, name: 'Bay 2', status_a: '', status_b: '',
      leavingDateTime:'', active: false,
      install: 'Front- Rear Axle, Threshing Unit', startTime: this.baseTime},
     {id: 4, name: 'Bay 3', status_a: '-- free --', status_b: '',
      leavingDateTime:'', active: false,
      install: 'Feeder House Drive', startTime: this.baseTime},
    {id: 5, name: 'Bay 4', status_a: '', status_b: '',
      leavingDateTime:'', active: false,
      install: 'Engine, Fan Drive', startTime: this.baseTime},
    {id: 6, name: 'Bay 5', status_a: '', status_b: '',
      leavingDateTime:'0', active: false,
      install: 'Grain Tank, Drive Hydraulic, Fuel Tank', startTime: this.baseTime},
    {id: 7, name: 'Bay 6', status_a: '', status_b: '',
      leavingDateTime:'', active: false,
      install: 'Cat Walk, Elevators, Cabin', startTime: this.baseTime},
    {id: 8, name: 'Bay 7', status_a: '', status_b: '',
      leavingDateTime:'0', active: false,
      install: 'Battery Box, Central Electric', startTime: this.baseTime},
    {id: 9, name: 'Bay 8', status_a: '', status_b: '',
      leavingDateTime:'', active: false,
      install: 'Stone Trap Door, Feeder House', startTime: this.baseTime},
    {id: 10, name: 'Bay 9', status_a: '', status_b: '',
      leavingDateTime:'', active: false,
      install: 'Chopper, Chaff Blower / Spreader', startTime: this.baseTime},
     {id: 11, name: 'Bay 10', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Unload Auger', startTime: this.baseTime},
    {id: 12, name: 'Testbay 1', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Fluids Filling', startTime: this.baseTime},
    {id: 13, name: 'Testbay 2', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Test Run', startTime: this.baseTime},
    {id: 14, name: 'Bay 14', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Q-Gate 3', startTime: this.baseTime},
    {id: 15, name: 'Bay 15', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Front Ladder', startTime: this.baseTime},
    {id: 16, name: 'Bay 16', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Cat Walk cover, Engine Cover', startTime: this.baseTime},
    {id: 17, name: 'Bay 17', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Tire MTS Assembly', startTime: this.baseTime},
    {id: 18, name: 'Bay 18', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Feeder House Cover, Side Panels', startTime: this.baseTime},
    {id: 19, name: 'Bay 19', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Final Q-Gate, repair', startTime: this.baseTime},
       ]

   // ✅ ADD THIS METHOD (anywhere inside the class)
  updateBay(id: number, patch: Partial<BayModel>) {
    const i = this.bays.findIndex(b => b.id === id);
    if (i === -1) return;



    // replace ONLY that element; others keep their same references
    this.bays = this.bays.map(b =>
      (b.id === id ? { ...b, ...patch } : b));
  }




}


