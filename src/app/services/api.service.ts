import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Schedule } from '../models/assemblyLine';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api'; // works in dev (proxy) and prod (same origin)

  getReports(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.base}/lineSchedule`);
  }

}
