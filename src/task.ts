import { Subscription, ISubscription } from 'rxjs/Subscription'
import { Observable, Subscribable } from 'rxjs/Observable'
import { defer } from 'rxjs/observable/defer'
import { PartialObserver } from 'rxjs/Observer'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import {
  map,
  scan,
  mergeMap,
  exhaust,
  mergeAll,
  switchAll,
  takeUntil,
  share,
  shareReplay,
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

export const task = <T extends AnyTaskCallback>(
  task: T,
): TaskFromCallback<T> => new Task(task)

const selectState$ = <T>(t: TaskInstance<T>) => t.state$

const enum Flatten {
  SWITCH = 'switch',
  EXHAUST = 'exhaust',
  MERGE = 'merge',
}

export class Task<T, U> implements Subscribable<T>, ISubscription {
  private _flattenType = Flatten.MERGE
  private _concurrency = Infinity
  private _autoSubscribe = false
  private _closed = false

  private readonly _subscription = new Subscription()
  private readonly _task: TaskCallback<T, U>
  private readonly _perform$ = new Subject<TaskInstance<T>>()
  private readonly _takeUntilObservable$ = new ReplaySubject<AnyObservable>(1)
  private readonly _takeUntil$ = this._takeUntilObservable$.pipe(switchAll())
  private readonly _task$ = defer(() =>
    this._perform$.pipe(this._flatten(), takeUntil(this._takeUntil$)),
  ).pipe(share())

  readonly state$ = this._perform$.pipe(
    mergeMap(selectState$, taskReducer.combineTaskInstanceWithState),
    map(toAction(taskActions.TASK_INSTANCE_STATE_UPDATE_ACTION)),
    actionReducer<TaskActions<T>, taskReducer.State<T>>(taskReducer.reducer),
    takeUntil(this._takeUntil$),
    shareReplay(1),
  )

  readonly performed$ = this.state$.pipe(map(selectPerformed))
  readonly pending$ = this.state$.pipe(map(selectPending))
  readonly running$ = this.state$.pipe(map(selectRunning))
  readonly cancelled$ = this.state$.pipe(map(selectCancelled))
  readonly successful$ = this.state$.pipe(map(selectSuccessful))
  readonly errored$ = this.state$.pipe(map(selectErrored))
  readonly completed$ = this.state$.pipe(map(selectCompleted))
  readonly last$ = this.state$.pipe(map(selectLast))
  readonly lastRunning$ = this.state$.pipe(map(selectLastRunning))
  readonly lastSuccessful$ = this.state$.pipe(map(selectLastSuccessful))
  readonly lastCancelled$ = this.state$.pipe(map(selectLastCancelled))
  readonly lastErrored$ = this.state$.pipe(map(selectLastErrored))
  readonly lastCompleted$ = this.state$.pipe(map(selectLastCompleted))

  get closed(): boolean {
    return this._closed
  }

  constructor(task: TaskCallback<T, U>) {
    this._task = task
  }

  perform(value: U): TaskInstance<T> {
    if (this._closed) throw new ObjectUnsubscribedError()

    if (this._autoSubscribe === true) {
      this.subscribe()
    }

    const task = this._createTaskInstance(this._task, value)
    return this._perform$.next(task), task
  }

  takeUntil(until$: Observable<any>): this {
    this._takeUntilObservable$.next(until$)
    return this
  }

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

  unsubscribe(): void {
    this._closed = true
    this._subscription.unsubscribe()
  }

  concurrency(
    concurrency: number,
  ): this & { switch: never; concat: never; drop: never } {
    this._flattenType = Flatten.MERGE
    this._concurrency = concurrency
    return this as any
  }

  switch(): this & { concurrency: never; concat: never; drop: never } {
    this._flattenType = Flatten.SWITCH
    return this as any
  }

  concat(): this & { concurrency: never; switch: never; drop: never } {
    return this.concurrency(1) as any
  }

  drop(): this & { concurrency: never; switch: never; concat: never } {
    this._flattenType = Flatten.EXHAUST
    return this as any
  }

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

  private _createTaskInstance(t: TaskCallback<T, U>, v: U): TaskInstance<T> {
    return new TaskInstance<T>(defer(() => t(v)))
  }
}
