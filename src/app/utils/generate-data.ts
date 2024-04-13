import { TASKTYPES } from '../app.constants';
import { Task } from '../app.model';

function* idGenerator() {
  let count = 1;
  while (true) {
    yield count;
    count++;
  }
}

function createTask(idGenerator: Generator, index: number): Task {
  const type = Math.floor(Math.random() * TASKTYPES.length);
  const task: Task = {
    id: idGenerator.next().value,
    name: `Task ${index + 1}`,
    description: '',
    status: 'open',
    pinned: false,
    viewStart: '',
    viewEnd: '',
    type: TASKTYPES[type],
  };
  switch (type) {
    case 0:
    case 2:
    case 3: {
      task.viewStart = new Date().toISOString();
      task.viewEnd = new Date().toISOString();
      break;
    }
    default: {
      const today = new Date();
      task.viewStart = new Date(
        new Date().setDate(today.getDate() - 2)
      ).toISOString();
      task.viewEnd = new Date(
        new Date().setDate(today.getDate() + 2)
      ).toISOString();
      break;
    }
  }
  return task;
}

export default function (length = 4) {
  const id = idGenerator();
  const result = new Array(length)
    .fill(() => {})
    .map((val, index) => createTask(id, index));
  id.return();
  return result;
}
