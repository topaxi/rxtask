import { Subscription } from 'rxjs/Subscription'
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
  selectErrored,
  selectCompleted,
  selectLast,
  selectLastRunning,
  selectLastSuccessful,
  selectLastErrored,
  selectLastCompleted,
} from './reducers/task'

export const task = <T extends AnyTaskCallback>(
  task: T,
): TaskFromCallback<T> => new Task(task)

const deferTask = <T extends TaskInstance<any>>(task: T): Observable<T> =>
  defer(() => task)

const selectState$ = <T>(t: TaskInstance<T>) => t.state$

const enum Flatten {
  SWITCH = 'switch',
  EXHAUST = 'exhaust',
  MERGE = 'merge',
}

export class Task<T, U> implements Subscribable<T> {
  private _flattenType = Flatten.MERGE
  private _concurrency = Infinity
  private _autoSubscribe = false
  private _subscription = new Subscription()

  private readonly _task: TaskCallback<T, U>
  private readonly _perform$ = new Subject<TaskInstance<T>>()
  private readonly _takeUntil$ = new ReplaySubject<Observable<any>>(1)
  private readonly _task$ = defer(() =>
    this._perform$.pipe(
      map(deferTask),
      this._flatten(),
      takeUntil(this._takeUntil$.pipe(switchAll())),
    ),
  ).pipe(share())

  readonly state$ = this._perform$.pipe(
    mergeMap(selectState$, taskReducer.combineTaskAndTaskState),
    scan<taskReducer.TaskInstanceWithState<T>, taskReducer.State<T>>(
      taskReducer.reducer,
      taskReducer.INITIAL_STATE,
    ),
    shareReplay(1),
  )

  readonly performed$ = this.state$.pipe(map(selectPerformed))
  readonly pending$ = this.state$.pipe(map(selectPending))
  readonly running$ = this.state$.pipe(map(selectRunning))
  readonly successful$ = this.state$.pipe(map(selectSuccessful))
  readonly errored$ = this.state$.pipe(map(selectErrored))
  readonly completed$ = this.state$.pipe(map(selectCompleted))
  readonly last$ = this.state$.pipe(map(selectLast))
  readonly lastRunning$ = this.state$.pipe(map(selectLastRunning))
  readonly lastSuccessful$ = this.state$.pipe(map(selectLastSuccessful))
  readonly lastErrored$ = this.state$.pipe(map(selectLastErrored))
  readonly lastCompleted$ = this.state$.pipe(map(selectLastCompleted))

  constructor(task: TaskCallback<T, U>) {
    this._task = task
  }

  perform(value: U): TaskInstance<T> {
    if (this._autoSubscribe === true) {
      this.subscribe()
    }

    const task = this._createTaskInstance(this._task, value)
    this._perform$.next(task)
    return task
  }

  takeUntil(until$: Observable<any>): this {
    this._takeUntil$.next(until$)
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
    this._autoSubscribe = false
    return this._subscription.add(
      this._task$.subscribe(observerOrNext as any, error, complete),
    )
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
