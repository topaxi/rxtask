import { TaskInstance } from '../task-instance'
import { assertNever, neq, EMPTY_ARRAY } from '../utils'
import * as taskInstance from './task-instance'
import { TaskInstanceState, selectState } from './task-instance'
import * as taskActions from '../actions/task'

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
  readonly taskInstance: TaskInstance<T>
  readonly taskInstanceState: TaskInstanceState
}

export const combineTaskInstanceWithState = <T>(
  taskInstance: TaskInstance<T>,
  taskInstanceState: taskInstance.State<T>,
): TaskInstanceWithState<T> => ({
  taskInstance,
  taskInstanceState: selectState(taskInstanceState),
})

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

function taskInstanceStateReducer<T>(
  state: State<T>,
  { taskInstance, taskInstanceState }: TaskInstanceWithState<T>,
): State<T> {
  switch (taskInstanceState) {
    case TaskInstanceState.PENDING:
      return {
        ...state,
        performed: state.performed + 1,
        pending: [...state.pending, taskInstance],
        last: taskInstance,
      }
    case TaskInstanceState.RUNNING:
      return {
        ...taskNoLongerPending(state, taskInstance),
        running: [...state.running, taskInstance],
        lastRunning: taskInstance,
      }
    case TaskInstanceState.CANCELLED:
      return {
        ...taskNoLongerPending(state, taskInstance),
        ...taskNoLongerRunning(state, taskInstance),
        cancelled: state.cancelled + 1,
        lastCancelled: taskInstance,
      }
    case TaskInstanceState.ERROR:
      return {
        ...taskCompleted(state, taskInstance),
        errored: state.errored + 1,
        lastErrored: taskInstance,
      }
    case TaskInstanceState.COMPLETE:
      return {
        ...taskCompleted(state, taskInstance),
        successful: state.completed + 1,
        lastSuccessful: taskInstance,
      }
    default:
      return assertNever(taskInstanceState)
  }
}

export function reducer<T>(
  state: State<T> = INITIAL_STATE,
  action: taskActions.TaskActions<T>,
): State<T> {
  switch (action.type) {
    case taskActions.TASK_INSTANCE_STATE_UPDATE_ACTION:
      return taskInstanceStateReducer(state, action.payload)
    default:
      return state
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
