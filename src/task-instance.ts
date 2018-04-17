import { Observable, Subscribable } from 'rxjs/Observable'
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable'
import { PartialObserver } from 'rxjs/Observer'
import { Subject } from 'rxjs/Subject'
import { Notification } from 'rxjs/Notification'
import { Subscription, ISubscription } from 'rxjs/Subscription'
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
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import * as taskInstance from './reducers/task-instance'
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError'

export class TaskInstance<T> implements Subscribable<T>, ISubscription {
  private _closed = false
  private readonly _observable$: Observable<T>
  private readonly _observableMirror$ = new Subject<T>()
  private readonly _currentState$ = new BehaviorSubject<taskInstance.State<T>>(
    taskInstance.PENDING_STATE,
  )
  private readonly _subscription = new Subscription()

  readonly state$ = (this._observableMirror$.pipe(
    materialize(),
    scan<Notification<T>, taskInstance.State<T>>(
      taskInstance.reducer,
      taskInstance.PENDING_STATE,
    ),
    multicast(this._currentState$),
  ) as ConnectableObservable<taskInstance.State<T>>).refCount()

  readonly stateLabel$ = this.state$.pipe(
    map(taskInstance.selectState),
    distinctUntilChanged(),
  )

  readonly isPending$ = this.stateLabel$.pipe(map(taskInstance.isPending))
  readonly isRunning$ = this.stateLabel$.pipe(map(taskInstance.isRunning))
  readonly isCancelled$ = this.stateLabel$.pipe(map(taskInstance.isCancelled))
  readonly isError$ = this.stateLabel$.pipe(map(taskInstance.isError))
  readonly isComplete$ = this.stateLabel$.pipe(map(taskInstance.isComplete))

  readonly hasValue$ = this.state$.pipe(map(taskInstance.hasValue))
  readonly currentValue$ = this.state$.pipe(
    filter(taskInstance.hasValue),
    map(taskInstance.selectValue),
  )
  readonly error$ = this.state$.pipe(map(taskInstance.selectError))

  get closed(): boolean {
    return this._closed
  }

  constructor(observable$: Observable<T>) {
    this._observable$ = (observable$.pipe(
      multicast(this._observableMirror$),
    ) as ConnectableObservable<T>).refCount()
  }

  [observable](): this {
    return this
  }

  subscribe(observer?: PartialObserver<T>): ISubscription
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): ISubscription
  subscribe(
    observerOrNext?: PartialObserver<T> | ((value: T) => void),
    error?: (error: any) => void,
    complete?: () => void,
  ): ISubscription {
    if (this._closed) throw new ObjectUnsubscribedError()

    this._currentState$.next(taskInstance.RUNNING_STATE)
    this._subscription.add(
      this._observable$.subscribe(observerOrNext as any, error, complete),
    )
    return this
  }

  unsubscribe(): void {
    this._currentState$.next(taskInstance.CANCELLED_STATE)
    this._closed = true
    this._subscription.unsubscribe()
  }
}
