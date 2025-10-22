import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';

interface LineItem {
  _id?: string;
  machine?: string;
  bay_2?: string;
  activeList?: string | boolean | number;
  [key: string]: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false
})

export class App implements OnInit, OnDestroy {
  title = 'Assembly Line';
  fcbStation1Status = '-- free --';
  fcbStation2Status = '-- free --';

  schedules: LineItem[] = [];
  private socket?: Socket;
  private lastSerialized = '';

  get isFcb1Busy(): boolean {
    return (this.fcbStation1Status || '').trim() !== '-- free --';
  }

  constructor(private http: HttpClient, private zone: NgZone) {}

  onMachineTableClick(id?: string): void {
    if (!id) return;
    const url = `/api/lineSchedule/${id}/advance`;
    this.http.post<{ ok: boolean }>(url, {}).subscribe({
      next: (res) => {
        console.log('Advance requested for', id, '->', res?.ok ? 'OK' : 'NO-OP');
        if (res?.ok) {
          // Optimistically remove the item from the visible list when it becomes inactive
          this.schedules = (this.schedules || []).filter(it => it._id !== id);
        }
        // Also refresh FCB status optimistically
        this.fetchFcbStatus();
      },
      error: (err) => {
        console.error('Failed to advance item', id, err);
      }
    });
  }

  ngOnInit(): void {
    // Initial load from REST as fallback/SSR safety
    this.loadLineSchedule();
    this.fetchFcbStatus();

    // Connect to WebSocket for live updates
    const wsUrl = this.getWsUrl();
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('schedule:init', (items: LineItem[]) => {
      this.zone.run(() => this.applyItems(items));
    });

    this.socket.on('schedule:update', (items: LineItem[]) => {
      this.zone.run(() => this.applyItems(items));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }
    this.lastSerialized = '';
  }

  private getWsUrl(): string {
    // Prefer same-origin when served behind proxy; fallback to localhost:5000 in dev
    const loc = window.location;
    if (loc.port && loc.port !== '5000') {
      // Angular dev server (e.g., 4200/4500) -> target backend 5000
      return 'http://localhost:5000';
    }
    return `${loc.protocol}//${loc.hostname}${loc.port ? ':' + loc.port : ''}`;
  }

  private applyItems(items: LineItem[]): void {
    // Server already filters to active items. Just take the first 6 for display.
    const sliced = (items || []).slice(0, 6);
    const serialized = JSON.stringify(sliced);
    if (serialized === this.lastSerialized) {
      // Still refresh FCB status in case only bay occupancy changed
      this.fetchFcbStatus();
      return;
    }
    this.lastSerialized = serialized;
    this.schedules = sliced;
    // Refresh FCB status whenever schedule changes
    this.fetchFcbStatus();
  }

  private fetchFcbStatus(): void {
    this.http.get<{ fcb1Machine: string | null }>('/api/fcbStatus').subscribe({
      next: (data) => {
        const machine = data?.fcb1Machine || '';
        this.fcbStation1Status = machine && machine.trim().length > 0 ? machine : '-- free --';
      },
      error: (err) => {
        console.error('Failed to load FCB status', err);
        this.fcbStation1Status = '-- free --';
      }
    });
  }

  private loadLineSchedule(): void {
    const url = '/api/lineSchedule';
    this.http.get<LineItem[]>(url).subscribe({
      next: (items) => this.applyItems(items),
      error: (err) => {
        console.error('Failed to load line schedule', err);
        this.schedules = [];
      }
    });
  }

}
