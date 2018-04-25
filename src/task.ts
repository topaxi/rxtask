import { Subscription, ISubscription } from 'rxjs/Subscription'
import { Observable, Subscribable } from 'rxjs/Observable'
import { defer } from 'rxjs/observable/defer'
import { PartialObserver } from 'rxjs/Observer'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { asap } from 'rxjs/scheduler/asap'
import {
  map,
  mergeMap,
  exhaust,
  mergeAll,
  switchAll,
  takeUntil,
  share,
  shareReplay,
  auditTime,
} from 'rxjs/operators'

import { TaskInstance } from './task-instance'
import { createCallableObject, assertNever } from './utils'
import {
  TaskCallback,
  AnyTaskCallback,
  TaskFromCallback,
  CallableTask,
} from './interfaces'

import * as taskReducer from './reducers/task'
import {
  selectPerformed,
  selectPending,
  selectRunning,
  selectSuccessful,
  selectCancelled,
  selectErrored,
  selectCompleted,
  selectLast,
  selectLastRunning,
  selectLastSuccessful,
  selectLastCancelled,
  selectLastErrored,
  selectLastCompleted,
} from './reducers/task'
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError'
import { actionReducer } from './operators/action-reducer'
import * as taskActions from './actions/task'
import { TaskActions } from './actions/task'
import { toAction } from './actions'

type AnyObservable = Observable<any>

/**
 * @param {TaskCallback<T, U>} task
 * @return {Task<U>}
 */
export const task = <T extends AnyTaskCallback>(
  task: T,
): TaskFromCallback<T> => new Task(task)

const selectState$ = <T>(t: TaskInstance<T>) => t.state$

const enum Flatten {
  SWITCH = 'switch',
  EXHAUST = 'exhaust',
  MERGE = 'merge',
}

/**
 * @class Task<T, U>
 * @implements {Subscribable<T>}
 * @implements {ISubscription}
 */
export class Task<T, U> implements Subscribable<T>, ISubscription {
  private _flattenType = Flatten.MERGE
  private _concurrency = Infinity
  private _autoSubscribe = false
  private _closed = false

  private readonly _subscription = new Subscription()
  private readonly _task: TaskCallback<U, T>
  private readonly _perform$ = new Subject<TaskInstance<T>>()
  private readonly _takeUntilObservable$ = new ReplaySubject<AnyObservable>(1)
  private readonly _takeUntil$ = this._takeUntilObservable$.pipe(switchAll())
  private readonly _task$ = defer(() =>
    this._perform$.pipe(this._flatten(), takeUntil(this._takeUntil$)),
  ).pipe(share())

  /** @type {Observable<TaskState<T>>} */
  readonly state$ = this._perform$.pipe(
    mergeMap(selectState$, taskReducer.combineTaskInstanceWithStateLabel),
    map(toAction(taskActions.TASK_INSTANCE_STATE_UPDATE_ACTION)),
    actionReducer<TaskActions<T>, taskReducer.State<T>>(taskReducer.reducer),
    auditTime(0, asap),
    takeUntil(this._takeUntil$),
    shareReplay(1),
  )

  /** @type {Observable<number>} */
  readonly performed$ = this.state$.pipe(map(selectPerformed))
  /** @type {Observable<Array<TaskInstance<T>>>} */
  readonly pending$ = this.state$.pipe(map(selectPending))
  /** @type {Observable<Array<TaskInstance<T>>>} */
  readonly running$ = this.state$.pipe(map(selectRunning))
  /** @type {Observable<number>} */
  readonly cancelled$ = this.state$.pipe(map(selectCancelled))
  /** @type {Observable<number>} */
  readonly successful$ = this.state$.pipe(map(selectSuccessful))
  /** @type {Observable<number>} */
  readonly errored$ = this.state$.pipe(map(selectErrored))
  /** @type {Observable<number>} */
  readonly completed$ = this.state$.pipe(map(selectCompleted))
  /** @type {Observable<TaskInstance<T>>} */
  readonly last$ = this.state$.pipe(map(selectLast))
  /** @type {Observable<TaskInstance<T>>} */
  readonly lastRunning$ = this.state$.pipe(map(selectLastRunning))
  /** @type {Observable<TaskInstance<T>>} */
  readonly lastSuccessful$ = this.state$.pipe(map(selectLastSuccessful))
  /** @type {Observable<TaskInstance<T>>} */
  readonly lastCancelled$ = this.state$.pipe(map(selectLastCancelled))
  /** @type {Observable<TaskInstance<T>>} */
  readonly lastErrored$ = this.state$.pipe(map(selectLastErrored))
  /** @type {Observable<TaskInstance<T>>} */
  readonly lastCompleted$ = this.state$.pipe(map(selectLastCompleted))

