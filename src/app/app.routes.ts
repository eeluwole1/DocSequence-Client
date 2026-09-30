import { Routes } from '@angular/router';
import { GenerateForm } from './components/generate-form/generate-form';
import { HistoryList } from './components/history-list/history-list';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'generate' },
  { path: 'generate', component: GenerateForm, title: 'Generate · DocSequence' },
  { path: 'history', component: HistoryList, title: 'History · DocSequence' },
  { path: '**', redirectTo: 'generate' },
];