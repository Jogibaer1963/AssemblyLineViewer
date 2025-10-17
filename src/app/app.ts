import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface LineItem {
  _id?: string;
  machine?: string;
  bay_2?: string;
  activeList?: boolean;
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
  fcbStation1Text = '';
  fcbStation2Text = '';

  schedules: LineItem[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Load line schedule for machine table
    this.loadLineSchedule();
  }

  ngOnDestroy(): void {
    // Räume den Interval auf, wenn die Komponente zerstört wird
  }


  private loadLineSchedule(): void {
    const url = 'http://localhost:5000/api/lineSchedule';
    this.http.get<LineItem[]>(url).subscribe({
      next: (items) => {
        console.log('Loaded line schedule:', items);
        const filtered = (items || []).filter(item =>
          item?.activeList === true);
        this.schedules = filtered.slice(0, 6);
      },
      error: (err) => {
        console.error('Failed to load line schedule', err);
        this.schedules = [];
      }
    });
  }


  onMachineRowClick(machine: LineItem, index: number): void {
    // Only act when the first row is clicked
    if (index === 0 && machine?.machine) {
      this.fcbStation1Text = machine.machine;
    }
  }


}
