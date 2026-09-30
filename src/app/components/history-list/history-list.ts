import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AllocationSummary } from '../../models/allocation';
import { DocumentType } from '../../models/document-type';
import { PagedResponse } from '../../models/paged-response';
import { DocumentNumberService } from '../../services/document-number';
import { DocumentTypeService } from '../../services/document-type';
import { Button } from '../shared/button/button';
import { Card } from '../shared/card/card';

@Component({
  selector: 'app-history-list',
  imports: [ReactiveFormsModule, DatePipe, Card, Button],
  templateUrl: './history-list.html',
  styleUrl: './history-list.css',
})
export class HistoryList {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly documentNumberService = inject(DocumentNumberService);
  private readonly documentTypeService = inject(DocumentTypeService);

  protected readonly pageSize = 20;
  protected readonly types = signal<DocumentType[]>([]);
  protected readonly result = signal<PagedResponse<AllocationSummary> | null>(null);
  protected readonly pageNumber = signal(1);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filters = this.fb.group({
    documentTypeId: [0],
    engineer: [''],
    identifier: [''],
    from: [''], // yyyy-MM-dd from <input type="date">, a local calendar day
    to: [''],
  });

  constructor() {
    this.documentTypeService.getActive().subscribe({ next: (types) => this.types.set(types) });
    this.load();
  }

  protected search(): void {
    this.pageNumber.set(1);
    this.load();
  }

  protected clear(): void {
    this.filters.reset();
    this.search();
  }

  protected goTo(page: number): void {
    this.pageNumber.set(page);
    this.load();
  }

  private load(): void {
    const f = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.documentNumberService
      .getHistory({
        documentTypeId: f.documentTypeId || undefined,
        engineer: f.engineer.trim() || undefined,
        identifier: f.identifier.trim() || undefined,
        // The user picks local days; the API filters in UTC (SRS §13.3), so convert the day bounds
        from: f.from ? new Date(`${f.from}T00:00:00`).toISOString() : undefined,
        to: f.to ? new Date(`${f.to}T23:59:59.999`).toISOString() : undefined,
        page: this.pageNumber(),
        pageSize: this.pageSize,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.result.set(result),
        error: () => this.error.set('History could not be loaded. Is the API running?'),
      });
  }
}