  /** @type {boolean} */
  get closed(): boolean {
    return this._closed
  }

  /**
   * @param {TaskCallback<U, T>} task
   * @return {Task<T, U>}
   */
  constructor(task: TaskCallback<U, T>) {
    this._task = task
  }

  /**
   * @param {U} value
   * @return {TaskInstance<T>}
   */
  perform(value: U): TaskInstance<T> {
    if (this._closed) throw new ObjectUnsubscribedError()

    if (this._autoSubscribe === true) {
      this.subscribe()
    }

    const task = this._createTaskInstance(this._task, value)
    return this._perform$.next(task), task
  }

  /**
   * @param {Observable<any>} until$
   * @return {Task<T>}
   */
  takeUntil(until$: Observable<any>): this {
    this._takeUntilObservable$.next(until$)
    return this
  }

  /**
   * @param {Observable<any>} until$
   * @return {Task<T>}
   */
  subscribeUntil(until$: Observable<any>): this {
    this._autoSubscribe = true
    return this.takeUntil(until$)
  }

  subscribe(observer?: PartialObserver<T>): Subscription
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): Subscription
  /**
   * @param {Observer|Function} observerOrNext (optional) Either an observer with methods to be called,
   *  or the first of three possible handlers, which is the handler for each value emitted from the subscribed
   *  Observable.
   * @param {Function} error (optional) A handler for a terminal event resulting from an error. If no error handler is provided,
   *  the error will be thrown as unhandled.
   * @param {Function} complete (optional) A handler for a terminal event resulting from successful completion.
   * @return {ISubscription} a subscription reference to the registered handlers
   */
  subscribe(
    observerOrNext?: PartialObserver<T> | ((value: T) => void),
    error?: (error: any) => void,
    complete?: () => void,
  ): Subscription {
    if (this._closed) throw new ObjectUnsubscribedError()

    this._autoSubscribe = false
    return this._subscription.add(
      this._task$.subscribe(observerOrNext as any, error, complete),
    )
  }

  /**
   * @return {void}
   */
  unsubscribe(): void {
    this._closed = true
    this._subscription.unsubscribe()
  }

  /**
   * @param {number} concurrency
   * @return {Task<T>}
   */
  concurrency(
    concurrency: number,
  ): this & { switch: never; concat: never; drop: never } {
    this._flattenType = Flatten.MERGE
    this._concurrency = concurrency
    return this as any
  }

  /**
   * @return {Task<T>}
   */
  switch(): this & { concurrency: never; concat: never; drop: never } {
    this._flattenType = Flatten.SWITCH
    return this as any
  }

  /**
   * @return {Task<T>}
   */
  concat(): this & { concurrency: never; switch: never; drop: never } {
    return this.concurrency(1) as any
  }

  /**
   * @return {Task<T>}
   */
  drop(): this & { concurrency: never; switch: never; concat: never } {
    this._flattenType = Flatten.EXHAUST
    return this as any
  }

  /**
   * @return {Callable<Task<T>>}
   */
  callable(): CallableTask<this> {
    return createCallableObject(this, this.perform)
  }

  private _flatten(): (source$: Observable<any>) => Observable<T> {
    switch (this._flattenType) {
      case Flatten.SWITCH:
        return switchAll()
      case Flatten.EXHAUST:
        return exhaust()
      case Flatten.MERGE:
        return mergeAll(this._concurrency)
      default:
        return assertNever(this._flattenType)
    }
  }

  private _createTaskInstance(t: TaskCallback<U, T>, v: U): TaskInstance<T> {
    return new TaskInstance<T>(defer(() => t(v)))
  }
}
