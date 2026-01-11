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
    // 1. Create a map for quick lookup: stationId -> { status_a, status_b, leavingDateTime, machineId }
    const stationDataMap = new Map<number, { status_a: string, status_b: string, leavingDateTime: string, machineId: string }>();

    if (Array.isArray(assemblies)) {
      assemblies.forEach(doc => {
        if (!doc) return;

        let stationId: number | undefined;
        let sA: string | undefined;
        let sB: string | undefined;

        // Check station array
        if (Array.isArray(doc.station)) {
          doc.station.forEach((item: any) => {
            if (item && typeof item === 'object') {
              const sId = item.stationId ?? item.station;
              if (sId != null) {
                const num = Number(sId);
                if (!isNaN(num)) stationId = num;
              }
              const valA = item.status_a ?? item.station_a;
              if (valA != null) sA = String(valA);

              const valB = item.status_b ?? item.station_b;
              if (valB != null) sB = String(valB);
            } else if (item != null) {
               // Fallback if item itself is the stationId or name
               if (typeof item === 'number') stationId = item;
               else if (typeof item === 'string') {
                 const num = Number(item);
                 if (!isNaN(num)) stationId = num;
                 else sA = item;
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
        if (rootA != null && typeof rootA !== 'object') sA = String(rootA);

        if (stationId !== undefined) {
          const existing = stationDataMap.get(stationId) || { status_a: '', status_b: '', leavingDateTime: '', machineId: '' };

          if (sA) {
            existing.status_a = sA;
            existing.machineId = doc._id;
            // Prioritize leavingDateTime from slot A
            let timeVal = doc.bay_2;
            if (stationId === 4) timeVal = doc.bay_3;
            else if (stationId === 5) timeVal = doc.bay_4;
            else if (stationId === 6) timeVal = doc.bay_5;
            else if (stationId === 7) timeVal = doc.bay_6;
            else if (stationId === 8) timeVal = doc.bay_7;
            else if (stationId === 9) timeVal = doc.bay_8;
            else if (stationId === 10) timeVal = doc.bay_9;
            else if (stationId === 11) timeVal = doc.bay_10;
            else if (stationId === 12) timeVal = doc.test_1;
            else if (stationId === 13) timeVal = doc.test_2;
            else if (stationId === 14) timeVal = doc.bay_14;
            else if (stationId === 15) timeVal = doc.bay_15;
            else if (stationId === 16) timeVal = doc.bay_16;
            else if (stationId === 17) timeVal = doc.bay_17;
            else if (stationId === 18) timeVal = doc.bay_18;
            else if (stationId === 19) timeVal = doc.bay_19;

            if (timeVal) existing.leavingDateTime = timeVal;
          } else if (sB) {
            existing.status_b = sB;
            // Only use slot B if slot A is not already set for this station
            if (!existing.status_a) {
              existing.machineId = doc._id;
              let timeVal = doc.bay_2;
              if (stationId === 4) timeVal = doc.bay_3;
              else if (stationId === 5) timeVal = doc.bay_4;
              else if (stationId === 6) timeVal = doc.bay_5;
              else if (stationId === 7) timeVal = doc.bay_6;
              else if (stationId === 8) timeVal = doc.bay_7;
              else if (stationId === 9) timeVal = doc.bay_8;
              else if (stationId === 10) timeVal = doc.bay_9;
              else if (stationId === 11) timeVal = doc.bay_10;
              else if (stationId === 12) timeVal = doc.test_1;
              else if (stationId === 13) timeVal = doc.test_2;
              else if (stationId === 14) timeVal = doc.bay_14;
              else if (stationId === 15) timeVal = doc.bay_15;
              else if (stationId === 16) timeVal = doc.bay_16;
              else if (stationId === 17) timeVal = doc.bay_17;
              else if (stationId === 18) timeVal = doc.bay_18;
              else if (stationId === 19) timeVal = doc.bay_19;

              if (timeVal) existing.leavingDateTime = timeVal;
            }
          }

          stationDataMap.set(stationId, existing);
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
          status_b: data.status_b,
          leavingDateTime: data.leavingDateTime || ((b.id === 6 || b.id === 8) ? '0' : ''),
          machineId: data.machineId
        };
      } else {
        return {
          ...b,
          status_a: '',
          status_b: '',
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
    if (bayId === 1 || bayId === 2 || bayId === 3 || bayId === 4 || bayId === 5 || bayId === 6 || bayId === 7 || bayId === 8 || bayId === 9 || bayId === 10 || bayId === 11 || bayId === 12 || bayId === 13 || bayId === 14 || bayId === 15 || bayId === 16 || bayId === 17 || bayId === 18 || bayId === 19) {
      const currentBay = this.bays.find(b => b.id === bayId);
      if (!currentBay || !currentBay.machineId) return;

      let targetStationId = bayId + 1;

      // Requirement 2c: if at station 4/5/6/7/8/9/10/11/14/15/16/17/18/19 and slot b occupied but slot a empty, stay at same station but move to a
      if ((bayId === 4 || bayId === 5 || bayId === 6 || bayId === 7 || bayId === 8 || bayId === 9 || bayId === 10 || bayId === 11 || bayId === 14 || bayId === 15 || bayId === 16 || bayId === 17 || bayId === 18 || bayId === 19) && !currentBay.status_a && currentBay.status_b) {
        targetStationId = bayId;
      }

      const machineName = currentBay.status_a || currentBay.status_b;
      const machineId = currentBay.machineId;

      const apiBase = this.getBackendUrl() ? `${this.getBackendUrl()}/api` : '/api';

      // Optimistic update
      const sourcePatch: Partial<BayModel> = { leavingDateTime: '', machineId: undefined };
      if (currentBay.status_a) sourcePatch.status_a = '';
      else sourcePatch.status_b = '';
      this.updateBay(bayId, sourcePatch);

      const targetBay = this.bays.find(b => b.id === targetStationId);
      if (targetBay) {
        const patch: Partial<BayModel> = { machineId: machineId };
        if ((targetStationId === 4 || targetStationId === 5 || targetStationId === 6 || targetStationId === 7 || targetStationId === 8 || targetStationId === 9 || targetStationId === 10 || targetStationId === 11 || targetStationId === 12 || targetStationId === 14 || targetStationId === 15 || targetStationId === 16 || targetStationId === 17 || targetStationId === 18 || targetStationId === 19) && targetBay.status_a) {
          patch.status_b = machineName;
        } else {
          patch.status_a = machineName;
        }
        this.updateBay(targetStationId, patch);
      }

      this.http.patch(`${apiBase}/lineSchedule/moveToStation`, {
        id: machineId,
        stationId: targetStationId,
        machine: machineName
      }).subscribe({
        next: (res: any) => {
          console.log(`Machine moved from ${bayId} to ${targetStationId} successfully`, res);
          // Requirement: Collect correct bay_X field
          if (res.data) {
            let timeVal = res.data.bay_2;
            if (targetStationId === 4) timeVal = res.data.bay_3;
            if (targetStationId === 5) timeVal = res.data.bay_4;
            if (targetStationId === 6) timeVal = res.data.bay_5;
            if (targetStationId === 7) timeVal = res.data.bay_6;
            if (targetStationId === 8) timeVal = res.data.bay_7;
            if (targetStationId === 9) timeVal = res.data.bay_8;
            if (targetStationId === 10) timeVal = res.data.bay_9;
            if (targetStationId === 11) timeVal = res.data.bay_10;
            if (targetStationId === 12) timeVal = res.data.test_1;
            if (targetStationId === 13) timeVal = res.data.test_2;
            if (targetStationId === 14) timeVal = res.data.bay_14;
            if (targetStationId === 15) timeVal = res.data.bay_15;
            if (targetStationId === 16) timeVal = res.data.bay_16;
            if (targetStationId === 17) timeVal = res.data.bay_17;
            if (targetStationId === 18) timeVal = res.data.bay_18;
            if (targetStationId === 19) timeVal = res.data.bay_19;

            if (timeVal) {
              this.updateBay(targetStationId, { leavingDateTime: timeVal });
            }
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
    if (bay.id === 3) {
      const bay4 = this.bays.find(b => b.id === 4);
      return !!(bay4 && bay4.status_b);
    }
    if (bay.id === 4) {
      const bay5 = this.bays.find(b => b.id === 5);
      return !!(bay5 && bay5.status_b);
    }
    if (bay.id === 5) {
      const bay6 = this.bays.find(b => b.id === 6);
      return !!(bay6 && bay6.status_b);
    }
    if (bay.id === 6) {
      const bay7 = this.bays.find(b => b.id === 7);
      return !!(bay7 && bay7.status_b);
    }
    if (bay.id === 7) {
      const bay8 = this.bays.find(b => b.id === 8);
      return !!(bay8 && bay8.status_b);
    }
    if (bay.id === 8) {
      const bay9 = this.bays.find(b => b.id === 9);
      return !!(bay9 && bay9.status_b);
    }
    if (bay.id === 9) {
      const bay10 = this.bays.find(b => b.id === 10);
      return !!(bay10 && bay10.status_b);
    }
    if (bay.id === 10) {
      const bay11 = this.bays.find(b => b.id === 11);
      return !!(bay11 && bay11.status_b);
    }
    if (bay.id === 11) {
      const bay12 = this.bays.find(b => b.id === 12);
      return !!(bay12 && bay12.status_b);
    }
    if (bay.id === 12) {
      const bay13 = this.bays.find(b => b.id === 13);
      return !!(bay13 && bay13.status_a);
    }
    if (bay.id === 13) {
      const bay14 = this.bays.find(b => b.id === 14);
      return !!(bay14 && bay14.status_b);
    }
    if (bay.id === 14) {
      const bay15 = this.bays.find(b => b.id === 15);
      return !!(bay15 && bay15.status_b);
    }
    if (bay.id === 15) {
      const bay16 = this.bays.find(b => b.id === 16);
      return !!(bay16 && bay16.status_b);
    }
    if (bay.id === 16) {
      const bay17 = this.bays.find(b => b.id === 17);
      return !!(bay17 && bay17.status_b);
    }
    if (bay.id === 17) {
      const bay18 = this.bays.find(b => b.id === 18);
      return !!(bay18 && bay18.status_b);
    }
    if (bay.id === 18) {
      const bay19 = this.bays.find(b => b.id === 19);
      return !!(bay19 && bay19.status_b);
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


