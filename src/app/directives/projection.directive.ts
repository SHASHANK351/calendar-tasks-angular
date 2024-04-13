import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[calendarProjection]'
})
export class CalendarProjectionDirective {
  @Input() calendarProjection = '';

  constructor(public readonly projectionTemplate: TemplateRef<any>) { }

}
