import { Component } from '@angular/core';


export interface Bay {
  bay: number;
  machine: string | null;
  status: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false
})

export class App {
  title = 'Assembly Line';

  bays: Bay[] = [
    { bay: 1, machine: 'C8911231', status: 'Frame' }
  ];

  views = [
    { id: 'hud', label: 'Move' },
  ];

  view: string = 'grid';
  query = '';

  trackByView = (_: number, v: {id: string, label: string}) => v.id;

  pad2(n: number): string { return String(n).padStart(2, '0'); }

  get filtered(): Bay[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.bays;
    return this.bays.filter(b =>
      (b.machine || '').toLowerCase().includes(q) || String(b.bay).includes(q)
    );
  }

}
