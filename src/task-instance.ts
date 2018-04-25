import { Observable, Subscribable } from 'rxjs/Observable'
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable'
import { PartialObserver } from 'rxjs/Observer'
import { Subject } from 'rxjs/Subject'
import { Subscription, ISubscription } from 'rxjs/Subscription'
import { observable } from 'rxjs/symbol/observable'

import {
  map,
  filter,
  materialize,
  multicast,
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

/**
 * @class TaskInstance<T>
 * @implements {Subscribable<T>}
 * @implements {ISubscription}
 */
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

  /** @type {Observable<TaskInstanceState<T>>} */
  readonly state$ = (this._actions$.pipe(
    actionReducer<TaskInstanceActions<T>, taskInstance.State<T>>(
      taskInstance.reducer,
    ),
    multicast(this._currentState$),
  ) as ConnectableObservable<taskInstance.State<T>>).refCount()

  /** @type {Observable<TaskInstanceStateLabel<T>>} */
  readonly stateLabel$ = this.state$.pipe(
    map(taskInstance.selectState),
    distinctUntilChanged(),
  )

  /** @type {Observable<boolean>} */
  readonly isPending$ = this.stateLabel$.pipe(map(taskInstance.isPending))
  /** @type {Observable<boolean>} */
  readonly isRunning$ = this.stateLabel$.pipe(map(taskInstance.isRunning))
  /** @type {Observable<boolean>} */
  readonly isCancelled$ = this.stateLabel$.pipe(map(taskInstance.isCancelled))
  /** @type {Observable<boolean>} */
  readonly isError$ = this.stateLabel$.pipe(map(taskInstance.isError))
  /** @type {Observable<boolean>} */
  readonly isComplete$ = this.stateLabel$.pipe(map(taskInstance.isComplete))

  /** @type {Observable<boolean>} */
  readonly hasValue$ = this.state$.pipe(map(taskInstance.hasValue))
  /** @type {Observable<T>} */
  readonly currentValue$ = this.state$.pipe(
    filter(taskInstance.hasValue),
    map(taskInstance.selectValue),
  )
  /** @type {Observable<Error|null>} */
  readonly error$ = this.state$.pipe(map(taskInstance.selectError))

  /** @type {boolean} */
  get closed(): boolean {
    return this._closed
  }

  /**
   * @param {Observable<T>} observable$
   * @return {TaskInstance<T>}
   */
  constructor(observable$: Observable<T>) {
    this._observable$ = (observable$.pipe(
      multicast(this._observableMirror$),
    ) as ConnectableObservable<T>).refCount()
  }

  /** @ignore */
  [observable](): this {
    return this
  }

  subscribe(observer?: PartialObserver<T>): ISubscription
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): ISubscription
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
  ): ISubscription {
    if (this._closed) throw new ObjectUnsubscribedError()

    this._currentState$.next(taskInstance.RUNNING_STATE)
    this._subscription.add(
      this._observable$.subscribe(observerOrNext as any, error, complete),
    )
    return this
  }

  /**
   * @return {void}
   */
  unsubscribe(): void {
    this._currentState$.next(taskInstance.CANCELLED_STATE)
    this._closed = true
    this._subscription.unsubscribe()
  }
}
