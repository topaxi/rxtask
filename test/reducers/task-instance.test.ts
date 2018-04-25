import { Notification } from 'rxjs/Notification'
import * as taskInstance from '../../src/reducers/task-instance'
import {
  createNotificationAction,
  NotificationAction,
  NOTIFICATION_ACTION,
} from '../../src/actions/task-instance'
import { EMPTY_ACTION } from './helpers'
import { expect } from 'chai'
import { TaskInstanceStateLabel } from '../../src/reducers/task-instance'

function createNextNotificationAction<T>(value: T): NotificationAction<T> {
  return createNotificationAction(Notification.createNext(value))
}

function createErrorNotificationAction<T>(value: T): NotificationAction<T> {
  return createNotificationAction(Notification.createError(value))
}

function createCompleteNotificationAction<T>(): NotificationAction<T> {
  return createNotificationAction(Notification.createComplete())
}

describe('reducers/TaskInstance', () => {
  describe('Static states', () => {
    /** @test {PENDING_STATE} */
    it('defines a pending state', () => {
      expect(taskInstance.PENDING_STATE).to.deep.equal({
        stateLabel: taskInstance.TaskInstanceStateLabel.PENDING,
        hasValue: false,
        currentValue: undefined,
        error: null,
      })
    })

    /** @test {RUNNING_STATE} */
    it('defines a running state', () => {
      expect(taskInstance.RUNNING_STATE).to.deep.equal({
        stateLabel: taskInstance.TaskInstanceStateLabel.RUNNING,
        hasValue: false,
        currentValue: undefined,
        error: null,
      })
    })

    /** @test {CANCELLED_STATE} */
    it('defines a cancelled state', () => {
      expect(taskInstance.CANCELLED_STATE).to.deep.equal({
        stateLabel: taskInstance.TaskInstanceStateLabel.CANCELLED,
        hasValue: false,
        currentValue: undefined,
        error: null,
      })
    })
  })

  /** @test {reducer} */
  describe('Reducer', () => {
    describe('Initial state', () => {
      it('equals PENDING_STATE', () => {
        expect(taskInstance.reducer(undefined, EMPTY_ACTION)).to.deep.equal(
          taskInstance.PENDING_STATE,
        )
      })
    })

    describe('Notifications', () => {
      let state: taskInstance.State<any>

      beforeEach(() => {
        state = taskInstance.PENDING_STATE
      })

      describe('Next Notification', () => {
        beforeEach(() => {
          state = taskInstance.reducer(
            state,
            createNextNotificationAction('VALUE'),
          )
        })

        it('sets state to running', () => {
          expect(state.stateLabel).to.equal(TaskInstanceStateLabel.RUNNING)
        })

        it('marks state to having a value', () => {
          expect(state.hasValue).to.be.true
        })

        it('sets current value', () => {
          expect(state.currentValue).to.equal('VALUE')
          state = taskInstance.reducer(
            state,
            createNextNotificationAction('NEXT VALUE'),
          )
          expect(state.currentValue).to.equal('NEXT VALUE')
        })

        it('does not modify error state', () => {
          state = taskInstance.reducer(
            { error: 'error' } as any,
            createNextNotificationAction('NEXT VALUE'),
          )
          expect(state.error).to.equal('error')
        })
      })

      describe('Error Notification', () => {
        beforeEach(() => {
          state = taskInstance.reducer(
            state,
            createErrorNotificationAction('ERROR'),
          )
        })

        it('sets state to error', () => {
          expect(state.stateLabel).to.equal(TaskInstanceStateLabel.ERROR)
        })

        it('does not modify hasValue', () => {
          expect(state.hasValue).to.be.false
          state = taskInstance.reducer(
            { hasValue: true } as any,
            createErrorNotificationAction('ERROR'),
          )
          expect(state.hasValue).to.be.true
        })

        it('does not modify current value', () => {
          expect(state.currentValue).to.be.undefined
          state = taskInstance.reducer(
            { currentValue: true } as any,
            createErrorNotificationAction('ERROR'),
          )
          expect(state.currentValue).to.be.true
        })

        it('sets error property', () => {
          expect(state.error).to.equal('ERROR')
        })
      })

      describe('Complete Notification', () => {
        beforeEach(() => {
          state = taskInstance.reducer(
            state,
            createCompleteNotificationAction(),
          )
        })

        it('sets state to complete', () => {
          expect(state.stateLabel).to.equal(TaskInstanceStateLabel.COMPLETE)
        })

        it('does not modify hasValue', () => {
          expect(state.hasValue).to.be.false
          state = taskInstance.reducer(
            { hasValue: true } as any,
            createCompleteNotificationAction(),
          )
          expect(state.hasValue).to.be.true
        })

        it('does not modify current value', () => {
          expect(state.currentValue).to.be.undefined
          state = taskInstance.reducer(
            { currentValue: true } as any,
            createCompleteNotificationAction(),
          )
          expect(state.currentValue).to.be.true
        })

        it('does not modify error state', () => {
          state = taskInstance.reducer(
            { error: 'error' } as any,
            createCompleteNotificationAction(),
          )
          expect(state.error).to.equal('error')
        })
      })

      describe('Unknown Notification', () => {
        beforeEach(() => {
          state = taskInstance.reducer(state, {
            type: NOTIFICATION_ACTION,
            payload: { kind: '__UNKOWN' } as any,
          })
        })

        it('does not modify any state', () => {
          expect(state).to.deep.equal(taskInstance.PENDING_STATE)
        })
      })
    })
  })

  describe('Filters', () => {
    /** @test {isPending} */
    it('isPending', () => {
      expect(taskInstance.isPending(TaskInstanceStateLabel.PENDING)).to.be.true
      expect(taskInstance.isPending(TaskInstanceStateLabel.RUNNING)).to.be
        .false
      expect(taskInstance.isPending(TaskInstanceStateLabel.COMPLETE)).to.be
        .false
      expect(taskInstance.isPending(TaskInstanceStateLabel.CANCELLED)).to.be
        .false
      expect(taskInstance.isPending(TaskInstanceStateLabel.ERROR)).to.be.false
    })

    /** @test {isRunning} */
    it('isRunning', () => {
      expect(taskInstance.isRunning(TaskInstanceStateLabel.PENDING)).to.be
        .false
      expect(taskInstance.isRunning(TaskInstanceStateLabel.RUNNING)).to.be.true
      expect(taskInstance.isRunning(TaskInstanceStateLabel.COMPLETE)).to.be
        .false
      expect(taskInstance.isRunning(TaskInstanceStateLabel.CANCELLED)).to.be
        .false
      expect(taskInstance.isRunning(TaskInstanceStateLabel.ERROR)).to.be.false
    })

    /** @test {isComplete} */
    it('isComplete', () => {
      expect(taskInstance.isComplete(TaskInstanceStateLabel.PENDING)).to.be
        .false
      expect(taskInstance.isComplete(TaskInstanceStateLabel.RUNNING)).to.be
        .false
      expect(taskInstance.isComplete(TaskInstanceStateLabel.COMPLETE)).to.be
        .true
      expect(taskInstance.isComplete(TaskInstanceStateLabel.CANCELLED)).to.be
        .false
      expect(taskInstance.isComplete(TaskInstanceStateLabel.ERROR)).to.be.false
    })

    /** @test {isCancelled} */
    it('isCancelled', () => {
      expect(taskInstance.isCancelled(TaskInstanceStateLabel.PENDING)).to.be
        .false
      expect(taskInstance.isCancelled(TaskInstanceStateLabel.RUNNING)).to.be
        .false
      expect(taskInstance.isCancelled(TaskInstanceStateLabel.COMPLETE)).to.be
        .false
      expect(taskInstance.isCancelled(TaskInstanceStateLabel.CANCELLED)).to.be
        .true
      expect(taskInstance.isCancelled(TaskInstanceStateLabel.ERROR)).to.be
        .false
    })

    /** @test {isError} */
    it('isError', () => {
      expect(taskInstance.isError(TaskInstanceStateLabel.PENDING)).to.be.false
      expect(taskInstance.isError(TaskInstanceStateLabel.RUNNING)).to.be.false
      expect(taskInstance.isError(TaskInstanceStateLabel.COMPLETE)).to.be.false
      expect(taskInstance.isError(TaskInstanceStateLabel.CANCELLED)).to.be
        .false
      expect(taskInstance.isError(TaskInstanceStateLabel.ERROR)).to.be.true
    })
  })

  describe('Selectors', () => {
    /** @test {selectValue} */
    it('selectValue', () => {
      expect(
        taskInstance.selectValue({ currentValue: 'VALUE' } as any),
      ).to.equal('VALUE')
    })

    /** @test {selectHasValue} */
    it('selectHasValue', () => {
      expect(taskInstance.selectHasValue({ hasValue: true } as any)).to.be.true
    })

    /** @test {selectState} */
    it('selectState', () => {
      expect(
        taskInstance.selectState({
          stateLabel: TaskInstanceStateLabel.ERROR,
        } as any),
      ).to.equal(TaskInstanceStateLabel.ERROR)
    })

    /** @test {selectError} */
    it('selectError', () => {
      expect(taskInstance.selectError({ error: 'ERROR' } as any)).to.equal(
        'ERROR',
      )
    })
  })

  describe('helpers', () => {
    /** @test {hasValue} */
    it('hasValue', () => {
      const hasValue: any[] = [
        { hasValue: true, stateLabel: TaskInstanceStateLabel.RUNNING },
        { hasValue: true, stateLabel: TaskInstanceStateLabel.COMPLETE },
      ]
      const hasNoValue: any[] = [
        { hasValue: false, stateLabel: TaskInstanceStateLabel.PENDING },
        { hasValue: false, stateLabel: TaskInstanceStateLabel.RUNNING },
        { hasValue: false, stateLabel: TaskInstanceStateLabel.CANCELLED },
        { hasValue: false, stateLabel: TaskInstanceStateLabel.COMPLETE },
        { hasValue: false, stateLabel: TaskInstanceStateLabel.ERROR },
        // As something went wrong, we assume we don't have a valid value
        { hasValue: true, stateLabel: TaskInstanceStateLabel.ERROR },
        // Cancelled task values probably don't make sense
        { hasValue: true, stateLabel: TaskInstanceStateLabel.CANCELLED },
        // Tasks have no initial value
        { hasValue: true, stateLabel: TaskInstanceStateLabel.PENDING },
      ]

      const expectHasValue = (has: boolean) => (v: any) =>
        expect(taskInstance.hasValue(v), JSON.stringify(v)).to.equal(has)

      hasValue.forEach(expectHasValue(true))
      hasNoValue.forEach(expectHasValue(false))
    })
  })
})
