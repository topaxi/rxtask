import { OperatorFunction } from 'rxjs/interfaces'
import { scan, startWith } from 'rxjs/operators'
import { Action } from '../actions'

export type ActionReducerFunction<T extends Action<string>, R> = (
  acc: R | undefined,
  value: T,
) => R

const EMPTY_ACTION: Action<any> = { type: 'EMPTY_ACTION' }

export function actionReducer<T extends Action<string>, R>(
  reducer: ActionReducerFunction<T, R>,
): OperatorFunction<T, R> {
  return in$ => {
    const INITIAL_STATE = reducer(undefined, EMPTY_ACTION as T)

    return in$.pipe(scan(reducer, INITIAL_STATE), startWith(INITIAL_STATE))
  }
}
