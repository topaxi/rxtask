import * as taskActions from '../../src/actions/task'
import { expect } from 'chai'

describe('actions/task', () => {
  /** @test {NOTIFICATION_ACTION} */
  it('exports NOTIFICATION_ACTION', () => {
    expect(taskActions.TASK_INSTANCE_STATE_UPDATE_ACTION).to.exist
  })
})
