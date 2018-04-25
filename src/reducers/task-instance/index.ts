import { Notification } from 'rxjs/Notification'
import * as taskInstanceActions from '../../actions/task-instance'
import { TaskInstanceActions } from '../../actions'

export interface State<T> {
  readonly stateLabel: TaskInstanceStateLabel
  readonly hasValue: boolean
  readonly currentValue: T | undefined
  readonly error: Error | null
}

export const enum TaskInstanceStateLabel {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
  ERROR = 'error',
}

/**
 * @type {TaskInstanceState<any>}
 */
export const RUNNING_STATE: State<any> = {
  stateLabel: TaskInstanceStateLabel.RUNNING,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

/**
 * @type {TaskInstanceState<any>}
 */
export const PENDING_STATE: State<any> = {
  stateLabel: TaskInstanceStateLabel.PENDING,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

/**
 * @type {TaskInstanceState<any>}
 */
export const CANCELLED_STATE: State<any> = {
  stateLabel: TaskInstanceStateLabel.CANCELLED,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

function notificationReducer<T>(s: State<T>, n: Notification<T>): State<T> {
  switch (n.kind) {
    case 'N':
      return {
        ...s,
        stateLabel: TaskInstanceStateLabel.RUNNING,
        hasValue: true,
        currentValue: n.value,
      }
    case 'E':
      return {
        ...s,
        stateLabel: TaskInstanceStateLabel.ERROR,
        error: n.error,
      }
    case 'C':
      return { ...s, stateLabel: TaskInstanceStateLabel.COMPLETE }
    // istanbul ignore next
    default:
      return s
  }
}

/**
 * @param {TaskInstanceState<T>} [state=PENDING_STATE]
 * @param {TaskInstanceActions<T>} action
 * @return {TaskInstanceState<T>}
 */
export function reducer<T>(
  state: State<T> = PENDING_STATE,
  action: TaskInstanceActions<T>,
): State<T> {
  switch (action.type) {
    case taskInstanceActions.NOTIFICATION_ACTION:
      return notificationReducer(state, action.payload)
    default:
      return state
  }
}

/**
 * @param {TaskInstanceStateLabel} s
 * @return {boolean}
 */
export const isPending = (s: TaskInstanceStateLabel) =>
  s === TaskInstanceStateLabel.PENDING

/**
 * @param {TaskInstanceStateLabel} s
 * @return {boolean}
 */
export const isRunning = (s: TaskInstanceStateLabel) =>
  s === TaskInstanceStateLabel.RUNNING

/**
 * @param {TaskInstanceStateLabel} s
 * @return {boolean}
 */
export const isError = (s: TaskInstanceStateLabel) =>
  s === TaskInstanceStateLabel.ERROR

/**
 * @param {TaskInstanceStateLabel} s
 * @return {boolean}
 */
export const isCancelled = (s: TaskInstanceStateLabel) =>
  s === TaskInstanceStateLabel.CANCELLED

/**
 * @param {TaskInstanceStateLabel} s
 * @return {boolean}
 */
export const isComplete = (s: TaskInstanceStateLabel) =>
  s === TaskInstanceStateLabel.COMPLETE


/**
 * @param {TaskInstanceState<T>} s
 * @return {T}
 */
export const selectValue = <T>(s: State<T>) => s.currentValue

/**
 * @param {TaskInstanceState<T>} s
 * @return {boolean}
 */
export const selectHasValue = <T>(s: State<T>) => s.hasValue

/**
 * @param {TaskInstanceState<T>} s
 * @return {TaskInstanceStateLabel}
 */
export const selectStateLabel = <T>(s: State<T>) => s.stateLabel

/**
 * @param {TaskInstanceState<T>} s
 * @return {?Error}
 */
export const selectError = <T>(s: State<T>) => s.error

/**
 * @param {TaskInstanceState<T>} s
 * @return {boolean}
 */
export const hasValue = <T>(s: State<T>) =>
  selectHasValue(s) && isRunning(s.stateLabel) !== isComplete(s.stateLabel)

/**
 * @typedef {Object} TaskInstanceState
 * @property {TaskInstanceStateLabel} stateLabel
 * @property {boolean} hasValue
 * @property {?T} currentValue
 * @property {?Error} error
 */

/**
 * @typedef {string} TaskInstanceStateLabel
 */
