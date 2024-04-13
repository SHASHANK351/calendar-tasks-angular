import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CalendarProjectionDirective } from '../../app/directives/projection.directive';

@Component({
  selector: 'calendar-day',
  templateUrl: './day.component.html',
  styleUrls: ['./day.component.scss'],
})
export class DayComponent implements OnInit {
  @Input() day: any;
  @Input() date: any;
  @Input() dayIdx: any;
  @Input() sectionTop: any = {};
  @Input() sectionStyle: any = {};
  @Input() compareDates: any;
  @Input() templates: CalendarProjectionDirective[] = [];
  @Input() taskTypeProps: string[] = [];
  @Input() dayProps: string[] = [];
  @Input() limit = 1;
  @Input() valueToSave = 'id';
  @Input() viewStart = 'viewStart';
  @Input() dataViewHeight!: number;
  @Input() dataViewMargin!: number;
  @Input() multiLimitView = false;
  @Input() multiLimitDay: { [key: string]: any } = {};

  constructor(public sanitizer: DomSanitizer) {}

  ngOnInit(): void {}

  getSectionTotal() {
    const tempArr = Object.assign([], this.taskTypeProps);
    tempArr.reverse();
    for (let i = 0; i < tempArr.length; i++) {
      if (this.day[tempArr[i]].length) {
        // const p = this.day[tempArr[i]].length > 1 ? 1 : 0;
        // let top = this.sectionTop[this.day[tempArr[i]][p][this.valueToSave]];
        // top++;
        // top = this.day[tempArr[i]].length > 2 ? top+1 : top;

        const p =
          this.day[tempArr[i]].length > this.limit
            ? this.limit - 1
            : this.day[tempArr[i]].length - 1;
        let top = this.sectionTop[this.day[tempArr[i]][p][this.valueToSave]];
        top++;
        top = this.day[tempArr[i]].length > this.limit ? top + 1 : top;
        if (!this.multiLimitView) {
          let total = 0;
          this.taskTypeProps.forEach((prop) => {
            total += this.multiLimitDay[prop].length;
          });
          if (total > this.limit) {
            top++;
          }
        }
        return top * (this.dataViewHeight + this.dataViewMargin);
      }
    }
    return 0;
  }

  isMore() {
    let total = 0;
    this.taskTypeProps.forEach((prop) => {
      total += this.multiLimitDay[prop].length;
    });
    if (total > this.limit) {
      return true;
    }
    return false;
  }

  getMoreTop() {
    const tempArr = Object.assign([], this.taskTypeProps);
    tempArr.reverse();
    for (let i = 0; i < tempArr.length; i++) {
      if (this.day[tempArr[i]].length) {
        const p =
          this.day[tempArr[i]].length > this.limit
            ? this.limit - 1
            : this.day[tempArr[i]].length - 1;
        let top = this.sectionTop[this.day[tempArr[i]][p][this.valueToSave]];
        top++;
        return top * (this.dataViewHeight + this.dataViewMargin);
      }
    }
    return 0;
  }

  commonTask(task: any) {
    if (
      this.compareDates(this.day.date, task[this.viewStart], '=') ||
      this.dayIdx === 0
    ) {
      if (this.sectionStyle.hasOwnProperty(task[this.valueToSave])) {
        return true;
      }
    }
    return false;
  }
}
