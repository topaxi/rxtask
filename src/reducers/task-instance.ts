import { Notification } from 'rxjs/Notification'

export interface State<T> {
  readonly state: TaskInstanceState
  readonly hasValue: boolean
  readonly currentValue: T | undefined
  readonly error: Error | null
}

export const enum TaskInstanceState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
  ERROR = 'error',
}

export const RUNNING_STATE: State<any> = {
  state: TaskInstanceState.RUNNING,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

export const PENDING_STATE: State<any> = {
  state: TaskInstanceState.PENDING,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

export const CANCELLED_STATE: State<any> = {
  state: TaskInstanceState.CANCELLED,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

export function reducer<T>(
  state: State<T>,
  notification: Notification<T>,
): State<T> {
  switch (notification.kind) {
    case 'N':
      return {
        ...state,
        state: TaskInstanceState.RUNNING,
        hasValue: true,
        currentValue: notification.value,
      }
    case 'E':
      return {
        ...state,
        state: TaskInstanceState.ERROR,
        error: notification.error,
      }
    case 'C':
      return { ...state, state: TaskInstanceState.COMPLETE }
    default:
      return state
  }
}

export const isPending = (s: TaskInstanceState) =>
  s === TaskInstanceState.PENDING
export const isRunning = (s: TaskInstanceState) =>
  s === TaskInstanceState.RUNNING
export const isError = (s: TaskInstanceState) => s === TaskInstanceState.ERROR
export const isCancelled = (s: TaskInstanceState) =>
  s === TaskInstanceState.CANCELLED
export const isComplete = (s: TaskInstanceState) =>
  s === TaskInstanceState.COMPLETE

export const selectValue = <T>(s: State<T>) => s.currentValue
export const selectHasValue = <T>(s: State<T>) => s.hasValue
export const selectState = <T>(s: State<T>) => s.state
export const selectError = <T>(s: State<T>) => s.error

export const hasValue = <T>(s: State<T>) =>
  selectHasValue(s) && isRunning(selectState(s))
