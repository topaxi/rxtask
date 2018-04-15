import { Observable, Subscribable } from 'rxjs/Observable'
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable'
import { defer } from 'rxjs/observable/defer'
import { PartialObserver } from 'rxjs/Observer'
import { Subject } from 'rxjs/Subject'
import { Notification } from 'rxjs/Notification'
import { Subscription } from 'rxjs/Subscription'
import { observable } from 'rxjs/symbol/observable'

import {
  map,
  filter,
  scan,
  merge,
  materialize,
  startWith,
  multicast,
  shareReplay,
  distinctUntilChanged,
} from 'rxjs/operators'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import * as taskInstance from './reducers/task-instance'

export class TaskInstance<T> implements Subscribable<T> {
  private readonly _observable$: Observable<T>
  private readonly _observableMirror$ = new Subject<T>()
  private readonly _start = new ReplaySubject<taskInstance.State<T>>()

  readonly state$ = this._observableMirror$.pipe(
    materialize(),
    scan<Notification<T>, taskInstance.State<T>>(
      taskInstance.reducer,
      taskInstance.PENDING_STATE,
    ),
    startWith<taskInstance.State<T>>(taskInstance.PENDING_STATE),
    merge(this._start),
    shareReplay(1),
  )

  readonly stateLabel$ = this.state$.pipe(
    map(taskInstance.selectState),
    distinctUntilChanged(),
  )

  readonly isPending = this.stateLabel$.pipe(map(taskInstance.isPending))
  readonly isRunning = this.stateLabel$.pipe(map(taskInstance.isRunning))
  readonly isError = this.stateLabel$.pipe(map(taskInstance.isError))
  readonly isComplete = this.stateLabel$.pipe(map(taskInstance.isComplete))

  readonly hasValue$ = this.state$.pipe(map(taskInstance.hasValue))
  readonly currentValue$ = this.state$.pipe(
    filter(taskInstance.hasValue),
    map(taskInstance.selectValue),
  )
  readonly error$ = this.state$.pipe(map(taskInstance.selectError))

  constructor(observable$: Observable<T>) {
    this._observable$ = (observable$.pipe(
      multicast(this._observableMirror$),
    ) as ConnectableObservable<T>).refCount()
  }

  [observable](): this {
    return this
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
    this._start.next(taskInstance.RUNNING_STATE)
    return this._observable$.subscribe(...arguments)
  }
}
