export { TaskInstanceActions } from './task-instance'

export interface Action<T extends string = string> {
  readonly type: T
}
export interface ActionWithPayload<T extends string, U> extends Action<T> {
  readonly payload: U
}

export type ActionType<T> = T extends Action<infer U> ? U : never
export type ActionPayload<T> = T extends ActionWithPayload<any, infer U>
  ? U
  : void

export type ActionByPayloadCreator<T> = <U extends ActionPayload<T>>(
  payload: U,
) => ActionWithPayload<ActionType<T>, U>

export function createAction<T extends string>(type: T): Action<T>
export function createAction<T extends string, U>(
  type: T,
  payload: U,
): ActionWithPayload<T, U>
/**
 * @param {string} type Action type
 * @param {?PayloadType} payload Action payload
 * @return {Action<string> | ActionWithPayload<string, PayloadType>}
 */
export function createAction<T extends string, U>(
  type: T,
  payload?: U,
): Action<T> | ActionWithPayload<T, U> {
  if (arguments.length === 1) {
    return { type }
  }

  return { type, payload }
}

/**
 * @param {string} type Action type
 * @return {function(payload: PayloadType): ActionWithPayload<string, PayloadType>}
 */
export function toAction<T extends ActionWithPayload<any, any>>(
  type: ActionType<T>,
): ActionByPayloadCreator<T> {
  return payload => createAction(type, payload)
}

/**
 * @typedef {Object} Action
 * @property {string} type Action type
 */

/**
 * @typedef {Action} ActionWithPayload
 * @property {string} type Action type
 * @property {PayloadType} payload Action payload
 */
