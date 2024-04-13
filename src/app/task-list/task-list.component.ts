import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TASKTYPES } from '../app.constants';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnInit {
  date = new Date();
  day: any;
  // value: any;
  months!: string[];
  props = TASKTYPES;
  labels: { [key: string]: string } = {
    open: 'ALERTS RAISED',
    incomplete: 'INCOMPLETE TASKS',
    closed: 'ALERTS CLOSED',
    complete: 'COMPLETED TASKS',
  };
  @Output() closeLayer = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  close() {
    this.closeLayer.emit();
  }
}
