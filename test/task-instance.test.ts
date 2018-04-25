import { Observable } from 'rxjs/Observable'
import { of } from 'rxjs/observable/of'
import { _throw as throwError } from 'rxjs/observable/throw'
import { TaskInstance } from '../src/task-instance'
import { marbles, Context as MarblesContext } from 'rxjs-marbles'
import { cases } from 'rxjs-marbles/mocha'
import { expect } from 'chai'
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError'
import { observable } from 'rxjs/symbol/observable'
import { delay } from 'rxjs/operators/delay'
import { TaskInstanceStateLabel } from '../src/reducers/task-instance'

function o<T>(t: TaskInstance<T>): Observable<T> {
  return t as any
}

const stateLabels: ReadonlyArray<TaskInstanceStateLabel> = [
  TaskInstanceStateLabel.PENDING,
  TaskInstanceStateLabel.RUNNING,
  TaskInstanceStateLabel.CANCELLED,
  TaskInstanceStateLabel.ERROR,
  TaskInstanceStateLabel.COMPLETE,
]

function ucfirst(str: string): string {
  return `${str[0].toUpperCase()}${str.slice(1)}`
}

function expectState(
  m: MarblesContext,
  taskInstance: TaskInstance<any>,
  expected: string,
  values: { [key: string]: TaskInstanceStateLabel },
): void {
  m.expect(taskInstance.stateLabel$).toBeObservable(m.cold(expected, values))

  stateLabels.forEach(sl => {
    let stateLabelValues = Object.keys(values).reduce(
      (slv: any, key) => Object.assign(slv, { [key]: sl === values[key] }),
      {},
    )

    m
      .expect((taskInstance as any)[`is${ucfirst(sl)}$`])
      .toBeObservable(m.cold(expected, stateLabelValues))
  })
}

/** @test {TaskInstance} */
describe('TaskInstance', () => {
  describe('instantiating', () => {
    it(
      'wraps an observable',
      marbles(m => {
        const observable = of(true)
        const taskInstance = new TaskInstance(observable)
        const expected = m.cold('(x|)', { x: true })

        m.expect(o(taskInstance)).toBeObservable(expected)
      }),
    )
  })

  /** @test {TaskInstance#unsubscribe} */
  describe('unsubscribe', () => {
    it('closes the TaskInstance', () => {
      const taskInstance = new TaskInstance(of(true))

      taskInstance.unsubscribe()

      expect(taskInstance.closed).to.be.true
      expect(() => taskInstance.subscribe()).to.throw(ObjectUnsubscribedError)
    })
  })

  describe('Symbol.observable', () => {
    it('implements observable interface', () => {
      const taskInstance = new TaskInstance(of(true))

      expect(taskInstance).to.equal((taskInstance as any)[observable]())
    })
  })

  /** @test {TaskInstance#stateLabel$} */
  /** @test {TaskInstance#isPending$} */
  /** @test {TaskInstance#isRunning$} */
  /** @test {TaskInstance#isCancelled$} */
  /** @test {TaskInstance#isError$} */
  /** @test {TaskInstance#isComplete$} */
  describe('stateLabel$', () => {
    it(
      'is pending after creation',
      marbles(m => {
        expectState(m, new TaskInstance(of('somevalue')), 'a', {
          a: TaskInstanceStateLabel.PENDING,
        })
      }),
    )

    it(
      'is runs and completes after subscription',
      marbles(m => {
        const taskInstance = new TaskInstance(
          of('somevalue').pipe(delay(m.time('----|'), m.scheduler)),
        )

        expectState(m, taskInstance, '(ab)(c|)', {
          a: TaskInstanceStateLabel.PENDING,
          b: TaskInstanceStateLabel.RUNNING,
          c: TaskInstanceStateLabel.COMPLETE,
        })
        m
          .expect(o(taskInstance))
          .toBeObservable(m.cold('----(a|)', { a: 'somevalue' }))
      }),
    )

    it(
      'cancels on unsubscribe',
      marbles(m => {
        const taskInstance = new TaskInstance(
          of('somevalue').pipe(delay(m.time('----|'), m.scheduler)),
        )

        expectState(m, taskInstance, '(ab)c---', {
          a: TaskInstanceStateLabel.PENDING,
          b: TaskInstanceStateLabel.RUNNING,
          c: TaskInstanceStateLabel.CANCELLED,
        })
        m
          .expect(o(taskInstance), '----!')
          .toBeObservable(m.cold('-----', {}))
      }),
    )

    it(
      'switches to error state on error',
      marbles(m => {
        const taskInstance = new TaskInstance(
          throwError(new Error('Not good')),
        )

        expectState(m, taskInstance, '(abc|)', {
          a: TaskInstanceStateLabel.PENDING,
          b: TaskInstanceStateLabel.RUNNING,
          c: TaskInstanceStateLabel.ERROR,
        })
        m
          .expect(o(taskInstance))
          .toBeObservable(m.cold('#', {}, new Error('Not good')))
      }),
    )
  })
})
