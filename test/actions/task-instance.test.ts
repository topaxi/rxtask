import { Notification } from 'rxjs/Notification'
import * as taskInstanceActions from '../../src/actions/task-instance'
import { createNotificationAction } from '../../src/actions/task-instance'
import { expect } from 'chai'

describe('actions/task-instance', () => {
  /** @test {NOTIFICATION_ACTION} */
  it('exports NOTIFICATION_ACTION', () => {
    expect(taskInstanceActions.NOTIFICATION_ACTION).to.exist
  })
})

/** @test {createNotificationAction} */
describe('actions/task-instance/createNotificationAction', () => {
  it('creates action from Notification', () => {
    let notification = Notification.createNext('thing')
    expect(createNotificationAction(notification)).to.deep.equal({
      type: taskInstanceActions.NOTIFICATION_ACTION,
      payload: notification,
    })
  })
})
