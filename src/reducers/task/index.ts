import { TaskInstance } from '../../task-instance'
import { assertNever, neq, EMPTY_ARRAY, pipe } from '../../utils'
import * as taskInstance from '../task-instance'
import { TaskInstanceStateLabel, selectState } from '../task-instance'
import * as taskActions from '../../actions/task'

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

export type TaskInstanceWithStateLabel<T> = {
  readonly taskInstance: TaskInstance<T>
  readonly taskInstanceStateLabel: TaskInstanceStateLabel
}

/** @access private */
export const combineTaskInstanceWithStateLabel = <T>(
  taskInstance: TaskInstance<T>,
  { stateLabel: taskInstanceStateLabel }: taskInstance.State<T>,
): TaskInstanceWithStateLabel<T> => ({
  taskInstance,
  taskInstanceStateLabel,
})

/**
 * @type {TaskState<any>}
 * @access private
 */
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
  { taskInstance, taskInstanceStateLabel }: TaskInstanceWithStateLabel<T>,
): State<T> {
  switch (taskInstanceStateLabel) {
    case TaskInstanceStateLabel.PENDING:
      return {
        ...state,
        performed: state.performed + 1,
        pending: [...state.pending, taskInstance],
        last: taskInstance,
      }
    case TaskInstanceStateLabel.RUNNING:
      return {
        ...taskNoLonger(state, taskInstance, 'pending'),
        running: [...state.running, taskInstance],
        lastRunning: taskInstance,
      }
    case TaskInstanceStateLabel.CANCELLED:
      return {
        ...pipe(
          state,
          state => taskNoLonger(state, taskInstance, 'pending'),
          state => taskNoLonger(state, taskInstance, 'running'),
        ),
        cancelled: state.cancelled + 1,
        lastCancelled: taskInstance,
      }
    case TaskInstanceStateLabel.ERROR:
      return {
        ...taskCompleted(state, taskInstance),
        errored: state.errored + 1,
        lastErrored: taskInstance,
      }
    case TaskInstanceStateLabel.COMPLETE:
      return {
        ...taskCompleted(state, taskInstance),
        successful: state.successful + 1,
        lastSuccessful: taskInstance,
      }
    default:
      return assertNever(taskInstanceStateLabel)
  }
}

/**
 * @param {TaskState<T>} [state=INITIAL_STATE]
 * @param {TaskActions<T>} action
 * @return {TaskState<T>}
 */
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

function taskNoLonger<T>(
  state: State<T>,
  task: TaskInstance<T>,
  taskState: 'pending' | 'running',
): State<T> {
  return {
    ...state,
    [taskState]: state[taskState].filter(neq(task)),
  }
}

function taskCompleted<T>(state: State<T>, task: TaskInstance<T>): State<T> {
  return {
    ...pipe(
      state,
      state => taskNoLonger(state, task, 'pending'),
      state => taskNoLonger(state, task, 'running'),
    ),
    completed: state.completed + 1,
    lastCompleted: task,
  }
}

/**
 * @param {TaskState<T>} s
 * @return number
 */
export const selectPerformed = <T>(s: State<T>) => s.performed

/**
 * @param {TaskState<T>} s
 * @return {Array<TaskInstance<T>>}
 */
export const selectPending = <T>(s: State<T>) => s.pending

/**
 * @param {TaskState<T>} s
 * @return {Array<TaskInstance<T>>}
 */
export const selectRunning = <T>(s: State<T>) => s.running

/**
 * @param {TaskState<T>} s
 * @return {number}
 */
export const selectSuccessful = <T>(s: State<T>) => s.successful

/**
 * @param {TaskState<T>} s
 * @return {number}
 */
export const selectCancelled = <T>(s: State<T>) => s.cancelled

/**
 * @param {TaskState<T>} s
 * @return {number}
 */
export const selectErrored = <T>(s: State<T>) => s.errored

/**
 * @param {TaskState<T>} s
 * @return {number}
 */
export const selectCompleted = <T>(s: State<T>) => s.completed

/**
 * @param {TaskState<T>} s
 * @return {TaskInstance<T>}
 */
export const selectLast = <T>(s: State<T>) => s.last

/**
 * @param {TaskState<T>} s
 * @return {TaskInstance<T>}
 */
export const selectLastRunning = <T>(s: State<T>) => s.lastRunning

/**
 * @param {TaskState<T>} s
 * @return {TaskInstance<T>}
 */
export const selectLastSuccessful = <T>(s: State<T>) => s.lastSuccessful

/**
 * @param {TaskState<T>} s
 * @return {TaskInstance<T>}
 */
export const selectLastCancelled = <T>(s: State<T>) => s.lastCancelled

/**
 * @param {TaskState<T>} s
 * @return {TaskInstance<T>}
 */
export const selectLastErrored = <T>(s: State<T>) => s.lastErrored

/**
 * @param {TaskState<T>} s
 * @return {TaskInstance<T>}
 */
export const selectLastCompleted = <T>(s: State<T>) => s.lastCompleted

/**
 * @typedef {Object} TaskState
 * @property {number} performed
 * @property {Array<TaskInstance<T>>} pending
 * @property {Array<TaskInstance<T>>} running
 * @property {number} successful
 * @property {number} cancelled
 * @property {number} errored
 * @property {number} completed
 * @property {?TaskInstance<T>} last
 * @property {?TaskInstance<T>} lastRunning
 * @property {?TaskInstance<T>} lastSuccessful
 * @property {?TaskInstance<T>} lastCancelled
 * @property {?TaskInstance<T>} lastErrored
 * @property {?TaskInstance<T>} lastCompleted
 */

/**
 * @typedef {{ taskInstance: TaskInstance<T>, taskInstanceState: TaskInstanceState }} TaskInstanceWithState
 * @access private
 */
