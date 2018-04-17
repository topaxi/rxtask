import * as taskInstance from '../../src/reducers/task-instance'
import { expect } from 'chai'

describe('TaskInstance reducer', () => {
  describe('Static states', () => {
    it('defines a pending state', () => {
      expect(taskInstance.PENDING_STATE).to.deep.equal({
        state: taskInstance.TaskInstanceState.PENDING,
        hasValue: false,
        currentValue: undefined,
        error: null,
      })
    })

    it('defines a running state', () => {
      expect(taskInstance.RUNNING_STATE).to.deep.equal({
        state: taskInstance.TaskInstanceState.RUNNING,
        hasValue: false,
        currentValue: undefined,
        error: null,
      })
    })

    it('defines a cancelled state', () => {
      expect(taskInstance.CANCELLED_STATE).to.deep.equal({
        state: taskInstance.TaskInstanceState.CANCELLED,
        hasValue: false,
        currentValue: undefined,
        error: null,
      })
    })
  })
})
