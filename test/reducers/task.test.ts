import * as task from '../../src/reducers/task'
import { EMPTY_ACTION, createStateMatcher } from './helpers'
import { expect } from 'chai'
import { TaskInstance } from '../../src/task-instance'
import { TaskInstanceStateLabel } from '../../src/reducers/task-instance'
import {
  TaskInstanceStateUpdateAction,
  TASK_INSTANCE_STATE_UPDATE_ACTION,
  TaskActions,
} from '../../src/actions/task'
import { createAction } from '../../src/actions'
import { TaskInstanceWithStateLabel } from '../../src/reducers/task'

const expectStateChange = createStateMatcher(task.reducer)

let taskInstanceId = 0

class TaskInstanceMock<T> {
  taskInstanceId = ++taskInstanceId
}

class TaskInstanceWithStateLabelMock<T>
  implements TaskInstanceWithStateLabel<T> {
  constructor(
    public readonly taskInstanceStateLabel: TaskInstanceStateLabel,
    public readonly taskInstance: TaskInstance<
      T
    > = new TaskInstanceMock() as any,
  ) {}

  toAction(): TaskInstanceStateUpdateAction<T> {
    return createTaskInstanceStateUpdateAction(this)
  }

  changeState(stateLabel: TaskInstanceStateLabel) {
    return new TaskInstanceWithStateLabelMock(stateLabel, this.taskInstance)
  }
}

function createTaskInstance<T>(
  stateLabel: TaskInstanceStateLabel,
): {
  taskInstanceWithState: TaskInstanceWithStateLabelMock<T>
  taskInstance: TaskInstance<T>
  action: TaskInstanceStateUpdateAction<T>
} {
  const taskInstanceWithState = new TaskInstanceWithStateLabelMock<T>(
    stateLabel,
  )

  return {
    taskInstanceWithState,
    taskInstance: taskInstanceWithState.taskInstance,
    action: taskInstanceWithState.toAction(),
  }
}

function createTaskInstanceStateUpdateAction<T>(
  taskInstanceWithStateLabel: TaskInstanceWithStateLabel<T>,
): TaskInstanceStateUpdateAction<T> {
  return createAction(
    TASK_INSTANCE_STATE_UPDATE_ACTION,
    taskInstanceWithStateLabel,
  )
}

