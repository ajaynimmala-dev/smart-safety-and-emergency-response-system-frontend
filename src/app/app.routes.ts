import { Routes } from '@angular/router';

import { LoginComponent } from './component/login/login';
import { RegisterComponent } from './component/register/register';
import { DashboardComponent } from './component/dashboard/dashboard';

export const routes: Routes = [
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
