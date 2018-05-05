import { Observable } from 'rxjs/Observable'
import { of } from 'rxjs/observable/of'
import { Subject } from 'rxjs/Subject'
import { task, Task } from '../src/task'
import { TaskInstance } from '../src/task-instance'
import { notNull } from '../src/utils/filter'
import { expect } from 'chai'
import { stub } from 'sinon'
import { marbles, Context as MarblesContext } from 'rxjs-marbles'
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError'
import { takeUntil, delay } from 'rxjs/operators'
import {
  INITIAL_STATE,
  State,
  selectPerformed,
  selectRunning,
  selectCancelled,
  selectSuccessful,
  selectErrored,
  selectCompleted,
  selectLast,
  selectLastRunning,
  selectLastSuccessful,
  selectLastCancelled,
  selectLastErrored,
  selectLastCompleted,
  selectPending,
  isIdle,
  isRunning,
} from '../src/reducers/task'

import { o } from './test-helpers'
import * as dict from './test-helpers/dict'

type ObservablePropertyNames<T> = {
  [K in keyof T]: T[K] extends Observable<any> ? K : never
}[keyof T]

type UnpackObservable<T> = T extends Observable<infer U> ? U : never

type ObservablesExpectation<T> = {
  [P in ObservablePropertyNames<T>]: ExpectObservable<UnpackObservable<T[P]>>
}

type ExpectObservable<T> = { expected: string; values?: dict.Dict<T> }

function expectObservables<T extends Task<any, any>>(
  m: MarblesContext,
  task: T,
  expectations: ObservablesExpectation<T>,
): void {
  Object.keys(expectations).forEach(k => {
    const { expected, values } = (expectations as any)[k]
    m.expect((task as any)[k]).toBeObservable(expected, values)
  })
}

function incrementalStates<T>(
  states: dict.Dict<Partial<State<T>>>,
): dict.Dict<State<T>> {
  return dict.reduce(
    states,
    (acc, s, k, i, keys, states) => (
      (acc[k] = state(
        (acc[keys[keys.indexOf(k) - 1]] as State<T>) || INITIAL_STATE,
        s,
      )),
      acc
    ),
    {} as dict.Dict<State<T>>,
  )
}

function stateExpectation<T>(
  expected: string,
  values: dict.Dict<State<T>>,
  exceptions: Partial<ObservablesExpectation<Task<T, any>>> = {},
): ObservablesExpectation<Task<T, any>> {
  return {
    state$: exceptions.state$ || { expected, values },
    pending$: exceptions.pending$ || {
      expected,
      values: dict.map(values, selectPending),
    },
    performed$: exceptions.performed$ || {
      expected,
      values: dict.map(values, selectPerformed),
    },
    running$: exceptions.running$ || {
      expected,
      values: dict.map(values, selectRunning),
    },
    cancelled$: exceptions.cancelled$ || {
      expected,
      values: dict.map(values, selectCancelled),
    },
    successful$: exceptions.successful$ || {
      expected,
      values: dict.map(values, selectSuccessful),
    },
    errored$: exceptions.errored$ || {
      expected,
      values: dict.map(values, selectErrored),
    },
    completed$: exceptions.completed$ || {
      expected,
      values: dict.map(values, selectCompleted),
    },
    isIdle$: exceptions.isIdle$ || {
      expected,
      values: dict.map(values, isIdle)
    },
    isRunning$: exceptions.isRunning$ || {
      expected,
      values: dict.map(values, isRunning)
    },
    last$: exceptions.last$ || {
      expected,
      values: dict.filter(dict.map(values, selectLast), notNull),
    },
    lastRunning$: exceptions.lastRunning$ || {
      expected,
      values: dict.filter(dict.map(values, selectLastRunning), notNull),
    },
    lastSuccessful$: exceptions.lastSuccessful$ || {
      expected,
      values: dict.filter(dict.map(values, selectLastSuccessful), notNull),
    },
    lastCancelled$: exceptions.lastCancelled$ || {
      expected,
      values: dict.filter(dict.map(values, selectLastCancelled), notNull),
    },
    lastErrored$: exceptions.lastErrored$ || {
      expected,
      values: dict.filter(dict.map(values, selectLastErrored), notNull),
    },
    lastCompleted$: exceptions.lastCompleted$ || {
      expected,
      values: dict.filter(dict.map(values, selectLastCompleted), notNull),
    },
  }
}

function state(): typeof INITIAL_STATE
function state<T>(s: Partial<State<T>>): State<T>
function state<T>(d: State<T>, s: Partial<State<T>>): State<T>
function state<T>(): State<T> {
  if (arguments.length === 2) {
    return { ...arguments[0], ...arguments[1] }
  }

  return { ...INITIAL_STATE, ...arguments[0] }
}

