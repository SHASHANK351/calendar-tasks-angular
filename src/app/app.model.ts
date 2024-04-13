import { EventEmitter, Type } from '@angular/core';

export type layerDataType = {
  component: Type<any>;
  props?: { [key: string]: any };
  date?: Date;
  popUpStyle?: { [key: string]: any };
  overlay?: {
    style?: { [key: string]: any };
    backdrop?: boolean;
  };
  closeEvent?: EventEmitter<void>;
};

export interface ObjectType extends Object {
  [key: string]: any;
}

export type Task = {
  id: number;
  name: string;
  description: string;
  status: string;
  pinned: boolean;
  viewStart: string;
  viewEnd: string;
  type: string;
};
