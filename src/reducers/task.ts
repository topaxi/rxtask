import { TaskInstance } from '../task-instance'
import { assertNever, neq, EMPTY_ARRAY } from '../utils'
import * as taskInstance from './task-instance'
import { TaskInstanceState } from './task-instance'

export interface State<T> {
  readonly performed: number
  readonly pending: ReadonlyArray<TaskInstance<T>>
  readonly running: ReadonlyArray<TaskInstance<T>>
  readonly successful: number
  readonly cancelled: number
  readonly errored: number
  readonly completed: number
  readonly last: TaskInstance<T> | null
  readonly lastRunning: TaskInstance<T> | null
  readonly lastSuccessful: TaskInstance<T> | null
  readonly lastCancelled: TaskInstance<T> | null
  readonly lastErrored: TaskInstance<T> | null
  readonly lastCompleted: TaskInstance<T> | null
}

export type TaskInstanceWithState<T> = {
  readonly task: TaskInstance<T>
  readonly taskState: taskInstance.State<T>
}

export const combineTaskAndTaskState = <T>(
  task: TaskInstance<T>,
  taskState: taskInstance.State<T>,
) => ({ task, taskState })

export const INITIAL_STATE: State<any> = {
  performed: 0,
  pending: EMPTY_ARRAY,
  running: EMPTY_ARRAY,
  successful: 0,
  cancelled: 0,
  errored: 0,
  completed: 0,
  last: null,
  lastRunning: null,
  lastSuccessful: null,
  lastCancelled: null,
  lastErrored: null,
  lastCompleted: null,
}

export function reducer<T>(
  state: State<T>,
  { task, taskState }: TaskInstanceWithState<T>,
): State<T> {
  switch (taskState.state) {
    case TaskInstanceState.PENDING:
      return {
        ...state,
        performed: state.performed + 1,
        pending: [...state.pending, task],
        last: task,
      }
    case TaskInstanceState.RUNNING:
      return {
        ...taskNoLongerPending(state, task),
        running: [...state.running, task],
        lastRunning: task,
      }
    case TaskInstanceState.CANCELLED:
      return {
        ...taskNoLongerPending(state, task),
        ...taskNoLongerRunning(state, task),
        cancelled: state.cancelled + 1,
        lastCancelled: task,
      }
    case TaskInstanceState.ERROR:
      return {
        ...taskCompleted(state, task),
        errored: state.errored + 1,
        lastErrored: task,
      }
    case TaskInstanceState.COMPLETE:
      return {
        ...taskCompleted(state, task),
        successful: state.completed + 1,
        lastSuccessful: task,
      }
    default:
      return assertNever(taskState.state)
  }
}

function taskNoLongerPending<T>(
  state: State<T>,
  task: TaskInstance<T>,
): State<T> {
  return {
    ...state,
    pending: state.pending.filter(neq(task)),
  }
}

function taskNoLongerRunning<T>(
  state: State<T>,
  task: TaskInstance<T>,
): State<T> {
  return {
    ...state,
    running: state.running.filter(neq(task)),
  }
}

function taskCompleted<T>(state: State<T>, task: TaskInstance<T>): State<T> {
  return {
    ...taskNoLongerPending(state, task),
    ...taskNoLongerRunning(state, task),
    running: state.running.filter(neq(task)),
    completed: state.completed + 1,
    lastCompleted: task,
  }
}

export const selectPerformed = <T>(s: State<T>) => s.performed
export const selectPending = <T>(s: State<T>) => s.pending
export const selectRunning = <T>(s: State<T>) => s.running
export const selectSuccessful = <T>(s: State<T>) => s.successful
export const selectCancelled = <T>(s: State<T>) => s.cancelled
export const selectErrored = <T>(s: State<T>) => s.errored
export const selectCompleted = <T>(s: State<T>) => s.completed
export const selectLast = <T>(s: State<T>) => s.last
export const selectLastRunning = <T>(s: State<T>) => s.lastRunning
export const selectLastSuccessful = <T>(s: State<T>) => s.lastSuccessful
export const selectLastCancelled = <T>(s: State<T>) => s.lastCancelled
export const selectLastErrored = <T>(s: State<T>) => s.lastErrored
export const selectLastCompleted = <T>(s: State<T>) => s.lastCompleted
