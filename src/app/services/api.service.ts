import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Report } from '../models/assemblyLine';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api'; // works in dev (proxy) and prod (same origin)

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.base}/reports`);
  }

  createReport(payload: Partial<Report>): Observable<Report> {
    return this.http.post<Report>(`${this.base}/reports`, payload);
  }
}
