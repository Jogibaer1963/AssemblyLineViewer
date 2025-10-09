import { Component, OnInit, OnDestroy } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false
})

export class App implements OnInit, OnDestroy {
  title = 'Assembly Line';
  statusText1 = 'C8911289';
  statusText2 = 'C8911290';
  timerBay2 = '';  // Wird mit der Uhr gefüllt

  private clockInterval: any;

  ngOnInit(): void {
    // Initialisiere die Uhr
    this.updateClock();

    // Aktualisiere die Uhr jede Sekunde
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  ngOnDestroy(): void {
    // Räume den Interval auf, wenn die Komponente zerstört wird
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  updateClock(): void {
    const now = new Date();
    const hours = this.pad2(now.getHours());
    const minutes = this.pad2(now.getMinutes());
    const seconds = this.pad2(now.getSeconds());
    this.timerBay2 = `${hours}:${minutes}:${seconds}`;
  }

  pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  moveToNextBay(from: string, to: string): void {
    console.log(`Moving from ${from} to ${to}`);
    // Ihre Logik hier
  }
}
