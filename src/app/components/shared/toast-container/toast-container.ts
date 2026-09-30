import { Component, inject } from '@angular/core';
import { ToastKind, ToastService } from '../../../services/toast';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);

  protected classesFor(kind: ToastKind): string {
    switch (kind) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      default:
        return 'bg-slate-800 text-white';
    }
  }
}