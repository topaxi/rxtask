import { Notification } from 'rxjs/Notification'
import { ActionWithPayload, createAction } from '..'

/** @type {string} */
export const NOTIFICATION_ACTION = '[TaskInstance] Notificiation'

export type NotificationAction<T> = ActionWithPayload<
  typeof NOTIFICATION_ACTION,
  Notification<T>
>

/**
 * @param {Notification<T>} n
 * @return {NotificationAction<T>}
 */
export function createNotificationAction<T>(
  n: Notification<T>,
): NotificationAction<T> {
  return createAction(NOTIFICATION_ACTION, n)
}

export type TaskInstanceActions<T> = NotificationAction<T>

/**
 * @typedef {ActionWithPayload} NotificationAction
 * @property {string} type
 * @property {Notification<T>} payload
 */
