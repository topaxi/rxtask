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
import { ReplaySubject } from 'rxjs/ReplaySubject'
import * as taskInstance from './reducers/task-instance'
import { ObjectUnsubscribedError } from 'rxjs/util/ObjectUnsubscribedError'
import { actionReducer } from './operators'
import {
  TaskInstanceActions,
  createNotificationAction,
} from './actions/task-instance'

export class TaskInstance<T> implements Subscribable<T>, ISubscription {
  private _closed = false
  private readonly _observable$: Observable<T>
  private readonly _observableMirror$ = new Subject<T>()
  private readonly _currentState$ = new ReplaySubject<taskInstance.State<T>>(1)
  private readonly _subscription = new Subscription()
  private readonly _observableNotifications$ = this._observableMirror$.pipe(
    materialize(),
  )
  private readonly _actions$ = this._observableNotifications$.pipe(
    map(createNotificationAction),
  )

  readonly state$ = (this._actions$.pipe(
    actionReducer<TaskInstanceActions<T>, taskInstance.State<T>>(
      taskInstance.reducer,
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
