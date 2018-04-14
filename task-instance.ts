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
  share,
  distinctUntilChanged,
} from 'rxjs/operators'
import { ReplaySubject } from 'rxjs/ReplaySubject'
import { TaskInstanceState } from './interfaces';

export const enum TaskState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETE = 'complete',
  ERROR = 'error',
}

const RUNNING_TASK_INSTANCE_STATE: TaskInstanceState<any> = {
  state: TaskState.RUNNING,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

const PENDING_TASK_INSTANCE_STATE: TaskInstanceState<any> = {
  state: TaskState.PENDING,
  hasValue: false,
  currentValue: undefined,
  error: null,
}

export class TaskInstance<T> implements Subscribable<T> {
  private readonly _observable$: Observable<T>
  private readonly _observableMirror$ = new Subject<T>()
  private readonly _start = new ReplaySubject<TaskInstanceState<T>>()

  readonly state$ = this._observableMirror$.pipe(
    materialize(),
    scan<Notification<T>, TaskInstanceState<T>>(
      taskInstanceReducer,
      PENDING_TASK_INSTANCE_STATE,
    ),
    startWith<TaskInstanceState<T>>(PENDING_TASK_INSTANCE_STATE),
    merge(this._start),
    share(),
  )

  readonly stateLabel$ = this.state$.pipe(
    map(selectState),
    distinctUntilChanged(),
  )

  readonly isPending = this.stateLabel$.pipe(map(isPending))
  readonly isRunning = this.stateLabel$.pipe(map(isRunning))
  readonly isError = this.stateLabel$.pipe(map(isError))
  readonly isComplete = this.stateLabel$.pipe(map(isComplete))

  readonly hasValue$ = this.state$.pipe(map(hasValue))
  readonly currentValue$ = this.state$.pipe(filter(hasValue), map(selectValue))
  readonly error$ = this.state$.pipe(map(selectError))

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
    this._start.next(RUNNING_TASK_INSTANCE_STATE)
    return this._observable$.subscribe(...arguments)
  }
}

function taskInstanceReducer<T>(
  state: TaskInstanceState<T>,
  notification: Notification<T>,
) {
  switch (notification.kind) {
    case 'N':
      return {
        ...state,
        state: TaskState.RUNNING,
        hasValue: true,
        currentValue: notification.value,
      }
    case 'E':
      return {
        ...state,
        state: TaskState.ERROR,
        error: notification.error,
      }
    case 'C':
      return { ...state, state: TaskState.COMPLETE }
    default:
      return state
  }
}

export const selectValue = <T>(s: TaskInstanceState<T>) => s.currentValue
export const selectHasValue = <T>(s: TaskInstanceState<T>) => s.hasValue
export const selectState = <T>(s: TaskInstanceState<T>) => s.state
export const selectError = <T>(s: TaskInstanceState<T>) => s.error

export const isPending = (s: TaskState) => s === TaskState.PENDING
export const isRunning = (s: TaskState) => s === TaskState.RUNNING
export const isError = (s: TaskState) => s === TaskState.ERROR
export const isComplete = (s: TaskState) => s === TaskState.COMPLETE

export const hasValue = <T>(s: TaskInstanceState<T>) =>
  selectHasValue(s) && isRunning(selectState(s))
