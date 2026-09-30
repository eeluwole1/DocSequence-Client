import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AllocateRequest, AllocationResponse, AllocationSummary } from '../models/allocation';
import { HistoryQuery } from '../models/history-query';
import { PagedResponse } from '../models/paged-response';

@Injectable({ providedIn: 'root' })
export class DocumentNumberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/document-numbers`;

  allocate(request: AllocateRequest): Observable<AllocationResponse> {
    return this.http.post<AllocationResponse>(this.apiUrl, request);
  }

  getHistory(query: HistoryQuery): Observable<PagedResponse<AllocationSummary>> {
    // Only send filters that have a value
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<PagedResponse<AllocationSummary>>(this.apiUrl, { params });
  }
}