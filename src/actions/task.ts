import { ActionWithPayload, createAction } from '../actions'
import { TaskInstanceWithState } from '../reducers/task'

export const TASK_INSTANCE_STATE_UPDATE_ACTION =
  '[Task] Task instance state update'

export type TaskInstanceStateUpdateAction<T> = ActionWithPayload<
  typeof TASK_INSTANCE_STATE_UPDATE_ACTION,
  TaskInstanceWithState<T>
>

export type TaskActions<T> = TaskInstanceStateUpdateAction<T>