/** @test {Task} */
describe('Task', () => {
  let destroy$: Subject<void>
  beforeEach(() => {
    destroy$ = new Subject()
  })
  afterEach(() => {
    destroy$.next()
  })

  it('has an id', () => {
    expect(new Task(stub()).id).to.be.a('number')
  })

  /** @test {Task#toString} */
  it('casts to a string', () => {
    expect(new Task(stub())).to.match(/^Task#\d+$/)
  })

  /** @test {Task#toJSON} */
  it('deserializes to JSON', () => {
    const json = new Task(stub()).toJSON()
    expect(json.type).to.equal('Task')
    expect(json.id).to.be.a('number')
  })

  /** @test {Task#perform} */
  describe('perform', () => {
    it('executes the given function and creates a TaskInstance', () => {
      const fn = stub().returns(of(true))
      const t = task(fn).subscribeUntil(destroy$)

      const i = t.perform('task')

      expect(i).to.be.instanceOf(TaskInstance)
      expect(fn).to.be.calledWith('task')

      t.perform('second task')

      expect(fn).to.be.calledWith('second task')
    })

    it(
      'returns a TaskInstance which resolves to the observable value',
      marbles(m => {
        const fn = stub().returns(of('a'))
        const t = task(fn).subscribeUntil(destroy$)
        m.expect(o(t.perform('task'))).toBeObservable('(a|)')
      }),
    )
  })

  /** @test {Task#unsubscribe} */
  describe('unsubscribe', () => {
    it('closes the Task', () => {
      const fn = stub()
      const t = task(fn).subscribeUntil(destroy$)

      t.unsubscribe()

      expect(t.closed).to.be.true
      expect(() => t.subscribe()).to.throw(ObjectUnsubscribedError)
      expect(() => t.perform(null)).to.throw(ObjectUnsubscribedError)
      expect(fn).to.not.be.called
    })
  })

  /** @test {Task#callable} */
  describe('callable', () => {
    it('creates a callable task object', () => {
      const fn = stub().returns(of(true))
      const t = task(fn)
        .callable()
        .subscribeUntil(destroy$)

      const i = t('callable task')

      expect(i).to.be.instanceOf(TaskInstance)
      expect(fn).to.be.calledWith('callable task')
    })
  })

  describe('default', () => {
    /** @test {Task#state$} */
    describe('state$', () => {
      it(
        'matches initial state without emitting null tasks',
        marbles(m => {
          m.bind()
          const t = task(() => of(true)).subscribeUntil(destroy$)

          expectObservables(
            m,
            t,
            stateExpectation(
              'a',
              { a: state() },
              {
                last$: { expected: '-' },
                lastRunning$: { expected: '-' },
                lastSuccessful$: { expected: '-' },
                lastCancelled$: { expected: '-' },
                lastErrored$: { expected: '-' },
                lastCompleted$: { expected: '-' },
              },
            ),
          )
        }),
      )

      it(
        'counts performed, successful and completed tasks',
        marbles(m => {
          m.bind()

          const t = task(() => of(true)).subscribeUntil(destroy$)

          t.state$.pipe(takeUntil(destroy$)).subscribe()

          const first = t.perform('task')
          const last = t.perform('second task')

          expectObservables(
            m,
            t,
            stateExpectation(
              'a',
              {
                a: state({
                  performed: 2,
                  successful: 2,
                  completed: 2,
                  last,
                  lastRunning: last,
                  lastSuccessful: last,
                  lastCompleted: last,
                }),
              },
              {
                lastCancelled$: { expected: '-' },
                lastErrored$: { expected: '-' },
              },
            ),
          )
        }),
      )
    })
  })

  /** @test {Task#concurrency} */
  describe('concurrency', () => {
    /** @test {Task#state$} */
    describe('state$', () => {
      it(
        'counts performed, successful and completed tasks',
        marbles(m => {
          m.bind()

          const t = task(() => of(true).pipe(delay(m.time('--|'))))
            .concurrency(2)
            .subscribeUntil(destroy$)

          t.state$.pipe(takeUntil(destroy$)).subscribe()

          const one = t.perform('task 1')
          const two = t.perform('task 2')
          const three = t.perform('task 3')
          const four = t.perform('task 4')
          const five = t.perform('task 5')

          expectObservables(
            m,
            t,
            stateExpectation(
              'a-b-c-d',
              incrementalStates({
                a: {
                  performed: 5,
                  pending: [three, four, five],
                  running: [one, two],
                  successful: 0,
                  completed: 0,
                  last: five,
                  lastRunning: two,
                },
                b: {
                  pending: [five],
                  running: [three, four],
                  successful: 2,
                  completed: 2,
                  lastRunning: four,
                  lastSuccessful: two,
                  lastCompleted: two,
                },
                c: {
                  pending: [],
                  running: [five],
                  successful: 4,
                  completed: 4,
                  lastRunning: five,
                  lastSuccessful: four,
                  lastCompleted: four,
                },
                d: {
                  running: [],
                  successful: 5,
                  completed: 5,
                  lastRunning: five,
                  lastSuccessful: five,
                  lastCompleted: five,
                },
              }),
              {
                lastSuccessful$: {
                  expected: '--b-d-e',
                  values: { a: one, b: two, c: three, d: four, e: five },
                },
                lastCompleted$: {
                  expected: '--b-d-e',
                  values: { a: one, b: two, c: three, d: four, e: five },
                },
                lastCancelled$: { expected: '-' },
                lastErrored$: { expected: '-' },
              },
            ),
          )
        }),
      )
    })
  })

  /** @test {Task#concat} */
  describe('concat', () => {
    /** @test {Task#state$} */
    describe('state$', () => {
      it(
        'counts performed, successful and completed tasks',
        marbles(m => {
          m.bind()

          const t = task(() => of(true).pipe(delay(m.time('--|'))))
            .concat()
            .subscribeUntil(destroy$)

          t.state$.pipe(takeUntil(destroy$)).subscribe()

          const first = t.perform('task')
          const last = t.perform('second task')

          expectObservables(
            m,
            t,
            stateExpectation(
              'a-b-c',
              incrementalStates({
                a: {
                  performed: 2,
                  pending: [last],
                  running: [first],
                  last,
                  lastRunning: first,
                },
                b: {
                  pending: [],
                  running: [last],
                  successful: 1,
                  completed: 1,
                  lastRunning: last,
                  lastSuccessful: first,
                  lastCompleted: first,
                },
                c: {
                  running: [],
                  successful: 2,
                  completed: 2,
                  lastSuccessful: last,
                  lastCompleted: last,
                },
              }),
              {
                lastSuccessful$: {
                  expected: '--b-c',
                  values: { b: first, c: last },
                },
                lastCompleted$: {
                  expected: '--b-c',
                  values: { b: first, c: last },
                },
                lastCancelled$: { expected: '-' },
                lastErrored$: { expected: '-' },
              },
            ),
          )
        }),
      )
    })
  })

  /** @test {Task#switch} */
  describe('switch', () => {
    /** @test {Task#state$} */
    describe('state$', () => {
      it(
        'counts performed, successful and completed tasks',
        marbles(m => {
          m.bind()

          const t = task(() => of(true).pipe(delay(m.time('--|'))))
            .switch()
            .subscribeUntil(destroy$)

          t.state$.pipe(takeUntil(destroy$)).subscribe()

          const first = t.perform('task')
          const last = t.perform('second task')

          expectObservables(
            m,
            t,
            stateExpectation(
              'a-b',
              incrementalStates({
                a: {
                  performed: 2,
                  pending: [],
                  running: [last],
                  cancelled: 1,
                  last,
                  lastRunning: last,
                  lastCancelled: first,
                },
                b: {
                  running: [],
                  successful: 1,
                  completed: 1,
                  lastSuccessful: last,
                  lastCompleted: last,
                },
              }),
              {
                lastSuccessful$: {
                  expected: '--b',
                  values: { b: last },
                },
                lastCompleted$: {
                  expected: '--b',
                  values: { b: last },
                },
                lastCancelled$: { expected: 'a-a', values: { a: first } },
                lastErrored$: { expected: '-' },
              },
            ),
          )
        }),
      )
    })
  })

  /** @test {Task#drop} */
  describe('drop', () => {
    /** @test {Task#state$} */
    describe('state$', () => {
      it(
        'counts performed, successful and completed tasks',
        marbles(m => {
          m.bind()

          const t = task(() => of(true).pipe(delay(m.time('--|'))))
            .drop()
            .subscribeUntil(destroy$)

          t.state$.pipe(takeUntil(destroy$)).subscribe()

          const first = t.perform('task')
          const last = t.perform('second task')

          expectObservables(
            m,
            t,
            stateExpectation(
              'a-b',
              incrementalStates({
                a: {
                  performed: 2,
                  pending: [last],
                  running: [first],
                  last,
                  lastRunning: first,
                },
                b: {
                  pending: [],
                  running: [],
                  successful: 1,
                  cancelled: 1,
                  completed: 1,
                  lastSuccessful: first,
                  lastCancelled: last,
                  lastCompleted: first,
                },
              }),
              {
                lastSuccessful$: {
                  expected: '--a',
                  values: { a: first },
                },
                lastCompleted$: {
                  expected: '--a',
                  values: { a: first },
                },
                lastCancelled$: { expected: '--b', values: { b: last } },
                lastErrored$: { expected: '-' },
              },
            ),
          )
        }),
      )
    })
  })
})
