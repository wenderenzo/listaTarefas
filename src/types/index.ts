export interface Task {
  id: number;
  name: string;
  cost: number;
  dueDate: string;
  displayOrder: number;
}

export interface ResponseDTO<T> {
  data?: object | any | T;
  time: string;
}