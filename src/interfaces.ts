import { SubscribableOrPromise } from 'rxjs/Observable'
import { Task } from './task'
import { TaskInstance } from './task-instance'

export type CallableObject<T extends object, U extends Function> = T & U
export type CallableTask<T extends Task<any, any>> = CallableObject<
  T,
  T['perform']
>

export type SubscribableOrPromiseType<T> = T extends SubscribableOrPromise<
  infer U
>
  ? U
  : void
export type UnaryFunction<T, U> = (value: T) => U
export type ParamType<T> = T extends UnaryFunction<infer U, any> ? U : never

export type TaskCallback<T, U> = UnaryFunction<T, SubscribableOrPromise<U>>
export type AnyTaskCallback = TaskCallback<any, any>

export type TaskFromCallback<T extends AnyTaskCallback> = Task<
  SubscribableOrPromiseType<ReturnType<T>>,
  ParamType<T>
>

/**
 * @typedef {UnaryFunction<T, SubscribableOrPromise<U>>} TaskCallback
 */
