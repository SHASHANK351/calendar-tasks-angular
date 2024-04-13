import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { MONTH, MONTHS, TASKTYPES } from './app.constants';
import { layerDataType } from './app.model';
import { TaskListComponent } from './task-list/task-list.component';
import createData from './utils/generate-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'CalendarTasks';
  taskTypeProps = TASKTYPES;
  data: any = [];
  limit = 3;
  view = 'month';
  slide = new Subject<string>();
  today = new Subject<void>();
  layerTrigger = new Subject<layerDataType>();
  from = new Date();
  to = new Date();
  curr = new Date();
  dayStyle = {
    color: '#264554',
    opacity: 0.6,
    'font-size': '12px',
    'letter-spacing': '2.4px',
  };
  otherMonthStyle = {
    'font-size': '12px',
    'letter-spacing': '0.36px',
    color: 'rgba(38, 69, 84, 0.4)',
  };
  currMonthStyle = {
    'font-size': '12px',
    'letter-spacing': '0.36px',
    color: '#264554',
  };

  constructor() {}

  clicked(eve: any, data: any) {
    this.layerTrigger.next({
      component: TaskListComponent,
      props: Object.assign({ months: MONTHS }, data),
      date: data.date,
      popUpStyle: {
        'min-width': 'max-content',
      },
    });
  }
  getData(eve: any) {
    this.from = eve.from;
    this.to = eve.to;
    this.curr = eve.currentMonth;
    setTimeout(() => {
      this.data = JSON.parse(JSON.stringify(createData()));
    }, 0);
  }
  goSlide(val: string) {
    this.slide.next(val);
  }
  goToday() {
    this.today.next();
  }
  viewChange(val: string) {
    this.view = val;
  }
  getDateText() {
    if (this.view.toLowerCase() === MONTH) {
      return MONTHS[this.curr.getMonth()] + ' ' + this.curr.getFullYear();
    }
    let text =
      this.from.getDate() + ' ' + MONTHS[this.from.getMonth()].slice(0, 3);
    if (this.from.getFullYear() !== this.to.getFullYear()) {
      text += ' ' + this.from.getFullYear();
    }
    text += ' - ';
    text += this.to.getDate() + ' ' + MONTHS[this.to.getMonth()].slice(0, 3);
    text += ' ' + this.to.getFullYear();
    return text;
  }
}
