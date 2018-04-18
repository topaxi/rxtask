import { Action } from '../../src/actions'
import { expect } from 'chai'
import { ActionReducerFunction } from '../../src/operators/action-reducer'

export const EMPTY_ACTION: any = { type: '__EMPTY_ACTION__' }

type ActionReducerState<T> = T extends ActionReducerFunction<any, infer S>
  ? S
  : never
type ActionReducerAction<T> = T extends ActionReducerFunction<infer A, any>
  ? A
  : never

export const createStateMatcher = <T extends ActionReducerFunction<any, any>>(
  reducer: T,
) => (
  state: ActionReducerState<T> | undefined,
  action: ActionReducerAction<T>,
  expected: Partial<ActionReducerState<T>>,
) => {
  const newState = reducer(state, action)
  expect(newState).to.deep.equal(Object.assign({}, state, expected))
  return newState
}
