import { Routes } from '@angular/router';
import { GenerateForm } from './components/generate-form/generate-form';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'generate' },
  { path: 'generate', component: GenerateForm, title: 'Generate · DocSequence' },
  // /history is added in 7C
  { path: '**', redirectTo: 'generate' },
];