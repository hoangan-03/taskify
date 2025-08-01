import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalendarComponent, DownloadedComponent, InboxComponent, TodoComponent } from './pages';
const routes: Routes = [
  { path: 'todo', component: TodoComponent },
  { path: 'inbox', component: InboxComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'downloaded', component: DownloadedComponent },
  { path: '', redirectTo: '/angular/todo', pathMatch: 'full' },
  { path: '**', redirectTo: '/angular/todo' }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AngularRoutingModule { }