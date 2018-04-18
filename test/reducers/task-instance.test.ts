import { Notification } from 'rxjs/Notification'
import * as taskInstance from '../../src/reducers/task-instance'
import {
  createNotificationAction,
  NotificationAction,
  NOTIFICATION_ACTION,
} from '../../src/actions/task-instance'
import { EMPTY_ACTION } from './helpers'
import { expect } from 'chai'
import { TaskInstanceState } from '../../src/reducers/task-instance'

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
          expect(state.state).to.equal(TaskInstanceState.RUNNING)
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
          expect(state.state).to.equal(TaskInstanceState.ERROR)
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
          expect(state.state).to.equal(TaskInstanceState.COMPLETE)
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
    it('isPending', () => {
      expect(taskInstance.isPending(TaskInstanceState.PENDING)).to.be.true
      expect(taskInstance.isPending(TaskInstanceState.RUNNING)).to.be.false
      expect(taskInstance.isPending(TaskInstanceState.COMPLETE)).to.be.false
      expect(taskInstance.isPending(TaskInstanceState.CANCELLED)).to.be.false
      expect(taskInstance.isPending(TaskInstanceState.ERROR)).to.be.false
    })

    it('isRunning', () => {
      expect(taskInstance.isRunning(TaskInstanceState.PENDING)).to.be.false
      expect(taskInstance.isRunning(TaskInstanceState.RUNNING)).to.be.true
      expect(taskInstance.isRunning(TaskInstanceState.COMPLETE)).to.be.false
      expect(taskInstance.isRunning(TaskInstanceState.CANCELLED)).to.be.false
      expect(taskInstance.isRunning(TaskInstanceState.ERROR)).to.be.false
    })

    it('isComplete', () => {
      expect(taskInstance.isComplete(TaskInstanceState.PENDING)).to.be.false
      expect(taskInstance.isComplete(TaskInstanceState.RUNNING)).to.be.false
      expect(taskInstance.isComplete(TaskInstanceState.COMPLETE)).to.be.true
      expect(taskInstance.isComplete(TaskInstanceState.CANCELLED)).to.be.false
      expect(taskInstance.isComplete(TaskInstanceState.ERROR)).to.be.false
    })

    it('isCancelled', () => {
      expect(taskInstance.isCancelled(TaskInstanceState.PENDING)).to.be.false
      expect(taskInstance.isCancelled(TaskInstanceState.RUNNING)).to.be.false
      expect(taskInstance.isCancelled(TaskInstanceState.COMPLETE)).to.be.false
      expect(taskInstance.isCancelled(TaskInstanceState.CANCELLED)).to.be.true
      expect(taskInstance.isCancelled(TaskInstanceState.ERROR)).to.be.false
    })

    it('isError', () => {
      expect(taskInstance.isError(TaskInstanceState.PENDING)).to.be.false
      expect(taskInstance.isError(TaskInstanceState.RUNNING)).to.be.false
      expect(taskInstance.isError(TaskInstanceState.COMPLETE)).to.be.false
      expect(taskInstance.isError(TaskInstanceState.CANCELLED)).to.be.false
      expect(taskInstance.isError(TaskInstanceState.ERROR)).to.be.true
    })
  })

  describe('Selectors', () => {
    it('selectValue', () => {
      expect(
        taskInstance.selectValue({ currentValue: 'VALUE' } as any),
      ).to.equal('VALUE')
    })

    it('selectHasValue', () => {
      expect(taskInstance.selectHasValue({ hasValue: true } as any)).to.be.true
    })

    it('selectState', () => {
      expect(
        taskInstance.selectState({ state: TaskInstanceState.ERROR } as any),
      ).to.equal(TaskInstanceState.ERROR)
    })

    it('selectError', () => {
      expect(taskInstance.selectError({ error: 'ERROR' } as any)).to.equal(
        'ERROR',
      )
    })
  })

  describe('helpers', () => {
    it('hasValue', () => {
      const hasValue: any[] = [
        { hasValue: true, state: TaskInstanceState.RUNNING },
        { hasValue: true, state: TaskInstanceState.COMPLETE },
      ]
      const hasNoValue: any[] = [
        { hasValue: false, state: TaskInstanceState.PENDING },
        { hasValue: false, state: TaskInstanceState.RUNNING },
        { hasValue: false, state: TaskInstanceState.CANCELLED },
        { hasValue: false, state: TaskInstanceState.COMPLETE },
        { hasValue: false, state: TaskInstanceState.ERROR },
        // As something went wrong, we assume we don't have a valid value
        { hasValue: true, state: TaskInstanceState.ERROR },
        // Cancelled task values probably don't make sense
        { hasValue: true, state: TaskInstanceState.CANCELLED },
        // Tasks have no initial value
        { hasValue: true, state: TaskInstanceState.PENDING },
      ]

      const expectHasValue = (has: boolean) => (v: any) =>
        expect(taskInstance.hasValue(v), JSON.stringify(v)).to.equal(has)

      hasValue.forEach(expectHasValue(true))
      hasNoValue.forEach(expectHasValue(false))
    })
  })
})
