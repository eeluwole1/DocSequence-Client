import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.show(message, 'success', 4000);
  }

  error(message: string): void {
    this.show(message, 'error', 6000);
  }

  show(message: string, kind: ToastKind = 'info', durationMs = 4000): void {
    const id = this.nextId++;
    this.toasts.update((toasts) => [...toasts, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }
}