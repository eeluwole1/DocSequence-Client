import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DocumentType } from '../models/document-type';

@Injectable({ providedIn: 'root' })
export class DocumentTypeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/document-types`;

  getActive(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(this.apiUrl);
  }
}