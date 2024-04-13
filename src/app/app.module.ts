import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CalendarComponent } from './calendar/calendar.component';
import { DayComponent } from './day/day.component';
import { ComponentHostDirective } from './directives/component-host.directive';
import { CalendarProjectionDirective } from './directives/projection.directive';
import { TaskListComponent } from './task-list/task-list.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    AppComponent,
    CalendarComponent,
    DayComponent,
    CalendarProjectionDirective,
    ComponentHostDirective,
    TaskListComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
  ],
  exports: [CalendarComponent, CalendarProjectionDirective],
  providers: [],
  bootstrap: [AppComponent],
})
export class CalendarTasksModule {}
