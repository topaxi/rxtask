import { actionReducer } from '../../src/operators/action-reducer'
import { marbles } from 'rxjs-marbles'
import { stub, SinonStub } from 'sinon'
import { expect } from 'chai'

/** @test {actionReducer} */
describe('actionReducer', () => {
  let reducer: SinonStub

  beforeEach(() => {
    reducer = stub()
  })

  it(
    'set initial state',
    marbles(m => {
      reducer
        .withArgs(undefined, { type: 'EMPTY_ACTION' })
        .returns('INITIAL_STATE')

      reducer
        .withArgs('INITIAL_STATE', { type: 'REDUCE!' })
        .returns('REDUCED!')

      reducer
        .withArgs('REDUCED!', { type: 'REDUCE_AGAIN!' })
        .returns('MORE_REDUCED!')

      const avals = { a: { type: 'REDUCE!' }, b: { type: 'REDUCE_AGAIN!' } }
      const expectedvals = {
        x: 'INITIAL_STATE',
        y: 'REDUCED!',
        z: 'MORE_REDUCED!',
      }

      const a        = m.cold('--a-b-|', avals) // prettier-ignore
      const asubs    =        '^     !' // prettier-ignore
      const expected = m.cold('x-y-z-|', expectedvals)

      const r = a.pipe(actionReducer(reducer))

      m.expect(r).toBeObservable(expected)
      m.expect(a).toHaveSubscriptions(asubs)
    }),
  )
})
