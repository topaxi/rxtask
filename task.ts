import { Subscription } from 'rxjs/Subscription'
import { Observable, Subscribable } from 'rxjs/Observable'
import { defer } from 'rxjs/observable/defer'
import { PartialObserver } from 'rxjs/Observer'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { map, mergeAll, switchAll, takeUntil, share } from 'rxjs/operators'

import { TaskInstance } from './task-instance'
import { createCallableObject } from './utils'
import {
  TaskCallback,
  AnyTaskCallback,
  TaskFromCallback,
  CallableTask,
} from './interfaces'

export function task<T extends AnyTaskCallback>(task: T): TaskFromCallback<T> {
  return new Task(task)
}

function deferTask<T extends TaskInstance<any>>(task: T): Observable<T> {
  return defer(() => task)
}

export class Task<T, U> implements Subscribable<T> {
  private _switch = false
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
    return this._subscription.add(this._task$.subscribe(...arguments))
  }

  concurrency(concurrency: number): this & { switch: never; concat: never } {
    this._switch = false
    this._concurrency = concurrency
    return this as any
  }

  switch(): this & { concurrency: never; concat: never } {
    this._switch = true
    return this as any
  }

  concat(): this & { concurrency: never; switch: never } {
    return this.concurrency(1) as any
  }

  callable(): CallableTask<this> {
    return createCallableObject(this, this.perform)
  }

  private _flatten(): (...args: any[]) => Observable<T> {
    if (this._switch) return switchAll()

    return mergeAll(this._concurrency)
  }

  private _createTaskInstance(t: TaskCallback<T, U>, v: U): TaskInstance<T> {
    return new TaskInstance<T>(defer(() => t(v)))
  }
}
