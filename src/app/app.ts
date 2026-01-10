import { Component, inject, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Clock } from './clock/clock';
import { Bay } from './bay/bay';
import {Table} from './table/table';
import { Arrow } from './arrow/arrow';
import { io, Socket } from 'socket.io-client';

  type BayModel = {
  id: number;
  name: string;
  status_a: string;
  status_b: string;
  leavingDateTime: string;
  active: boolean;
  install: string;
  startTime?: number;
  machineId?: string;
};


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Clock, Bay, Table, Arrow],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

class App implements OnInit, OnDestroy {
  title = 'Assembly Line Viewer';
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private socket: Socket;
  private baseTime = this.getPersistentBaseTime();

  constructor() {
    const backendUrl = this.getBackendUrl();
    console.log('App: connecting to socket at', backendUrl);
    this.socket = io(backendUrl);

    // Set up listeners immediately in constructor to avoid missing initial events
    this.socket.on('assembly:init', (data: any) => {
      console.log('App: received assembly init', data);
      const assemblies = Array.isArray(data) ? data : (data?.data || []);
      this.zone.run(() => this.syncBays(assemblies));
    });

    this.socket.on('assembly:update', (payload: any) => {
      console.log('App: received assembly update', payload);
      const assemblies = Array.isArray(payload) ? payload : (payload.data || []);
      this.zone.run(() => this.syncBays(assemblies));
    });
  }

  ngOnInit() {
    this.loadActiveAssemblies();
  }

