import { SubscribableOrPromise } from 'rxjs/Observable';
import { Task } from './task'
import { TaskState } from './task-instance';

export interface TaskInstanceState<T> {
  readonly state: TaskState
  readonly hasValue: boolean
  readonly currentValue: T | undefined
  readonly error: Error | null
}

export type CallableObject<T extends object, U extends Function> = T & U
export type CallableTask<T extends Task<any, any>> = CallableObject<T, T['perform']>

export type SubscribableOrPromiseType<T> = T extends SubscribableOrPromise<infer U>
  ? U
  : void
export type OneParamFunction<T, U> = (value: T) => U
export type ParamType<T> = T extends OneParamFunction<infer U, any> ? U : never

export type TaskCallback<T, U> = OneParamFunction<U, SubscribableOrPromise<T>>
export type AnyTaskCallback = TaskCallback<any, any>

export type TaskFromCallback<T extends AnyTaskCallback> = Task<
  SubscribableOrPromiseType<ReturnType<T>>,
  ParamType<T>
>
