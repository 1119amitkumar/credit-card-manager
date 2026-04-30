import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'card/:id', loadComponent: () => import('./components/card-detail/card-detail').then(m => m.CardDetail) },
  { path: 'lounge', loadComponent: () => import('./components/lounge-dashboard/lounge-dashboard').then(m => m.LoungeDashboard) },
  { path: 'insurance', loadComponent: () => import('./components/insurance-dashboard/insurance-dashboard').then(m => m.InsuranceDashboard) },
  { path: '**', redirectTo: '' },
];
