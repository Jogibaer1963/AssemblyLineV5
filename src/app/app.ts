import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Clock } from './clock/clock';
import { Bay } from './bay/bay';
import {Table} from './table/table';
import { Arrow } from './arrow/arrow';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Clock, Bay, Table, Arrow],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Assembly Line Viewer';

  bays = [
    {id: 1, name: 'FCB 1', status: 'C8911279',
      leavingDateTime: '', active: true, install: 'Fan Guard'},
    {id: 2, name: 'FCB 2', status: 'C8911280',
      leavingDateTime: '', active: false, install: 'Rotor Drive'},
    {id: 3, name: 'Bay 2', status: 'C8911281',
      leavingDateTime:'2025-12-21 09:56:00', active: false,
      install: 'Front- Rear Axle, Threshing Unit'},
    {id: 4, name: 'Bay 3', status: 'C8911280',
      leavingDateTime:'2025-12-24 07:40:00', active: true,
      install: 'Feeder House Drive'},
    {id: 5, name: 'Bay 4', status: 'C8911281',
      leavingDateTime:'2025-12-25 06:12:00', active: true,
      install: 'Engine, Fan Drive'},
    {id: 6, name: 'Bay 5', status: 'C8911231',
      leavingDateTime:'2025-12-25 12:49:00', active: true,
      install: 'Grain Tank, Drive Hydraulic, Fuel Tank'},
    {id: 7, name: 'Bay 6', status: 'C8911281',
      leavingDateTime:'2025-12-26 10:38:00', active: true,
      install: 'Cat Walk, Elevators, Cabin'},
    {id: 8, name: 'Bay 7', status: 'C8911280',
      leavingDateTime:'2025-12-27 09:38:00', active: true,
      install: 'Battery Box, Central Electric'},
    {id: 9, name: 'Bay 8', status: 'C8911281',
      leavingDateTime:'2025-12-28 07:40:00', active: true,
      install: 'Stone Trap Door, Feeder House'},
    {id: 10, name: 'Bay 9', status: 'C8911231',
      leavingDateTime:'2025-12-28 13:38:00', active: true,
      install: 'Chopper, Chaff Blower / Spreader'},
     {id: 11, name: 'Bay 10', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Unload Auger'},
    {id: 12, name: 'Testbay 1', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Fluids Filling'},
    {id: 13, name: 'Testbay 2', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Test Run'},
    {id: 14, name: 'Bay 14', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Q-Gate 3'},
    {id: 15, name: 'Bay 15', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Front Ladder'},
    {id: 16, name: 'Bay 16', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Cat Walk cover, Engine Cover'},
    {id: 17, name: 'Bay 17', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Tire MTS Assembly'},
    {id: 18, name: 'Bay 18', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Feeder House Cover, Side Panels'},
    {id: 19, name: 'Bay 19', status: 'C8911231',
       leavingDateTime:'2025-12-29 06:38:00', active: true,
       install: 'Final Q-Gate, repair'},

  ];


}
