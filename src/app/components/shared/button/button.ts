import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
})
export class Button {
  readonly type = input<'button' | 'submit'>('button');
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly block = input(false);

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
    const variant =
      this.variant() === 'primary'
        ? 'bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-700'
        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400';
    return `${base} ${variant} ${this.block() ? 'w-full' : ''}`;
  });
}