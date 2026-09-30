import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AllocationResponse } from '../../models/allocation';
import { DocumentType } from '../../models/document-type';
import { ProblemDetails } from '../../models/problem-details';
import { DocumentNumberService } from '../../services/document-number';
import { DocumentTypeService } from '../../services/document-type';
import { ToastService } from '../../services/toast';
import { Button } from '../shared/button/button';
import { Card } from '../shared/card/card';

// FR-001/FR-002: whitespace-only is not a name (the API enforces this too; this is usability only)
function notBlank(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').trim().length > 0 ? null : { blank: true };
}

@Component({
  selector: 'app-generate-form',
  imports: [ReactiveFormsModule, DatePipe, Card, Button],
  templateUrl: './generate-form.html',
  styleUrl: './generate-form.css',
})
export class GenerateForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly documentNumberService = inject(DocumentNumberService);
  private readonly toastService = inject(ToastService);

  protected readonly types = signal<DocumentType[]>([]);
  protected readonly typesError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly result = signal<AllocationResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly copied = signal(false);

  // One key per logical submission (SRS §6.2, US-003): reused when the same request is
  // retried after a failure, replaced after a success or when the user edits the form.
  private requestKey = crypto.randomUUID();

  protected readonly form = this.fb.group({
    engineerName: ['', [notBlank, Validators.maxLength(100)]],
    documentName: ['', [notBlank, Validators.maxLength(200)]],
    documentTypeId: [0, [Validators.min(1)]],
  });

  constructor() {
    this.documentTypeService.getActive().subscribe({
      next: (types) => this.types.set(types),
      error: () => this.typesError.set('Document types could not be loaded. Is the API running?'),
    });

    // Changed input = a different logical request, so it gets a new key
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (!this.submitting()) {
        this.requestKey = crypto.randomUUID();
      }
    });
  }

  protected isInvalid(name: 'engineerName' | 'documentName' | 'documentTypeId'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) {
      return; // double-click guard (SRS §14)
    }

    const { engineerName, documentName, documentTypeId } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.result.set(null);
    this.copied.set(false);

    this.documentNumberService
      .allocate({
        engineerName: engineerName.trim(),
        documentName: documentName.trim(),
        documentTypeId,
        requestKey: this.requestKey,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (allocation) => {
          this.result.set(allocation);
          this.toastService.success(`${allocation.generatedIdentifier} generated`);
          this.form.controls.documentName.reset(); // keep engineer and type for the next document
          this.requestKey = crypto.randomUUID();
        },
        error: (err: HttpErrorResponse) => this.error.set(describeError(err)),
      });
  }

  protected async copy(identifier: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(identifier);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.toastService.error('Copy failed. Select the identifier and copy it manually.');
    }
  }
}

// Turns the API's ProblemDetails (SRS §13.5) into one readable sentence
function describeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'The server could not be reached.';
  }
  const problem = err.error as ProblemDetails | null;
  if (problem?.errors) {
    return Object.values(problem.errors).flat().join(' ');
  }
  return problem?.detail ?? problem?.title ?? `Unexpected error (HTTP ${err.status}).`;
}