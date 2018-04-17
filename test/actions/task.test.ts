import * as taskActions from '../../src/actions/task'
import { expect } from 'chai'

describe('actions/task', () => {
  it('exports NOTIFICATION_ACTION', () => {
    expect(taskActions.TASK_INSTANCE_STATE_UPDATE_ACTION).to.exist
  })
})