describe('reducers/Task', () => {
  describe('Static states', () => {
    /** @test {INITIAL_STATE} */
    it('defines an initial state', () => {
      expect(task.INITIAL_STATE).to.deep.equal({
        performed: 0,
        pending: [],
        running: [],
        successful: 0,
        cancelled: 0,
        errored: 0,
        completed: 0,
        last: null,
        lastRunning: null,
        lastSuccessful: null,
        lastCancelled: null,
        lastErrored: null,
        lastCompleted: null,
      })
    })
  })

  /** @test {reducer} */
  describe('Reducer', () => {
    describe('Initial state', () => {
      it('equals INITIAL_STATE', () => {
        expectStateChange(undefined, EMPTY_ACTION, task.INITIAL_STATE)
      })
    })

    describe('TaskInstance state changes', () => {
      let state: task.State<any>

      beforeEach(() => {
        state = task.INITIAL_STATE
      })

      describe('PENDING', () => {
        it('counts performed and tracks pending instances', () => {
          var { taskInstance, action } = createTaskInstance(
            TaskInstanceStateLabel.PENDING,
          )

          state = expectStateChange(state, action, {
            performed: 1,
            pending: [taskInstance],
            last: taskInstance,
          })

          var { taskInstance, action } = createTaskInstance(
            TaskInstanceStateLabel.PENDING,
          )

          expectStateChange(state, action, {
            performed: 2,
            pending: state.pending.concat(taskInstance),
            last: taskInstance,
          })
        })
      })

      describe('RUNNING', () => {
        let pending1 = createTaskInstance(TaskInstanceStateLabel.PENDING)
        let pending2 = createTaskInstance(TaskInstanceStateLabel.PENDING)
        let pending3 = createTaskInstance(TaskInstanceStateLabel.PENDING)

        beforeEach(() => {
          state = task.reducer(state, pending1.action)
          state = task.reducer(state, pending2.action)
          state = task.reducer(state, pending3.action)

          expect(state.pending.length).to.equal(3)
        })

        it('removes from pending and tracks running', () => {
          let running1 = pending1.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.RUNNING,
          )
          state = expectStateChange(state, running1.toAction(), {
            pending: [pending2.taskInstance, pending3.taskInstance],
            running: [running1.taskInstance],
            lastRunning: running1.taskInstance,
          })

          let running3 = pending3.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.RUNNING,
          )
          state = expectStateChange(state, running3.toAction(), {
            pending: [pending2.taskInstance],
            running: [running1.taskInstance, pending3.taskInstance],
            lastRunning: running3.taskInstance,
          })
        })
      })

      describe('CANCELLED', () => {
        let pending1 = createTaskInstance(TaskInstanceStateLabel.PENDING)
        let running1 = createTaskInstance(TaskInstanceStateLabel.RUNNING)
        let running2 = createTaskInstance(TaskInstanceStateLabel.RUNNING)

        beforeEach(() => {
          state = task.reducer(state, pending1.action)
          state = task.reducer(state, running1.action)
          state = task.reducer(state, running2.action)

          expect(state.pending.length).to.equal(1)
          expect(state.running.length).to.equal(2)
        })

        it('removes from pending and running and tracks cancelled', () => {
          let cancelled1 = pending1.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.CANCELLED,
          )
          state = expectStateChange(state, cancelled1.toAction(), {
            pending: [],
            running: [running1.taskInstance, running2.taskInstance],
            cancelled: 1,
            lastCancelled: cancelled1.taskInstance,
          })

          let cancelled2 = running1.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.CANCELLED,
          )
          state = expectStateChange(state, cancelled2.toAction(), {
            running: [running2.taskInstance],
            cancelled: 2,
            lastCancelled: cancelled2.taskInstance,
          })
        })
      })

      describe('ERROR', () => {
        let pending1 = createTaskInstance(TaskInstanceStateLabel.PENDING)
        let running1 = createTaskInstance(TaskInstanceStateLabel.RUNNING)
        let running2 = createTaskInstance(TaskInstanceStateLabel.RUNNING)

        beforeEach(() => {
          state = task.reducer(state, pending1.action)
          state = task.reducer(state, running1.action)
          state = task.reducer(state, running2.action)
          state = { ...state, completed: 1 }

          expect(state.pending.length).to.equal(1)
          expect(state.running.length).to.equal(2)
        })

        it('removes from pending and running and tracks errored', () => {
          let errored1 = pending1.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.ERROR,
          )
          state = expectStateChange(state, errored1.toAction(), {
            pending: [],
            running: [running1.taskInstance, running2.taskInstance],
            errored: 1,
            completed: 2,
            lastCompleted: errored1.taskInstance,
            lastErrored: errored1.taskInstance,
          })

          let errored2 = running1.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.ERROR,
          )
          state = expectStateChange(state, errored2.toAction(), {
            running: [running2.taskInstance],
            errored: 2,
            completed: 3,
            lastCompleted: errored2.taskInstance,
            lastErrored: errored2.taskInstance,
          })
        })
      })

      describe('COMPLETE', () => {
        let pending1 = createTaskInstance(TaskInstanceStateLabel.PENDING)
        let running1 = createTaskInstance(TaskInstanceStateLabel.RUNNING)
        let running2 = createTaskInstance(TaskInstanceStateLabel.RUNNING)

        beforeEach(() => {
          state = task.reducer(state, pending1.action)
          state = task.reducer(state, running1.action)
          state = task.reducer(state, running2.action)
          state = { ...state, errored: 1, completed: 1 }

          expect(state.pending.length).to.equal(1)
          expect(state.running.length).to.equal(2)
        })

        it('removes from pending and running and tracks completed', () => {
          let completed1 = pending1.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.COMPLETE,
          )
          state = expectStateChange(state, completed1.toAction(), {
            pending: [],
            running: [running1.taskInstance, running2.taskInstance],
            successful: 1,
            completed: 2,
            lastSuccessful: completed1.taskInstance,
            lastCompleted: completed1.taskInstance,
          })

          let completed2 = running1.taskInstanceWithState.changeState(
            TaskInstanceStateLabel.COMPLETE,
          )
          state = expectStateChange(state, completed2.toAction(), {
            running: [running2.taskInstance],
            successful: 2,
            completed: 3,
            lastSuccessful: completed2.taskInstance,
            lastCompleted: completed2.taskInstance,
          })
        })
      })

      describe('Unkown TaskInstance state', () => {
        let { action } = createTaskInstance('__unkown_state__' as any)

        expect(() => task.reducer(state, action)).to.throw(
          TypeError,
          'Unkown value __unkown_state__',
        )
      })
    })
  })

  describe('Selectors', () => {
    let state: task.State<any>
    let last = {} as TaskInstance<any>
    let lastRunning = {} as TaskInstance<any>
    let lastSuccessful = {} as TaskInstance<any>
    let lastCancelled = {} as TaskInstance<any>
    let lastErrored = {} as TaskInstance<any>
    let lastCompleted = {} as TaskInstance<any>
    let pending = [{}, last] as TaskInstance<any>[]
    let running = [lastRunning] as TaskInstance<any>[]

    beforeEach(() => {
      state = {
        performed: 1,
        pending,
        running,
        successful: 2,
        cancelled: 3,
        errored: 4,
        completed: 5,
        last,
        lastRunning,
        lastSuccessful,
        lastCancelled,
        lastErrored,
        lastCompleted,
      }
    })

    /** @test {selectPerformed} */
    it('selectPerformed', () => {
      expect(task.selectPerformed(state)).to.equal(1)
    })

    /** @test {selectPending} */
    it('selectPending', () => {
      expect(task.selectPending(state)).to.equal(pending)
    })

    /** @test {selectRunning} */
    it('selectRunning', () => {
      expect(task.selectRunning(state)).to.equal(running)
    })

    /** @test {selectSuccessful} */
    it('selectSuccessful', () => {
      expect(task.selectSuccessful(state)).to.equal(2)
    })

    /** @test {selectCancelled} */
    it('selectCancelled', () => {
      expect(task.selectCancelled(state)).to.equal(3)
    })

    /** @test {selectErrored} */
    it('selectErrored', () => {
      expect(task.selectErrored(state)).to.equal(4)
    })

    /** @test {selectCompleted} */
    it('selectCompleted', () => {
      expect(task.selectCompleted(state)).to.equal(5)
    })

    /** @test {selectLast} */
    it('selectLast', () => {
      expect(task.selectLast(state)).to.equal(last)
    })

    /** @test {selectLastRunning} */
    it('selectLastRunning', () => {
      expect(task.selectLastRunning(state)).to.equal(lastRunning)
    })

    /** @test {selectLastSuccessful} */
    it('selectLastSuccesful', () => {
      expect(task.selectLastSuccessful(state)).to.equal(lastSuccessful)
    })

    /** @test {selectLastCancelled} */
    it('selectLastCancelled', () => {
      expect(task.selectLastCancelled(state)).to.equal(lastCancelled)
    })

    /** @test {selectLastErrored} */
    it('selectLastErrored', () => {
      expect(task.selectLastErrored(state)).to.equal(lastErrored)
    })

    /** @test {selectLastCompleted} */
    it('selectLastCompleted', () => {
      expect(task.selectLastCompleted(state)).to.equal(lastCompleted)
    })
  })

  describe('helpers', () => {
    /** @test {combineTaskInstanceWithState} */
    it('combineTaskInstanceWithState', () => {
      expect(
        task.combineTaskInstanceWithStateLabel(
          'task' as any,
          { stateLabel: 'state' } as any,
        ),
      ).to.deep.equal({ taskInstance: 'task', taskInstanceStateLabel: 'state' })
    })
  })
})
