import {
  Component,
  ContentChildren,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  EventEmitter,
  ViewChild,
  OnDestroy,
  ViewChildren,
  ElementRef,
  ComponentFactoryResolver,
  NgZone,
} from '@angular/core';
import { CalendarProjectionDirective } from '../../app/directives/projection.directive';
import { Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ComponentHostDirective } from '../directives/component-host.directive';
import { DAYS, MONTH, TIMEDAYDIVISOR, WEEK } from '../app.constants';
import { ObjectType, layerDataType } from '../app.model';

class ResizeObservable extends Observable<ResizeObserverEntry[]> {
  constructor(elem: HTMLElement, private ngZone: NgZone) {
    super((subscriber) => {
      const ro = new ResizeObserver((entries) => {
        this.ngZone.run(() => subscriber.next(entries));
      });
      ro.observe(elem);
      return function unsubscribe() {
        ro.unobserve(elem);
        ro.disconnect();
      };
    });
  }
}

@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit, OnChanges, OnDestroy {
  weeks: any[] = [];
  sectionTop: any = {};
  sectionStyle: any = {};
  days = DAYS;
  tempWeeks: any[] = [];
  curr = new Date();
  from = new Date();
  to = new Date();
  dayEnd = 6;
  subscriptions: Subscription[] = [];
  @Input() taskTypeProps: string[] = [];
  @Input() dayProps: string[] = [];
  @Input() data: any[] = [];
  @Input() valueToSave = 'id';
  @Input() limit = 1;
  @Input() view = WEEK;
  @Input() dayStart = 0;
  @Input() taskTypeKey = 'type';
  @Input() viewStart = 'viewStart';
  @Input() viewEnd = 'viewEnd';
  @Input() dayStyle = {};
  @Input() otherMonthStyle: any = {};
  @Input() currMonthStyle: any = {};
  @Input() popUpClose = 'popUpClose';
  @Input() dataViewHeight = 30;
  @Input() dataViewMargin = 5;
  @Input() layerTrigger!: Observable<layerDataType>;
  @Input() slide!: Observable<string>;
  @Input() today!: Observable<void>;
  @Output() datesChange = new EventEmitter();
  @Output() dayClickEvent = new EventEmitter();
  @ContentChildren(CalendarProjectionDirective)
  templates!: QueryList<CalendarProjectionDirective>;
  @ViewChild(ComponentHostDirective, { static: false })
  compHost!: ComponentHostDirective;
  @ViewChild('calendar', { static: false }) calendar!: ElementRef;
  @ViewChildren('weeksRef') weeksList!: QueryList<ElementRef>;
  closeSub: any;
  layerStyle = {
    top: '0px',
    left: '0px',
  };
  resizeObserverSubscription!: Subscription;
  displayPopUp = false;
  overlay: any;
  closeEvent!: EventEmitter<any> | null;

  @Input() multiLimitView = false;
  multiLimitData: any[] = [];

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.slide) {
      this.subscriptions.push(
        this.slide.subscribe((val) => {
          if (val === 'next') {
            this.next();
          } else if (val === 'back') {
            this.back();
          }
        })
      );
    }
    if (this.today) {
      this.subscriptions.push(this.today.subscribe(() => this.goToday()));
    }
    if (this.layerTrigger) {
      this.subscriptions.push(
        this.layerTrigger.subscribe((val) => {
          this.layerStyle = {
            top: '0px',
            left: '0px',
          };
          this.clearLayer('flush');
          if (!val.component) {
            return;
          }
          this.displayPopUp = true;
          this.popUpPosition(val);
          this.resizeObserverSubscription = new ResizeObservable(
            this.calendar.nativeElement,
            this.ngZone
          )
            .pipe(debounceTime(200))
            .subscribe(() => this.popUpPosition(val));
          setTimeout(() => {
            const compFactory =
              this.componentFactoryResolver.resolveComponentFactory(
                val.component
              );
            const comp: any =
              this.compHost.viewContainerRef.createComponent(compFactory);
            if (val.overlay) {
              this.overlay = val.overlay;
            }
            if (val.closeEvent) {
              this.closeEvent = val.closeEvent;
            } else {
              this.closeEvent = null;
            }
            if (typeof val.props === 'object') {
              Object.keys(val.props).forEach(
                (key: string) => (comp.instance[key] = val.props![key])
              );
            }
            if (comp.instance[this.popUpClose]) {
              this.closeSub = comp.instance[this.popUpClose].subscribe(
                (res: any) => {
                  this.clearLayer(res);
                }
              );
            }
          });
        })
      );
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      !(
        Object.keys(changes).length === 3 &&
        changes['slide'] &&
        changes['today'] &&
        changes['layerTrigger']
      )
    ) {
      this.clearLayer('flush');
    }
    if (changes['dayStart'] && changes['dayStart'].currentValue) {
      this.setDays();
    }
    if (changes['view']) {
      if (changes['view'].currentValue) {
        this.goToday();
      }
    }
    if (changes['data'] && !changes['data'].firstChange) {
      if (Array.isArray(changes['data'].currentValue)) {
        this.formatData();
      }
    }
  }

  ngOnDestroy(): void {
    this.clearLayer('flush');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  dayClick(event: any, date: any, day: any) {
    if (
      event.target.className.includes('daySection') ||
      event.target.className.includes('taskSection')
    ) {
      this.dayClickEvent.next({ date, day });
    }
  }
  overlayClick() {
    if (this.overlay && this.overlay.backdrop) {
      this.clearLayer('overlay');
    }
  }
  popUpPosition(val: any) {
    this.layerStyle = {
      top: '0px',
      left: '0px',
    };
    if (
      val.date &&
      new Date(val.date) instanceof Date &&
      !isNaN(new Date(val.date).valueOf())
    ) {
      const day = new Date(this.from.toLocaleDateString());
      const check = new Date(new Date(val.date).toLocaleDateString());
      let count = 0;
      while (day.getTime() <= check.getTime()) {
        day.setDate(day.getDate() + 1);
        count++;
      }
      let vertical = 0;
      vertical = Math.floor(count / 7);
      if (count % 7 === 0) {
        vertical--;
      }
      const horizontal = count - vertical * 7;
      let arr = this.weeksList.toArray();
      let top = 0;
      let left = 0;
      let i = 0;
      for (; i < vertical; i++) {
        top += arr[i].nativeElement.offsetHeight;
      }
      left += (horizontal - 1) * (arr[i].nativeElement.offsetWidth / 7);
      this.layerStyle = {
        top: top + 'px',
        left: left + 0.5 + 'px',
      };
    }
    if (val.popUpStyle) {
      if (val.popUpStyle['left']) {
        this.layerStyle.left =
          (Number(this.layerStyle.left.split('px')[0]) << 1) + 'px';
      }
      if (val.popUpStyle['top']) {
        this.layerStyle.top =
          (Number(this.layerStyle.top.split('px')[0]) << 1) + 'px';
      }
      const obj = Object.assign({}, val.popUpStyle);
      delete obj['left'];
      delete obj['right'];
      Object.assign(this.layerStyle, obj);
    }
  }
  clearLayer(val: any) {
    if (this.compHost) {
      this.compHost.viewContainerRef.clear();
    }
    if (this.closeSub) {
      this.closeSub.unsubscribe();
    }
    if (this.resizeObserverSubscription) {
      this.resizeObserverSubscription.unsubscribe();
    }
    this.displayPopUp = false;
    this.overlay = null;
    if (this.closeEvent && val !== 'flush') {
      this.closeEvent.emit();
      this.closeEvent = null;
    }
  }
  setDays() {
    this.dayEnd = (this.dayStart + 7 - 1) % 7;
    this.days = [];
    let start = this.dayStart;
    const end = this.dayEnd;
    while (start !== end) {
      this.days.push(DAYS[start]);
      start = (start + 1) % 7;
    }
    this.days.push(DAYS[end]);
  }
  setDates() {
    this.from = new Date(this.curr);
    this.to = new Date(this.curr);
    if (this.view.toLowerCase() === MONTH) {
      this.from.setDate(1);
      this.to.setDate(1);
      this.to.setDate(
        new Date(this.to.getFullYear(), this.curr.getMonth() + 1, 0).getDate()
      );
    }
    while (this.from.getDay() !== this.dayStart) {
      this.from.setDate(this.from.getDate() - 1);
    }
    while (this.to.getDay() !== this.dayEnd) {
      this.to.setDate(this.to.getDate() + 1);
    }
    let a = this.getDaysRange(this.from, this.to);
    a = Math.floor(a / 7);
    let b = new Array(7).fill(0);
    this.tempWeeks = new Array(a).fill(b);
    this.weeks = JSON.parse(JSON.stringify(this.tempWeeks));
    this.clearLayer('flush');
    this.datesChange.emit({
      from: this.from,
      to: this.to,
      currentMonth: this.curr,
    });
  }
  next() {
    if (this.view.toLowerCase() === MONTH) {
      this.curr.setMonth(this.curr.getMonth() + 1, 1);
    } else {
      this.curr = new Date(this.to);
      this.curr.setDate(this.curr.getDate() + 1);
    }
    this.setDates();
  }
  back() {
    if (this.view.toLowerCase() === MONTH) {
      this.curr.setMonth(this.curr.getMonth() - 1, 1);
    } else {
      this.curr = new Date(this.from);
      this.curr.setDate(this.curr.getDate() - 1);
    }
    this.setDates();
  }
  goToday() {
    this.curr = new Date();
    this.setDates();
  }
  getDate(weekIdx: number, dayIdx: number) {
    const copiedfrom = new Date(this.from);
    const len = dayIdx + weekIdx * 7;
    copiedfrom.setDate(copiedfrom.getDate() + len);
    return copiedfrom;
  }
  convertDataToDayObj(list: any[]) {
    debugger;
    let from = new Date(this.from);
    let to = new Date(this.to);
    let data: ObjectType = {};
    let dateList = [];
    while (from.getTime() <= to.getTime()) {
      const index = from.toLocaleDateString();
      data[index] = {
        date: index,
      };
      dateList.push(index);
      this.taskTypeProps.forEach((prop) => {
        data[index][prop] = [];
      });
      this.dayProps.forEach((prop) => {
        data[index][prop] = [];
      });
      from.setDate(from.getDate() + 1);
    }
    list.forEach((task) => {
      let date = new Date(task[this.viewStart]);
      let toDate = new Date(task[this.viewEnd]);
      while (date.getTime() <= toDate.getTime()) {
        const index = date.toLocaleDateString();
        if (data.hasOwnProperty(index)) {
          data[index][task[this.taskTypeKey]].push(task);
        }
        date.setDate(date.getDate() + 1);
      }
    });
    data['dateList'] = dateList;
    return data;
  }
  convertDayObjToList(data: { [key: string]: any }): any[] {
    debugger;
    const dateList: any[] = data['dateList'];
    delete data['dateList'];
    let list: any[] = [];
    let arr: any[] = [];
    dateList.forEach((value: string) => {
      if (arr.length && arr.length % 7 === 0) {
        list.push(arr);
        arr = [];
      }
      arr.push(data[value]);
    });
    list.push(arr);
    return list;
  }
  formatData() {
    let prevCache: any = {};
    const listData = this.convertDayObjToList(
      this.convertDataToDayObj(this.data)
    );
    if (!this.multiLimitView) {
      this.multiLimitData = JSON.parse(JSON.stringify(listData));
    }
    listData.forEach((week: any, weekIdx: number) => {
      this.sectionTop[weekIdx] = {};
      this.sectionStyle[weekIdx] = {};
      let cache: any = {};
      week.forEach((day: any, dayIdx: number) => {
        if (cache.hasOwnProperty(dayIdx) || dayIdx === 0) {
          this.taskTypeProps.forEach((prop) => {
            day[prop] = this.sortData(
              dayIdx === 0 ? prevCache : cache[dayIdx],
              prop,
              day[prop]
            );
          });
        }
        // if (dayIdx < (week.length - 1)) {
        if (dayIdx < week.length) {
          let allEmpty = true;
          cache[dayIdx + 1] = {};
          const obj =
            dayIdx === week.length - 1 ? prevCache : cache[dayIdx + 1];
          this.taskTypeProps.forEach((prop) => (obj[prop] = []));
          this.taskTypeProps.forEach((prop) =>
            this.updateTaskObj(day, obj, prop)
          );
          for (let i = 0; i < this.taskTypeProps.length; i++) {
            if (obj[this.taskTypeProps[i]].length !== 0) {
              allEmpty = false;
              break;
            }
          }
          if (allEmpty) {
            if (dayIdx === week.length - 1) {
              prevCache = {};
            } else {
              delete cache[dayIdx + 1];
            }
          }
        }
        if (!this.multiLimitView) {
          this.multiLimitData[weekIdx][dayIdx] = JSON.parse(
            JSON.stringify(day)
          );
          let rest = this.limit;
          this.taskTypeProps.forEach((prop) => {
            if (rest > 0) {
              day[prop] = day[prop].slice(0, rest);
              rest = rest - day[prop].length;
            } else {
              day[prop] = [];
            }
          });
        }
        this.updateSectionTop(
          weekIdx,
          dayIdx,
          day,
          week[week.length - 1],
          week.length
        );
      });
      week.forEach((day: any, dayIdx: number) => {
        let count = 0;
        count = this.checkSectionTop(weekIdx, day);
        while (count) {
          for (let i = 0; i <= dayIdx; i++) {
            count = this.checkSectionTop(weekIdx, week[i]);
            if (count) {
              break;
            }
          }
        }
      });
      Object.keys(this.sectionStyle[weekIdx]).forEach((key) => {
        this.sectionStyle[weekIdx][key]['top'] =
          this.sectionTop[weekIdx][key] *
            (this.dataViewHeight + this.dataViewMargin) +
          'px';
      });
    });

    this.weeks = JSON.parse(JSON.stringify(listData));
    this.clearLayer('flush');
  }

  sortData(obj: any, prop: string, arr: any[]) {
    if (obj.hasOwnProperty(prop)) {
      const tempArr = Object.assign([], obj[prop]);
      tempArr.reverse();
      tempArr.forEach((id: number) => {
        const index = arr.findIndex(
          (check: any) => check[this.valueToSave] === id
        );
        index !== -1 ? arr.unshift(arr.splice(index, 1)[0]) : '';
      });
    }
    return arr;
  }
  updateTaskObj(day: any, obj: any, prop: string) {
    day[prop].forEach((task: any) => {
      if (this.compareDates(task[this.viewEnd], day.date, '>')) {
        obj[prop].push(task[this.valueToSave]);
      }
    });
  }
  updateSectionTop(
    weekIdx: number,
    dayIdx: number,
    day: any,
    lastDay: any,
    weekSpan: number
  ) {
    let top = 0;
    this.taskTypeProps.forEach((prop, index) => {
      // let limit = 0;
      const limit = Math.min(this.limit, day[prop].length);
      // const limit = day[prop].length >= this.limit ? this.limit : day[prop].length;
      // if (day[prop].length >= this.limit) {
      //   limit = this.limit
      // } else if (day[prop].length === 1) {
      //   limit = 1;
      // }
      top +=
        index === 0
          ? 0
          : day[this.taskTypeProps[index - 1]].length > this.limit
          ? this.limit + 1
          : day[this.taskTypeProps[index - 1]].length;
      this.addSectionTop(day, limit, weekIdx, prop, top);
      this.addSectionStyle(
        day,
        lastDay,
        limit,
        weekIdx,
        dayIdx,
        prop,
        weekSpan
      );
    });
  }
  checkSectionTop(weekIdx: number, day: any) {
    let count = 0;
    let val = 0;
    let flag = false;
    this.taskTypeProps.forEach((prop, index) => {
      // let limit = 0;
      // if (day[prop].length >= 2) {
      //   limit = 2
      // } else if (day[prop].length === 1) {
      //   limit = 1;
      // }
      if (flag) {
        return;
      }
      const limit = Math.min(this.limit, day[prop].length);
      // const limit = day[prop].length >= this.limit ? this.limit : day[prop].length;
      for (let i = 0; i < limit; i++) {
        // this.sectionTop[weekIdx][day[prop][i][this.valueToSave]] += count;
      }
      if (index !== 0) {
        for (let i = index - 1; i >= 0; i--) {
          if (day[this.taskTypeProps[i]].length) {
            let p = Math.min(this.limit, day[this.taskTypeProps[i]].length);
            val =
              this.sectionTop[weekIdx][
                day[this.taskTypeProps[i]][p - 1][this.valueToSave]
              ] + 1;
            if (day[this.taskTypeProps[i]].length > this.limit) {
              val++;
            }
            break;
          }
        }
      }
      if (day[prop].length) {
        if (val > this.sectionTop[weekIdx][day[prop][0][this.valueToSave]]) {
          this.sectionTop[weekIdx][day[prop][0][this.valueToSave]] = val;
          count++;
          flag = true;
        }
        for (let i = 0; i < limit - 1; i++) {
          if (
            this.sectionTop[weekIdx][day[prop][i][this.valueToSave]] >=
            this.sectionTop[weekIdx][day[prop][i + 1][this.valueToSave]]
          ) {
            this.sectionTop[weekIdx][day[prop][i + 1][this.valueToSave]] =
              this.sectionTop[weekIdx][day[prop][i][this.valueToSave]] + 1;
            count++;
            flag = true;
            break;
          }
        }
        // if (this.sectionTop[weekIdx][day[prop][0][this.valueToSave]] >= this.sectionTop[weekIdx][day[prop][1][this.valueToSave]]) {
        //   this.sectionTop[weekIdx][day[prop][1][this.valueToSave]] = this.sectionTop[weekIdx][day[prop][0][this.valueToSave]] + 1;
        //   count++;
        // }
      }
    });
    return count;
  }
  addSectionTop(
    day: any,
    limit: number,
    weekIdx: number,
    prop: string,
    top: number
  ) {
    for (let i = 0; i < limit; i++) {
      if (
        this.sectionTop[weekIdx].hasOwnProperty(day[prop][i][this.valueToSave])
      ) {
        if (
          i + top >
          this.sectionTop[weekIdx][day[prop][i][this.valueToSave]]
        ) {
          this.sectionTop[weekIdx][day[prop][i][this.valueToSave]] = i + top;
        }
      } else {
        this.sectionTop[weekIdx][day[prop][i][this.valueToSave]] = i + top;
      }
    }
  }
  addSectionStyle(
    day: any,
    lastDay: any,
    limit: number,
    weekIdx: number,
    dayIdx: number,
    prop: string,
    weekSpan: number
  ) {
    for (let i = 0; i < limit; i++) {
      const startTask = this.compareDates(
        day[prop][i][this.viewStart],
        day.date,
        '='
      );
      if (startTask || dayIdx === 0) {
        if (!this.compareDates(day[prop][i][this.viewEnd], day.date, '=')) {
          let width = null;
          if (
            this.compareDates(day[prop][i][this.viewEnd], lastDay.date, '>')
          ) {
            if (startTask) {
              width = weekSpan - dayIdx;
            } else {
              width = this.getDaysRange(day.date, lastDay.date);
            }
          } else {
            width = this.getDaysRange(day[prop][i][this.viewEnd], day.date);
          }
          if (width) {
            this.sectionStyle[weekIdx][day[prop][i][this.valueToSave]] = {
              width:
                'calc(' +
                width * 100 +
                '% + ' +
                width +
                'px - ' +
                2 * this.dataViewMargin +
                'px',
              'z-index': 1,
              // top: (this.sectionTop[weekIdx][day[prop][i][this.valueToSave]] * (this.dataViewHeight + this.dataViewMargin)) + 'px'
            };
          }
        }
      }
    }
  }
  compareDates(date_one: string, date_two: string, operator: string) {
    const day_one = new Date(new Date(date_one).toLocaleDateString());
    const day_two = new Date(new Date(date_two).toLocaleDateString());
    const time_one = day_one.getTime();
    const time_two = day_two.getTime();
    switch (operator) {
      case '=':
        return time_one === time_two;
      case '>':
        return time_one > time_two;
      default:
        return time_one < time_two;
    }
  }
  getDaysRange(start: string | Date, end: string | Date) {
    let from = new Date(new Date(start).toLocaleDateString());
    let to = new Date(new Date(end).toLocaleDateString());
    return (
      Math.ceil(Math.abs((from.getTime() - to.getTime()) / TIMEDAYDIVISOR)) + 1
    );
  }
  commonTask(task: any, day: any, weekIdx: number, dayIdx: number) {
    if (
      this.compareDates(day.date, task[this.viewStart], '=') ||
      dayIdx === 0
    ) {
      if (this.sectionStyle[weekIdx].hasOwnProperty(task[this.valueToSave])) {
        return true;
      }
    }
    return false;
  }
  getSectionTotal(day: any) {
    // if (!this.taskTypeProps.length) {
    //   return 0;
    // }
    let count = 0;
    this.taskTypeProps.forEach((prop) => {
      count +=
        day[prop].length > this.limit ? this.limit + 1 : day[prop].length;
    });
    return count * (this.dataViewHeight + this.dataViewMargin) + 0;
    // return (count * (this.dataViewHeight + this.dataViewMargin)) + this.dataViewMargin;
  }
}