  ngOnDestroy() {
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

  private loadActiveAssemblies() {
    const apiBase = this.getBackendUrl() ? `${this.getBackendUrl()}/api` : '/api';
    console.log('App: loading active assemblies from', `${apiBase}/lineSchedule/activeAssembly`);

    this.http.get<any[]>(`${apiBase}/lineSchedule/activeAssembly`)
      .subscribe({
        next: (data) => {
          console.log('App: loaded active assemblies', data);
          this.syncBays(data);
        },
        error: (err) => console.error('App: Failed to load active assemblies', err)
      });
  }

  private syncBays(assemblies: any[]) {
    // 1. Create a map for quick lookup: stationId -> { status_a, leavingDateTime, machineId }
    const stationDataMap = new Map<number, { status_a: string, leavingDateTime: string, machineId: string }>();

    if (Array.isArray(assemblies)) {
      assemblies.forEach(doc => {
        if (!doc) return;

        let stationId: number | undefined;
        let status_a: string | undefined;

        // Check station array
        if (Array.isArray(doc.station)) {
          doc.station.forEach((item: any) => {
            if (item && typeof item === 'object') {
              const sId = item.stationId ?? item.station;
              if (sId != null) {
                const num = Number(sId);
                if (!isNaN(num)) stationId = num;
              }
              const sA = item.status_a ?? item.station_a;
              if (sA != null) status_a = String(sA);
            } else if (item != null) {
               // Fallback if item itself is the stationId or name
               if (typeof item === 'number') stationId = item;
               else if (typeof item === 'string') {
                 const num = Number(item);
                 if (!isNaN(num)) stationId = num;
                 else status_a = item;
               }
            }
          });
        }
        // Also check if stationId/status_a are at root level
        const rootId = doc.stationId ?? doc.station;
        if (rootId != null && typeof rootId !== 'object') {
          const num = Number(rootId);
          if (!isNaN(num)) stationId = num;
        }
        const rootA = doc.status_a ?? doc.station_a;
        if (rootA != null && typeof rootA !== 'object') status_a = String(rootA);

        if (stationId !== undefined) {
          stationDataMap.set(stationId, {
            status_a: status_a || '',
            leavingDateTime: doc.bay_2 || '',
            machineId: doc._id
          });
        }
      });
    }

    // 2. Update all bays
    this.bays = this.bays.map(b => {
      const data = stationDataMap.get(b.id);
      if (data) {
        return {
          ...b,
          status_a: data.status_a,
          leavingDateTime: data.leavingDateTime || ((b.id === 6 || b.id === 8) ? '0' : ''),
          machineId: data.machineId
        };
      } else {
        return {
          ...b,
          status_a: '',
          leavingDateTime: (b.id === 6 || b.id === 8) ? '0' : '',
          machineId: undefined
        };
      }
    });

    this.cdr.detectChanges();
  }

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
     {id: 4, name: 'Bay 3', status_a: '', status_b: '',
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
    {id: 12, name: 'Test-bay 1', status_a: '', status_b: '',
       leavingDateTime:'', active: true,
       install: 'Fluids Filling', startTime: this.baseTime},
    {id: 13, name: 'Test-bay 2', status_a: '', status_b: '',
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
  onMachineSelected(machine: any) {
    const stationId = 1;
    // Initial UI update
    this.updateBay(stationId, {
      status_a: machine.machine,
      leavingDateTime: machine.bay_2,
      machineId: machine._id
    });

    const apiBase = this.getBackendUrl() ? `${this.getBackendUrl()}/api` : '/api';

    this.http.patch(`${apiBase}/lineSchedule/moveToStation`, {
      id: machine._id,
      stationId: stationId,
      machine: machine.machine
    }).subscribe({
      next: (res: any) => {
        console.log('Machine moved successfully', res);
        // Requirement 7: Update status_a from Document Field "station: [{stationId: id}, {status_a: machine}]"
        if (res.data && Array.isArray(res.data.station)) {
          let found_status_a = '';
          res.data.station.forEach((s: any) => {
            const val = s?.status_a ?? s?.station_a;
            if (val != null) found_status_a = String(val);
          });
          if (found_status_a) {
            this.updateBay(stationId, { status_a: found_status_a });
          }
        }
      },
      error: (err) => console.error('Failed to move machine', err)
    });
  }

  onMoveRequest(bayId: number) {
    if (bayId === 1 || bayId === 2) {
      const currentBay = this.bays.find(b => b.id === bayId);
      if (!currentBay || !currentBay.machineId) return;

      const targetStationId = bayId + 1;
      const machineName = currentBay.status_a;
      const machineId = currentBay.machineId;
      const bayValue = currentBay.leavingDateTime;

      const apiBase = this.getBackendUrl() ? `${this.getBackendUrl()}/api` : '/api';

      // Optimistic update
      this.updateBay(bayId, { status_a: '', leavingDateTime: '', machineId: undefined });
      this.updateBay(targetStationId, {
        status_a: machineName,
        leavingDateTime: bayValue,
        machineId: machineId
      });

      this.http.patch(`${apiBase}/lineSchedule/moveToStation`, {
        id: machineId,
        stationId: targetStationId,
        machine: machineName
      }).subscribe({
        next: (res: any) => {
          console.log(`Machine moved from ${bayId} to ${targetStationId} successfully`, res);
          // Requirement 4: Collect bay_2 from Document and store in leavingDateTime
          if (res.data && res.data.bay_2) {
            this.updateBay(targetStationId, { leavingDateTime: res.data.bay_2 });
          }
        },
        error: (err) => {
          console.error(`Failed to move machine from ${bayId} to ${targetStationId}`, err);
          this.loadActiveAssemblies(); // Rollback/Sync with server
        }
      });
    }
  }

  isMoveDisabled(bay: BayModel): boolean {
    if (bay.id === 1 || bay.id === 2) {
      const nextBay = this.bays.find(b => b.id === bay.id + 1);
      return !!(nextBay && nextBay.status_a);
    }
    return false;
  }

  updateBay(id: number, patch: Partial<BayModel>) {
    const i = this.bays.findIndex(b => b.id === id);
    if (i === -1) return;

    // replace ONLY that element; others keep their same references
    this.bays = this.bays.map(b =>
      (b.id === id ? { ...b, ...patch } : b));
  }

}

export default App


