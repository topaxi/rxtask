import { ActionWithPayload, createAction } from '..'
import { TaskInstanceWithStateLabel } from '../../reducers/task'

/** @type {string} */
export const TASK_INSTANCE_STATE_UPDATE_ACTION =
  '[Task] Task instance state update'

export type TaskInstanceStateUpdateAction<T> = ActionWithPayload<
  typeof TASK_INSTANCE_STATE_UPDATE_ACTION,
  TaskInstanceWithStateLabel<T>
>

export type TaskActions<T> = TaskInstanceStateUpdateAction<T>
