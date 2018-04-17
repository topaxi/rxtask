import { Notification } from 'rxjs/Notification'
import { ActionWithPayload, createAction } from '.'

export const NOTIFICATION_ACTION = '[TaskInstance] Notificiation'

export type NotificationAction<T> = ActionWithPayload<
  typeof NOTIFICATION_ACTION,
  Notification<T>
>

export function createNotificationAction<T>(
  n: Notification<T>,
): NotificationAction<T> {
  return createAction(NOTIFICATION_ACTION, n)
}

export type TaskInstanceActions<T> = NotificationAction<T>
